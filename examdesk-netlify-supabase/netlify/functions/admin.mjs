import { json, readBody, isAdmin, store, getAttempt, saveAttempt, finalScore, scoreAnswers, questions, markingGuides } from './_shared.mjs';

async function listAttempts(db) {
  const listed = await db.list({ prefix: 'attempt:' });
  const attempts = [];
  for (const item of listed.blobs || []) {
    const a = await db.get(item.key, { type: 'json' });
    if (!a) continue;
    if (a.status === 'in_progress' && Date.now() >= Date.parse(a.expiresAt)) {
      const score = scoreAnswers(a.answers || {});
      a.objectiveScore = score.objectiveScore;
      a.objectiveMax = score.objectiveMax;
      a.status = 'submitted';
      a.submittedAt = new Date().toISOString();
      a.expired = true;
      await db.setJSON(`attempt:${a.id}`, a);
    }
    const f = a.status === 'graded' ? finalScore(a) : null;
    attempts.push({
      id: a.id,
      fullName: a.fullName,
      studentNumber: a.studentNumber,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      status: a.status,
      objectiveScore: a.objectiveScore,
      objectiveMax: a.objectiveMax,
      writtenScore: a.writtenScore,
      rawScore: f?.rawScore,
      percentage: f?.percentage,
      expired: a.expired
    });
  }
  attempts.sort((x, y) => Date.parse(y.startedAt) - Date.parse(x.startedAt));
  return attempts;
}

export default async function admin(request) {
  if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'Method not allowed.' });
  const body = request.method === 'POST' ? await readBody(request) : {};
  if (!isAdmin(request, body)) return json(401, { error: 'Incorrect administrator password. Check the password configured in Netlify.' });

  const db = store();

  // The login form sends POST with a password but no action. Treat that as a request for the dashboard list.
  if (request.method === 'GET' || !body.action) {
    const attempts = await listAttempts(db);
    return json(200, { attempts });
  }

  const { action, attemptId, marks } = body;
  const a = await getAttempt(attemptId);
  if (!a) return json(404, { error: 'Attempt not found. Refresh the submissions list and try again.' });

  if (action === 'detail') {
    return json(200, { attempt: { id: a.id, fullName: a.fullName, studentNumber: a.studentNumber, status: a.status, startedAt: a.startedAt, submittedAt: a.submittedAt, objectiveScore: a.objectiveScore, objectiveMax: a.objectiveMax, answers: a.answers, marks: a.marks }, questions: questions.filter(q => q.type === 'written').map(q => ({ ...q, guide: markingGuides[q.n] })) });
  }

  if (action === 'grade') {
    if (!['submitted', 'graded'].includes(a.status)) return json(409, { error: 'This attempt has not been submitted.' });
    let written = 0;
    const clean = {};
    for (const q of questions.filter(q => q.type === 'written')) {
      const val = Number(marks?.[q.n] ?? 0);
      if (!Number.isFinite(val) || val < 0 || val > q.marks) return json(400, { error: `Marks for question ${q.n} must be between 0 and ${q.marks}.` });
      clean[q.n] = val;
      written += val;
    }
    a.marks = clean;
    a.writtenScore = written;
    a.status = 'graded';
    a.gradedAt = new Date().toISOString();
    await saveAttempt(a);
    return json(200, { ...finalScore(a), writtenScore: written });
  }

  return json(400, { error: 'Unknown administrator action.' });
}
