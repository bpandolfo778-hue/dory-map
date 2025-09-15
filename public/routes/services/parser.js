// Simple heuristic parser (replace with GPT later)
const leadKeywords = ['quote','proposal','estimate','interested','pricing','availability','book','hire','inquiry','consult'];
const meetingKeywords = ['meet','meeting','call','zoom','google meet','schedule','reschedule','calendar','appointment'];

export function extractCandidates(text) {
  const lower = (text || '').toLowerCase();
  const isLead = leadKeywords.some(k => lower.includes(k));
  const isMeeting = meetingKeywords.some(k => lower.includes(k));

  if (isLead && !isMeeting) return { type: 'lead' };
  if (isMeeting) return { type: 'meeting' };
  return { type: 'none' };
}
