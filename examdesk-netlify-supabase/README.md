# ExamDesk — Netlify edition

A black-and-white, responsive examination portal for the supplied 30-question Website Design & Development assessment. Students can answer questions in any order using the numbered navigator. The exam duration is fixed at **35 minutes**.

## What is included

- Student start screen with name and optional student number
- 35-minute server-timestamped countdown; refreshing the browser does not restart it
- Jump-to-any-question navigator with current, answered and unanswered states
- Autosaving of answers to Netlify Blobs while the exam is in progress
- Automatic marking for multiple-choice questions 1–10 and fill-in questions 11–17
- Teacher review and manual marking for written questions 18–30
- Teacher dashboard, final percentage calculation and CSV export
- Responsive black-and-white design
- No Supabase, SQL scripts, Supabase API keys or external database account

## Important scoring note

The supplied paper describes the exam as 100 marks, but the individual section marks total **96**: MCQ 20 + fill-in 14 + short technical answers 32 + scenarios 30. ExamDesk preserves the question paper's section marks and calculates the percentage out of 96. The automatic objective section is worth 34 marks; written answers are worth 62 marks and require teacher marking.

## Deploy to Netlify

1. Extract the ZIP file.
2. Create a GitHub repository and upload the extracted project files. Do not upload `.env` files or passwords.
3. In Netlify, choose **Add new project → Import an existing project** and connect the repository.
4. Use these build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions` (already configured in `netlify.toml`)
5. In Netlify, open **Project configuration → Environment variables** and add:
   - Name: `EXAM_ADMIN_PASSWORD`
   - Value: create a strong, unique password of at least 10 characters. Keep it private and do not put it in frontend code.
6. Deploy the site. Netlify Functions and Netlify Blobs are used for server-side submission handling and persistent storage. No manual database provisioning or API-key copying is required.
7. Open the deployed website and test a student submission and teacher login before inviting students.

## Teacher dashboard

Use **Teacher access** in the site header and enter the value configured as `EXAM_ADMIN_PASSWORD`. The teacher dashboard lists attempts, allows written-answer marking, calculates final scores and exports CSV results.

## Storage and privacy

ExamDesk stores student names, optional student numbers, answers, marks and timestamps in a site-wide Netlify Blobs store named `examdesk-records`. The store is opened in the `eu-central-1` region. Netlify provisions access for Functions automatically; there are no separate storage credentials to paste into the app.

This project is a lightweight assessment prototype built on key-value storage, not a full student information system or transactional database. Before using it for high-stakes examinations or sensitive student records, have the institution review privacy, retention, access controls, backups, identity verification, concurrent submissions and applicable data-protection requirements. Restrict access to the teacher password and rotate it if exposed. Netlify Blobs does not provide a built-in retention schedule; administrators should establish a records-retention and deletion process.

## Local development

```bash
npm install
npm run dev
```

The frontend can be previewed locally, but the server functions and Blobs persistence should be tested through Netlify Dev or a deployed Netlify site. Configure `EXAM_ADMIN_PASSWORD` in the Netlify environment for the teacher dashboard.

## Technical behavior

- The server records `startedAt` and `expiresAt` when a student starts.
- The browser displays the remaining time based on the recorded expiry timestamp. A refresh cannot reset the deadline.
- Each attempt has a random session token. Save, resume and submit endpoints require that token.
- The answer key is kept in the server-side function bundle and is not sent to students.
- On submission, objective questions are scored server-side. Written responses remain pending until a teacher grades them.

## Test checklist

- Start an exam and confirm the timer begins at 35:00.
- Navigate directly to question 30, enter an answer, and return to question 1.
- Confirm the navigator marks answered questions.
- Refresh during an attempt and confirm the remaining time and saved answers return.
- Submit before time expires and confirm the objective score appears.
- Open Teacher access, inspect the attempt, grade written questions and save.
- Confirm the final score and CSV export.
- Test on a second computer or phone to confirm separate student attempts appear in the same teacher dashboard.
