import { json, getAttempt } from './_shared.mjs';

export default async function resume(request) {
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed.' });
  const params = new URL(request.url).searchParams;
  const id = params.get('attemptId');
  const token = params.get('accessToken');
  const a = await getAttempt(id);
  if (!a || a.accessToken !== token) return json(403, { error: 'This saved examination session could not be verified.' });
  return json(200, { status: a.status, answers: a.answers || {}, expiresAt: a.expiresAt, submittedAt: a.submittedAt, objectiveScore: a.objectiveScore, objectiveMax: a.objectiveMax });
}
