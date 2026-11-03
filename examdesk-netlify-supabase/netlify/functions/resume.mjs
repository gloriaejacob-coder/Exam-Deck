import { json, getAttempt } from './_shared.mjs';
export const handler = async (event) => {
  if(event.httpMethod!=='GET') return json(405,{error:'Method not allowed.'});
  const params=event.queryStringParameters||{}; const id=params.attemptId; const token=params.accessToken; const a=await getAttempt(id);
  if(!a||a.accessToken!==token) return json(403,{error:'This saved examination session could not be verified.'});
  return json(200,{status:a.status,answers:a.answers||{},expiresAt:a.expiresAt,submittedAt:a.submittedAt,objectiveScore:a.objectiveScore,objectiveMax:a.objectiveMax});
};
