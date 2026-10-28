'use strict';

/* ---------- 작은 도우미 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const stripEmoji = s => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').trim();

// 받침이 있으면 '을', 없으면 '를'
function hasBatchim(word) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
}
const eul = w => w + (hasBatchim(w) ? '을' : '를');

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
};

function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function celebrate() {
  const bits = ['🎉', '🌟', '🎈', '✨', '🎁', '💡', '🏆'];
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = pick(bits);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
    s.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4000);
  }
}

function speak(text) {
  if (!('speechSynthesis' in window)) return toast('이 기기에서는 읽어주기가 안 돼요 😢');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripEmoji(text));
  u.lang = 'ko-KR';
  u.rate = 0.95;
  u.pitch = 1.2;
  speechSynthesis.speak(u);
}

/* ---------- 데이터 ---------- */
const CARDS = [
  { emoji: '🔗', name: '합치기 카드', desc: '서로 다른 물건 2개를 찰싹! 합쳐보세요.', ex: '지우개 + 연필 = 지우개 연필', color: '#ffb3c6',
    title: o => `만능 ${o}`, idea: o => `${o}에 다른 물건을 찰싹 합쳐서 두 가지 일을 한 번에 할 수 있어요!` },
  { emoji: '🙃', name: '반대로 카드', desc: '모양이나 쓰는 방법을 거꾸로 바꿔보세요.', ex: '똑바로 서는 거꾸로 우산', color: '#a0d8ef',
    title: o => `거꾸로 ${o}`, idea: o => `${eul(o)} 거꾸로 바꿔서 더 편하게 쓸 수 있어요!` },
  { emoji: '🔍', name: '작게 접기 카드', desc: '주머니에 쏙 들어가게 작게 접어보세요.', ex: '접어서 가방에 넣는 컵', color: '#c3b5ff',
    title: o => `쏙 접는 ${o}`, idea: o => `${eul(o)} 작게 접어서 주머니에 쏙 넣을 수 있어요!` },
  { emoji: '🍕', name: '싹둑 나누기 카드', desc: '하나를 여러 조각으로 나누어 보세요.', ex: '떼어 쓰는 무지개 크레파스', color: '#ffcf8a',
    title: o => `조각조각 ${o}`, idea: o => `${eul(o)} 여러 조각으로 나눠서 필요한 만큼 떼어 써요!` },
  { emoji: '🎨', name: '변신 카드', desc: '원래 쓰는 곳 말고 다른 곳에 써보세요.', ex: '페트병으로 만든 예쁜 연필꽂이', color: '#9fe3c4',
    title: o => `변신 ${o}`, idea: o => `${eul(o)} 원래 쓰던 곳 말고 새로운 곳에 멋지게 써요!` },
  { emoji: '⏰', name: '미리 준비 카드', desc: '미리 준비되어 있어서 바로 쓸 수 있게 해보세요.', ex: '치약이 이미 묻어있는 칫솔', color: '#ffe38a',
    title: o => `준비 끝 ${o}`, idea: o => `${o}에 필요한 것이 미리 준비되어 있어서 바로 쓸 수 있어요!` },
  { emoji: '🧸', name: '말랑말랑 카드', desc: '딱딱한 것을 말랑말랑하고 안전하게 바꿔보세요.', ex: '부딪혀도 안 아픈 말랑한 자', color: '#ffc4e1',
    title: o => `말랑말랑 ${o}`, idea: o => `딱딱한 ${eul(o)} 말랑하게 바꿔서 부딪혀도 안 아파요!` },
  { emoji: '👻', name: '펑! 없애기 카드', desc: '필요 없는 부분이나 불편한 곳을 없애보세요.', ex: '선이 없는 무선 줄넘기', color: '#d6dcff',
    title: o => `펑! 편한 ${o}`, idea: o => `${o}의 불편한 부분을 펑! 없애서 훨씬 편해졌어요!` },
];

const OBJECTS = [
  ['👟', '실내화'], ['👝', '필통'], ['☂️', '우산'], ['🥤', '컵'], ['🎒', '가방'], ['✏️', '연필'],
  ['🪑', '의자'], ['🪥', '칫솔'], ['🧢', '모자'], ['🧤', '장갑'], ['🥄', '숟가락'], ['🧸', '인형'],
];

const PROBLEMS = [
  { label: '비 오는 날 우산이 젖어요 ☔', react: '우산이 젖어서 옷도 젖는구나! 🌧️', ideas: [
    { label: '털면 물방울이 싹 사라지면 좋겠어!', react: '톡톡 털면 물방울이 사라지다니 정말 멋지다!',
      desc: '톡톡 털기만 하면 물방울이 싹 사라지는 신기한 우산이에요!', names: ['물방울 싹 우산 ☔', '톡톡 털이 우산 💧'] },
    { label: '우산에 가방을 달아서 쏙 넣을래!', react: '가방이 달린 우산이라니 정말 멋지다!',
      desc: '젖은 우산을 우산에 달린 가방에 쏙 넣어서 옷이 젖지 않아요!', names: ['쏙 가방 우산 🎒', '보송 주머니 우산 👜'] },
    { label: '바람이 나와서 물을 말려주면 좋겠어!', react: '바람이 나오는 우산이라니 정말 멋지다!',
      desc: '버튼을 누르면 바람이 솔솔 나와서 빗물을 금방 말려주는 신기한 우산이에요!', names: ['뽀송뽀송 바람 우산 🌬️', '물방울 싹 우산 ☔'] },
  ] },
  { label: '알림장 쓰기가 너무 귀찮아요 📝', react: '알림장 쓰기가 힘들었구나! ✏️', ideas: [
    { label: '말하면 글씨로 써지면 좋겠어!', react: '말만 하면 글씨가 써지다니 정말 대단하다!',
      desc: '선생님 말씀을 들으면 저절로 글씨로 써 주는 똑똑한 알림장이에요!', names: ['척척 받아쓰기 알림장 🗣️', '요정 연필 🧚'] },
    { label: '사진을 찍으면 알림장이 완성되면 좋겠어!', react: '찰칵 한 번에 알림장 완성이라니 최고야!',
      desc: '칠판을 찰칵 찍으면 알림장이 뚝딱 완성돼요!', names: ['찰칵 알림장 카메라 📸', '뚝딱 알림장 📒'] },
    { label: '엄마 아빠한테 바로 알려주면 좋겠어!', react: '알아서 알려주는 알림장이라니 정말 똑똑하다!',
      desc: '알림장을 쓰면 엄마 아빠에게 바로 띵동! 알려주는 알림장이에요!', names: ['띵동 알림장 🔔', '슝슝 편지 알림장 📨'] },
  ] },
  { label: '장난감 정리가 힘들어요 🧸', react: '장난감이 여기저기 흩어져 있구나! 🧸', ideas: [
    { label: '장난감이 스스로 집에 돌아가면 좋겠어!', react: '장난감이 혼자 집에 간다니 정말 신기하다!',
      desc: '노래를 틀면 장난감이 스스로 제자리로 쏙쏙 돌아가요!', names: ['집으로 쏙 장난감 🏠', '노래하는 정리함 🎵'] },
    { label: '자석으로 착 붙으면 좋겠어!', react: '자석으로 착착 정리하다니 정말 똑똑하다!',
      desc: '커다란 자석 상자에 장난감이 착착 붙어서 한 번에 정리돼요!', names: ['착착 자석 상자 🧲', '찰싹 정리함 📦'] },
    { label: '로봇이 정리해 주면 좋겠어!', react: '정리 로봇이라니 정말 멋지다!',
      desc: '바닥을 돌아다니며 장난감을 쏙쏙 주워 담는 정리 로봇이에요!', names: ['쏙쏙 정리 로봇 🤖', '냠냠 장난감 먹보 공룡 🦖'] },
  ] },
];

const GENERIC_IDEAS = [
  { label: '버튼만 누르면 뚝딱 해결되면 좋겠어!', react: '버튼 하나로 뚝딱이라니 정말 멋지다!',
    desc: '버튼만 누르면 불편한 점을 뚝딱 해결해 주는 발명품이에요!', names: ['뚝딱 요술 버튼 🔘', '척척 해결사 ⭐'] },
  { label: '로봇이 대신 해 주면 좋겠어!', react: '나를 도와주는 로봇이라니 정말 대단하다!',
    desc: '불편한 일을 대신 척척 해 주는 친절한 도우미 로봇이에요!', names: ['척척 도우미 로봇 🤖', '팡팡 친구 로봇 🐿️'] },
  { label: '요술처럼 저절로 되면 좋겠어!', react: '저절로 되는 요술이라니 정말 신기하다!',
    desc: '요술 가루를 뿌리면 불편한 일이 저절로 해결돼요!', names: ['반짝 요술 가루 ✨', '뿅뿅 마법 상자 🪄'] },
];
const GENERIC_NAMES = ['반짝반짝 발명품 ✨', '팡팡 요술 발명품 🪄'];

/* ---------- 탐험가 이름 ---------- */
const explorerInput = $('#explorer');
explorerInput.value = store.get('pangpang-explorer', '');
explorerInput.addEventListener('input', () => store.set('pangpang-explorer', explorerInput.value.trim()));
const inventorName = () => (explorerInput.value.trim() || '멋진') + ' 탐험가';

/* ---------- 보물상자 ---------- */
let box = store.get('pangpang-box-v1', []);
if (!Array.isArray(box)) box = [];

function persistBox() {
  if (!store.set('pangpang-box-v1', box)) toast('앗! 보물상자가 꽉 찼어요. 몇 개를 버려 주세요 🗑️');
}

function stickerHTML(item, withActions = true) {
  return `
    <div class="stamp">참 잘했어요!</div>
    <div class="sticker-title"><span class="crown">🏆</span> 팡팡이의 발명 왕관 스티커</div>
    <h3>📌 ${esc(item.name)}</h3>
    <p class="meta">👤 멋진 발명가: ${esc(item.inventor)}</p>
    <p class="meta">${esc(item.source)} · ${esc(item.date)}</p>
    ${item.problem ? `<p class="problem">😣 불편했던 점: ${esc(item.problem)}</p>` : ''}
    <div class="desc">💡 어떤 물건인가요?<br>${esc(item.desc)}</div>
    ${item.drawing ? `<img src="${item.drawing}" alt="${esc(item.name)} 그림">` : ''}
    ${withActions ? `<div class="actions">
      <button class="btn sky" data-act="draw">🖍️ 그림</button>
      <button class="btn yellow" data-act="print">🖨️ 프린트</button>
      <button class="btn" data-act="del" aria-label="버리기">🗑️</button>
    </div>` : ''}`;
}

function renderBox() {
  $('#boxCount').textContent = box.length;
  $('#boxEmpty').classList.toggle('hidden', box.length > 0);
  $('#boxGrid').innerHTML = box.map(item => `<article class="sticker" data-id="${item.id}">${stickerHTML(item)}</article>`).join('');
}

function saveInvention({ name, desc, source, problem = '' }) {
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim() || '이름 없는 발명품',
    inventor: inventorName(),
    desc: desc.trim() || '세상에 하나뿐인 멋진 발명품이에요!',
    source, problem,
    date: new Date().toLocaleDateString('ko-KR'),
    drawing: null,
  };
  box.unshift(item);
  persistBox();
  renderBox();
  celebrate();
  toast('🎁 보물상자에 쏙! 저장했어요');
}

$('#boxGrid').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const card = btn.closest('.sticker');
  const item = box.find(b => b.id === card.dataset.id);
  if (!item) return;
  if (btn.dataset.act === 'del') {
    if (confirm(`'${item.name}'을(를) 보물상자에서 버릴까요?`)) {
      box = box.filter(b => b !== item);
      persistBox();
      renderBox();
    }
  } else if (btn.dataset.act === 'print') {
    card.classList.add('printing');
    document.body.classList.add('print-one');
    window.print();
  } else if (btn.dataset.act === 'draw') {
    openPad(item);
  }
});
window.addEventListener('afterprint', () => {
  document.body.classList.remove('print-one');
  $$('.printing').forEach(el => el.classList.remove('printing'));
});

/* ---------- 탭 ---------- */
let chatStarted = false;
function showTab(name) {
  $$('.tab').forEach(b => {
    const on = b.dataset.tab === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on);
  });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === name));
  if (name === 'chat' && !chatStarted) startChat();
}
$$('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* ---------- 탭 1: 트리즈 카드 발명기 ---------- */
const cardState = { card: null, obj: null, objEmoji: '' };
let shuffling = false;

function cardFaceHTML(c) {
  return `<div class="card-emoji">${c.emoji}</div>
    <div class="card-name">${esc(c.name)}</div>
    <div class="card-desc">${esc(c.desc)}</div>
    <div class="card-ex">예) ${esc(c.ex)}</div>`;
}

$('#drawBtn').addEventListener('click', async () => {
  if (shuffling) return;
  shuffling = true;
  const el = $('#trizCard');
  el.classList.remove('revealed');
  el.classList.add('shuffling');
  let i = 0;
  const t = setInterval(() => { $('#shuffleEmoji').textContent = CARDS[i++ % CARDS.length].emoji; }, 90);
  await sleep(900);
  clearInterval(t);
  let c;
  do { c = pick(CARDS); } while (c === cardState.card);
  cardState.card = c;
  const front = $('#cardFront');
  front.style.setProperty('--card-color', c.color);
  front.innerHTML = cardFaceHTML(c);
  el.classList.remove('shuffling');
  el.classList.add('revealed');
  $('#shuffleEmoji').textContent = '❓';
  $('#drawBtn').textContent = '🎲 다시 뽑기';
  $('#objStep').classList.remove('locked');
  shuffling = false;
  updateResult();
});

function renderObjects() {
  $('#objects').innerHTML = OBJECTS.map(([e, n]) =>
    `<button class="obj" data-obj="${n}" data-emoji="${e}"><span class="e">${e}</span>${n}</button>`).join('')
    + `<button class="obj" data-write="1"><span class="e">📝</span>직접 쓰기</button>`;
}

$('#objects').addEventListener('click', e => {
  const b = e.target.closest('.obj');
  if (!b) return;
  $$('.obj').forEach(o => o.classList.toggle('selected', o === b));
  if (b.dataset.write) {
    $('#objForm').classList.remove('hidden');
    $('#objInput').focus();
    return;
  }
  $('#objForm').classList.add('hidden');
  cardState.obj = b.dataset.obj;
  cardState.objEmoji = b.dataset.emoji;
  updateResult();
});

$('#objForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#objInput').value.trim();
  if (!v) return $('#objInput').focus();
  cardState.obj = v;
  cardState.objEmoji = '📦';
  updateResult();
});

function updateResult() {
  const { card, obj, objEmoji } = cardState;
  if (!card || !obj) return;
  $('#resultStep').classList.remove('locked');
  $('#equation').innerHTML = `<span class="pill">${card.emoji} ${esc(card.name.replace(' 카드', ''))}</span> +
    <span class="pill">${objEmoji} ${esc(obj)}</span> = <span class="pill">💡 새 발명품!</span>`;
  $('#ideaName').value = card.title(obj);
  $('#ideaDesc').value = card.idea(obj);
}

$('#saveCardIdea').addEventListener('click', () => {
  const { card, obj } = cardState;
  if (!card || !obj) return;
  saveInvention({
    name: $('#ideaName').value,
    desc: $('#ideaDesc').value,
    source: `🃏 ${card.name} + ${obj}`,
  });
});

$('#dexGrid').innerHTML = CARDS.map((c, i) =>
  `<div class="dex-item" style="background:${c.color}"><b>${i + 1}. ${c.emoji} ${esc(c.name)}</b>${esc(c.desc)}<br><small>예) ${esc(c.ex)}</small></div>`).join('');

/* ---------- 탭 2: 발명 친구 팡팡이 ---------- */
const chat = { problem: '', idea: null, token: 0 };
const log = $('#chatLog');
const choicesEl = $('#choices');
const writeForm = $('#writeForm');
const writeInput = $('#writeInput');
let onWrite = null;

function addMsg(role, html) {
  const m = document.createElement('div');
  m.className = 'msg ' + role;
  m.innerHTML = `<div class="avatar">${role === 'bot' ? '🐿️' : '🧒'}</div><div class="bubble">${html}</div>`;
  log.appendChild(m);
  m.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return m;
}

// text는 문자열이거나 문자열을 돌려주는 Promise
async function botSay(text) {
  const token = chat.token;
  const m = addMsg('bot', '<span class="dots"><i></i><i></i><i></i></span>');
  const [t] = await Promise.all([text, sleep(700)]);
  if (token !== chat.token) return false; // 그 사이 처음부터 다시 시작함
  const bubble = m.querySelector('.bubble');
  bubble.innerHTML = esc(t) + ' <button class="speak" aria-label="읽어주기">🔊</button>';
  bubble.querySelector('.speak').addEventListener('click', () => speak(t));
  m.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return true;
}

function setChoices(list, writeHandler) {
  choicesEl.innerHTML = '';
  writeForm.classList.add('hidden');
  onWrite = null;
  list.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip ' + (c.cls || '');
    b.textContent = c.label;
    b.addEventListener('click', () => {
      clearChoices();
      if (!c.silent) addMsg('kid', esc(c.label));
      c.onPick();
    });
    choicesEl.appendChild(b);
  });
  if (writeHandler) {
    const b = document.createElement('button');
    b.className = 'chip write';
    b.textContent = writeHandler.label;
    b.addEventListener('click', () => {
      choicesEl.innerHTML = '';
      onWrite = writeHandler.onWrite;
      writeForm.classList.remove('hidden');
      writeInput.value = '';
      writeInput.placeholder = writeHandler.placeholder;
      writeInput.focus();
    });
    choicesEl.appendChild(b);
  }
}

function clearChoices() {
  choicesEl.innerHTML = '';
  writeForm.classList.add('hidden');
}

writeForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = writeInput.value.trim();
  if (!v || !onWrite) return writeInput.focus();
  const handler = onWrite;
  clearChoices();
  addMsg('kid', esc(v));
  handler(v);
});

// AI(Gemini)가 연결되어 있으면 사용하고, 아니면 null을 돌려줘서 정해진 대사를 씀
async function askAI(payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (typeof j.reply !== 'string' || !j.reply.trim()) return null;
    const choices = Array.isArray(j.choices) ? j.choices.filter(s => typeof s === 'string' && s.trim()).slice(0, 3) : [];
    return { reply: j.reply.trim(), choices };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function startChat() {
  chatStarted = true;
  chat.token++;
  chat.problem = '';
  chat.idea = null;
  log.innerHTML = '';
  clearChoices();
  if (!await botSay('안녕! 나는 발명 친구 팡팡이야 🐿️ 오늘 생활하면서 어떤 점이 불편했니?')) return;
  setChoices(
    PROBLEMS.map(p => ({ label: p.label, onPick: () => pickProblem(p) })),
    { label: '직접 쓸래요! ✏️', placeholder: '불편했던 점을 써요 (예: 신발끈이 자꾸 풀려요)', onWrite: customProblem },
  );
}

async function pickProblem(p) {
  chat.problem = stripEmoji(p.label);
  if (!await botSay(`${p.react} 만약 요술 지팡이가 있다면 어떻게 해결하고 싶니? 🪄`)) return;
  offerIdeas(p.ideas);
}

async function customProblem(text) {
  chat.problem = text;
  const ai = askAI({ stage: 'problem', problem: text });
  let ideas = GENERIC_IDEAS;
  const ok = await botSay(ai.then(res => {
    if (res && res.choices.length) {
      ideas = res.choices.map(label => ({ label, desc: label }));
      return res.reply;
    }
    return `"${text}" 정말 불편했겠다! 😢 만약 요술 지팡이가 있다면 어떻게 해결하고 싶니? 🪄`;
  }));
  if (ok) offerIdeas(ideas);
}

function offerIdeas(ideas) {
  setChoices(
    ideas.map(idea => ({ label: idea.label, onPick: () => pickIdea(idea) })),
    { label: '직접 쓸래요! ✏️', placeholder: '어떻게 해결하고 싶어? (예: 신발끈이 자석이면 좋겠어)',
      onWrite: text => pickIdea({ label: text, desc: text }) },
  );
}

async function pickIdea(idea) {
  chat.idea = idea;
  let names = idea.names || GENERIC_NAMES;
  let say;
  if (idea.react) {
    say = `와, 대단해! ${idea.react} 이 발명품의 이름은 뭐라고 지을까? 🌟`;
  } else {
    say = askAI({ stage: 'idea', problem: chat.problem, idea: idea.label }).then(res => {
      if (res && res.choices.length) {
        names = res.choices.slice(0, 2);
        return res.reply;
      }
      return '와, 정말 멋진 생각이야! 💡 이 발명품의 이름은 뭐라고 지을까? 🌟';
    });
  }
  if (!await botSay(say)) return;
  setChoices(
    names.map(n => ({ label: n, onPick: () => finish(n) })),
    { label: '내가 직접 이름 지을래! 🎨', placeholder: '발명품 이름을 써요', onWrite: finish },
  );
}

async function finish(rawName) {
  const name = stripEmoji(rawName) || rawName;
  const desc = chat.idea.desc;
  const problem = chat.problem;
  if (!await botSay(`짝짝짝! 👏 "${name}" 발명품이 완성됐어! 보물상자에 저장해 볼까? 🎁`)) return;
  const preview = { name, inventor: inventorName(), desc, problem, source: '🤖 팡팡이와 대화', date: new Date().toLocaleDateString('ko-KR') };
  const wrap = document.createElement('article');
  wrap.className = 'sticker';
  wrap.innerHTML = stickerHTML(preview, false);
  log.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
  setChoices([
    { label: '🎁 보물상자에 저장', cls: 'go', silent: true, onPick: async () => {
      saveInvention({ name, desc, problem, source: '🤖 팡팡이와 대화' });
      if (!await botSay('보물상자에 쏙 넣었어! 🌟 또 발명해 볼까?')) return;
      setChoices([
        { label: '🔄 새 발명 시작하기', cls: 'go', silent: true, onPick: startChat },
        { label: '🎁 보물상자 보러 가기', silent: true, onPick: () => { showTab('box'); restartChoice(); } },
      ]);
    } },
    { label: '🔄 처음부터 다시', silent: true, onPick: startChat },
  ]);
}

function restartChoice() {
  setChoices([{ label: '🔄 새 발명 시작하기', cls: 'go', silent: true, onPick: startChat }]);
}

/* ---------- 그림판 ---------- */
const dlg = $('#drawDialog');
const pad = $('#pad');
const ctx = pad.getContext('2d');
const COLORS = ['#3b2f2f', '#ff4d6d', '#ff9f1c', '#ffd60a', '#2ec4b6', '#3a86ff', '#8338ec', '#8d5524'];
let penColor = COLORS[0];
let erasing = false;
let padItem = null;

$('#palette').innerHTML = COLORS.map((c, i) =>
  `<button class="swatch${i ? '' : ' on'}" data-color="${c}" style="background:${c}" aria-label="색 ${i + 1}"></button>`).join('')
  + '<button class="swatch tool" data-eraser="1" aria-label="지우개">🧽</button>';

$('#palette').addEventListener('click', e => {
  const b = e.target.closest('.swatch');
  if (!b) return;
  $$('.swatch').forEach(s => s.classList.toggle('on', s === b));
  erasing = !!b.dataset.eraser;
  if (!erasing) penColor = b.dataset.color;
});

function clearPad() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, pad.width, pad.height);
}

function openPad(item) {
  padItem = item;
  clearPad();
  if (item.drawing) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, pad.width, pad.height);
    img.src = item.drawing;
  }
  dlg.showModal();
}

let last = null;
function padPoint(e) {
  const r = pad.getBoundingClientRect();
  return { x: (e.clientX - r.left) * pad.width / r.width, y: (e.clientY - r.top) * pad.height / r.height };
}
pad.addEventListener('pointerdown', e => {
  pad.setPointerCapture(e.pointerId);
  last = padPoint(e);
  stroke(last, last);
});
pad.addEventListener('pointermove', e => {
  if (!last) return;
  const p = padPoint(e);
  stroke(last, p);
  last = p;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => pad.addEventListener(t, () => { last = null; }));

function stroke(a, b) {
  ctx.strokeStyle = erasing ? '#fff' : penColor;
  ctx.lineWidth = erasing ? 28 : 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

$('#padClear').addEventListener('click', clearPad);
$('#padSave').addEventListener('click', () => {
  if (padItem) {
    padItem.drawing = pad.toDataURL('image/jpeg', 0.8);
    persistBox();
    renderBox();
    toast('🖍️ 그림을 붙였어요!');
  }
  dlg.close();
});

/* ---------- 시작 ---------- */
renderObjects();
renderBox();
