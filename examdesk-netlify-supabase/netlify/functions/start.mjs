import { randomUUID } from 'node:crypto';
import { json, readBody, store, questions, exam, publicQuestions } from './_shared.mjs';
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed.'});
  const body=readBody(event); const fullName=String(body.fullName||'').trim(); const studentNumber=String(body.studentNumber||'').trim();
  if (fullName.length<2) return json(400,{error:'Please enter your full name.'});
  if (fullName.length>100 || studentNumber.length>40) return json(400,{error:'Please check the length of your details.'});
  const db=store(); const id=randomUUID(); const accessToken=randomUUID()+randomUUID(); const now=Date.now();
  const attempt={id,accessToken,fullName,studentNumber,startedAt:new Date(now).toISOString(),expiresAt:new Date(now+exam.durationSeconds*1000).toISOString(),status:'in_progress',answers:{},submittedAt:null,objectiveScore:null,objectiveMax:34,writtenScore:null,marks:{}};
  await db.setJSON(`attempt:${id}`,attempt);
  return json(200,{attempt:{id,accessToken,expiresAt:attempt.expiresAt,startedAt:attempt.startedAt},exam,questions:publicQuestions});
};
