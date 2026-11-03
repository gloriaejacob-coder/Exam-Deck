import { json, readBody, getAttempt, saveAttempt } from './_shared.mjs';

export default async function save(request) {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { attemptId, accessToken, answers } = await readBody(request);
  const a = await getAttempt(attemptId);
  if (!a || a.accessToken !== accessToken) return json(403, { error: 'This examination session could not be verified.' });
  if (a.status !== 'in_progress') return json(409, { error: 'This examination has already been submitted.' });
  if (Date.now() >= Date.parse(a.expiresAt)) return json(410, { error: 'The examination time has expired.' });
  a.answers = answers && typeof answers === 'object' ? answers : {};
  a.lastSavedAt = new Date().toISOString();
  await saveAttempt(a);
  return json(200, { saved: true, savedAt: a.lastSavedAt });
}
