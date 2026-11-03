import { json, readBody, getAttempt, saveAttempt, scoreAnswers } from './_shared.mjs';

export default async function submit(request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { attemptId, accessToken, answers } = await readBody(request);
  const a = await getAttempt(attemptId);
  if (!a || a.accessToken !== accessToken) return json(403, { error: 'This examination session could not be verified.' });
  if (a.status !== 'in_progress') return json(409, { error: 'This examination has already been submitted.' });
  a.answers = answers && typeof answers === 'object' ? answers : a.answers;
  const score = scoreAnswers(a.answers);
  a.objectiveScore = score.objectiveScore;
  a.objectiveMax = score.objectiveMax;
  a.status = 'submitted';
  a.submittedAt = new Date().toISOString();
  a.expired = Date.now() >= Date.parse(a.expiresAt);
  a.writtenScore = null;
  await saveAttempt(a);
  return json(200, { message: 'Your examination has been submitted successfully.', objectiveScore: a.objectiveScore, objectiveMax: a.objectiveMax, writtenPending: true });
}
