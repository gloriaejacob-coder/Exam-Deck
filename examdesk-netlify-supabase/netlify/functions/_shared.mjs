import { getStore } from '@netlify/blobs';
import { questions, exam, markingGuides } from '../../src/questions.js';

export const store = () => getStore({ name: 'examdesk-records', region: 'eu-central-1', consistency: 'strong' });
export const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
export const readBody = (event) => { try { return JSON.parse(event.body || '{}'); } catch { return {}; } };
export const publicQuestions = questions.map(({correct,accepted,...q}) => q);
export const normalize = (s='') => String(s).trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
export const isAdmin = (event, body={}) => {
  const expected = process.env.EXAM_ADMIN_PASSWORD || '';
  const supplied = event.headers?.['x-admin-password'] || event.headers?.['X-Admin-Password'] || body.adminPassword || '';
  return expected.length >= 10 && supplied === expected;
};
export async function getAttempt(id) { return await (await store()).get(`attempt:${id}`, { type: 'json' }); }
export async function saveAttempt(attempt) { await (await store()).setJSON(`attempt:${attempt.id}`, attempt); }
export function scoreAnswers(answers={}) {
  let score=0, max=0;
  for (const q of questions.filter(x=>x.type!=='written')) {
    max += q.marks;
    const a=answers[String(q.n)] ?? '';
    if (q.type==='mcq' && a!=='' && a!==null && a!==undefined && Number(a)===q.correct) score += q.marks;
    if (q.type==='short' && q.accepted.some(v=>normalize(v)===normalize(a))) score += q.marks;
  }
  return { objectiveScore:score, objectiveMax:max };
}
export function finalScore(attempt) {
  const objective=attempt.objectiveScore ?? 0;
  const written=attempt.writtenScore ?? 0;
  const raw=objective+written;
  return { rawScore:raw, totalMarks:exam.totalMarks, percentage:Number((raw/exam.totalMarks*100).toFixed(2)) };
}
export { questions, exam, markingGuides };
