// Vercel 서버리스 함수: 어린이가 직접 쓴 말에 팡팡이가 Gemini로 대답합니다.
// GEMINI_API_KEY 환경 변수가 없으면 503을 돌려주고, 화면은 정해진 대사로 계속 동작합니다.

const SYSTEM_PROMPT = `당신은 7세~8세 초등학교 1학년 어린이의 친근한 발명 친구 '팡팡이'(다람쥐 🐿️)입니다.
- 다정하고 따뜻하고 쾌활한 반말 말투를 사용하고, 문장은 짧게(2줄 이내) 작성하세요.
- 이모티콘(🎈, 🌟, 🎁, 💡)을 자주 사용하세요.
- 1학년 어린이가 바로 이해할 수 있는 쉬운 낱말만 쓰세요.
- 절대로 길고 복잡한 설명을 하지 마세요.
- 위험하거나 어린이에게 맞지 않는 내용이 나오면, 나무라지 말고 안전하고 즐거운 발명 이야기로 부드럽게 돌려주세요.
- 반드시 다음 JSON 형식으로만 답하세요: {"reply": "팡팡이의 말", "choices": ["선택지", ...]}`;

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function buildPrompt({ stage, problem, idea }) {
  if (stage === 'problem') {
    return `어린이가 말한 불편한 점: "${problem}"
reply: 공감하는 한마디와 함께 "만약 요술 지팡이가 있다면 어떻게 해결하고 싶니? 🪄"라고 물어보세요.
choices: 어린이가 고를 수 있는 신나는 해결 상상 3개를 "~면 좋겠어!" 말투로, 각각 20자 안쪽으로 쓰세요.`;
  }
  return `불편한 점: "${problem}"
어린이의 해결 아이디어: "${idea}"
reply: 아이디어를 신나게 칭찬하고 "이 발명품의 이름은 뭐라고 지을까? 🌟"라고 물어보세요.
choices: 귀엽고 부르기 쉬운 발명품 이름 2개를, 각각 끝에 이모지 1개를 붙여 12자 안쪽으로 쓰세요.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI not configured' });

  const body = typeof req.body === 'string' ? safeJSON(req.body) : req.body || {};
  const stage = body.stage === 'idea' ? 'idea' : 'problem';
  const problem = clean(body.problem, 60);
  const idea = clean(body.idea, 60);
  if (!problem || (stage === 'idea' && !idea)) return res.status(400).json({ error: 'missing text' });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt({ stage, problem, idea }) }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('Gemini error', r.status, await r.text());
      return res.status(502).json({ error: 'AI error' });
    }
    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    const out = safeJSON(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    const reply = clean(out?.reply, 150);
    if (!reply) return res.status(502).json({ error: 'empty reply' });
    const choices = (Array.isArray(out.choices) ? out.choices : [])
      .map(c => clean(c, 30))
      .filter(Boolean)
      .slice(0, stage === 'problem' ? 3 : 2);
    return res.status(200).json({ reply, choices });
  } catch (err) {
    console.error('Gemini request failed', err);
    return res.status(502).json({ error: 'AI unavailable' });
  }
}

function safeJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}
