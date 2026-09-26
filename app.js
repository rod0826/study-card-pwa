const state = { exams: [], subjects: [], indexes: new Map(), exam: null, selected: new Set(), cards: [], queue: [], index: 0, studyMode: 'all', studyOrder: 'shuffle', session: { correct: 0, hesitant: 0, wrong: 0 }, archiveOpen: false };
const app = document.querySelector('#app');
const dialog = document.querySelector('#installDialog');
const subjectColors = { coral: '#ff8b81', blue: '#8db9ff', mint: '#78dfbf', violet: '#b7a4ff', amber: '#ffd36c', teal: '#70ddd7', pink: '#ffacd0' };
const progressKey = 'jianstudy:progress:v2';
const preferenceKey = 'jianstudy:preferences:v1';

const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const normalizeAnswer = (value) => String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/[\s·ㆍ.,!?"'“”‘’()[\]{}:;_-]/g, '');
const shuffle = (items) => { const copy = [...items]; for (let i = copy.length - 1; i; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
const subjectById = (id) => state.subjects.find((subject) => subject.id === id);
const examIndex = (id) => state.indexes.get(id);
const readJson = async (url) => { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) throw new Error(`${url} (${response.status})`); return response.json(); };

function getProgress() { try { return JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch { return {}; } }
function getPreferences() { try { return JSON.parse(localStorage.getItem(preferenceKey) || '{}'); } catch { return {}; } }
function setSaveState(saved) {
  const indicator = document.querySelector('.save-state');
  if (!indicator) return;
  indicator.innerHTML = `<i aria-hidden="true"></i> ${saved ? '저장됨' : '저장 공간 확인 필요'}`;
  indicator.toggleAttribute('data-error', !saved);
}
function saveProgress(card, grade) {
  try {
    const all = getProgress(); const key = `${card.setId}:${card.id}`; const old = all[key] || {};
    all[key] = { setId: card.setId, cardId: card.id, subjectId: card.subjectId, examId: state.exam.id, grade, reviewedAt: new Date().toISOString(), count: (old.count || 0) + 1, correct: (old.correct || 0) + (grade === 'correct' ? 1 : 0), hesitant: (old.hesitant || 0) + (grade === 'hesitant' ? 1 : 0), wrong: (old.wrong || 0) + (grade === 'wrong' ? 1 : 0) };
    localStorage.setItem(progressKey, JSON.stringify(all)); setSaveState(true);
  } catch { setSaveState(false); }
}
function migrateProgress() {
  if (localStorage.getItem('jianstudy:migrated:v2')) return;
  const all = getProgress();
  for (const set of ['history-mid2-1-final-2026', 'technology-mid2-1-final-2026', 'home-mid2-1-final-2026']) {
    try { const old = JSON.parse(localStorage.getItem(`study-card-progress:${set}`) || '{}'); for (const [cardId, record] of Object.entries(old)) all[`${set}:${cardId}`] = { ...record, setId: set, cardId, examId: '2026-mid2-sem1-final' }; } catch { /* malformed old data is left untouched */ }
  }
  localStorage.setItem(progressKey, JSON.stringify(all)); localStorage.setItem('jianstudy:migrated:v2', '1');
}
function savePreference() { try { const current = getPreferences(); const value = { ...current, lastExamId: state.exam?.id, selections: { ...(current.selections || {}), [state.exam?.id]: [...state.selected] } }; localStorage.setItem(preferenceKey, JSON.stringify(value)); setSaveState(true); } catch { setSaveState(false); } }
function setDocumentTitle(text) { document.title = text ? `${text} | JianStudy` : 'JianStudy | 나의 시험 원정대'; const focusTarget = app.querySelector('[data-page-focus]'); (focusTarget || app).focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function progressForExam(examId) { const valid = new Set((examIndex(examId)?.cardKeys || [])); const records = Object.values(getProgress()).filter((item) => item.examId === examId && valid.has(`${item.setId}:${item.cardId}`)); return new Set(records.map((item) => `${item.setId}:${item.cardId}`)).size; }
function lastReviewedForExam(examId) { const valid = new Set((examIndex(examId)?.cardKeys || [])); const timestamps = Object.values(getProgress()).filter((item) => item.examId === examId && item.reviewedAt && valid.has(`${item.setId}:${item.cardId}`)).map((item) => Date.parse(item.reviewedAt)).filter(Number.isFinite); return timestamps.length ? new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(Math.max(...timestamps))) : null; }
function cardCount(examId) { return (examIndex(examId)?.subjects || []).reduce((sum, item) => sum + (item.cardCount || 0), 0); }

function missionMarkup(exam, number) {
  const index = examIndex(exam.id); const total = cardCount(exam.id); const done = progressForExam(exam.id); const ready = index.subjects.filter((item) => item.setFiles.length).length; const recent = lastReviewedForExam(exam.id);
  const detail = total ? `${ready}/${index.subjects.length}과목 준비 · 카드 ${total}장${recent ? ` · 최근 ${recent}` : ''}` : `${index.subjects.length}과목 · 시험 범위 자료 준비 중`;
  return `<button class="mission ${exam.status === 'current' ? 'current' : ''}" data-action="open-exam" data-id="${exam.id}" style="--index:${number - 1}"><span class="mission-node">${String(number).padStart(2, '0')}</span><span class="mission-copy"><small>${safe(exam.label)}</small><strong>${safe(exam.title)}</strong><span>${detail}</span></span><span class="mission-status"><b>${total ? Math.round(done / total * 100) : 0}%</b><span>${total ? `${done}장 학습` : '준비 중'}</span><i class="mission-arrow">→</i></span></button>`;
}
function renderHome() {
  state.exam = null; state.selected.clear(); const active = state.exams.filter((exam) => exam.status !== 'archived'); const archived = state.exams.filter((exam) => exam.status === 'archived');
  app.innerHTML = `<section class="hero"><div><p class="eyebrow">STUDY QUEST · 2026—2027</p><h1 data-page-focus tabindex="-1">시험까지,<br><em>한 칸씩 전진!</em></h1></div><aside class="hero-note goal-note" aria-label="나의 목표 학교"><span>MY NEXT SCHOOL</span><strong>인천국제고등학교</strong><small>가슴으로 세계를, 지성으로 미래를</small></aside></section><section class="content-board"><div class="board-head"><div><h2>나의 시험 지도</h2><p>도착할 시험을 고르면 과목 퀘스트가 열려요.</p></div><span class="tiny-label">5 MISSIONS</span></div><div class="mission-map">${active.map((exam, i) => missionMarkup(exam, i + 1)).join('')}</div><button class="archive-toggle" data-action="toggle-archive">${state.archiveOpen ? '이전 시험 접기' : '이전 시험 카드 보기'} ${state.archiveOpen ? '↑' : '↓'}</button><div class="mission-map ${state.archiveOpen ? '' : 'hidden'}" style="margin-top:18px">${archived.map((exam, i) => missionMarkup(exam, i + 1)).join('')}</div></section>`;
  setDocumentTitle();
}

async function openExam(id) {
  state.exam = state.exams.find((exam) => exam.id === id); if (!state.exam) return;
  const index = examIndex(id); const preferences = getPreferences(); const saved = preferences.selections?.[id] || [];
  state.studyMode = ['all', 'new', 'weak', 'wrong'].includes(preferences.studyMode) ? preferences.studyMode : 'all'; state.studyOrder = ['shuffle', 'textbook'].includes(preferences.studyOrder) ? preferences.studyOrder : 'shuffle';
  const readyIds = index.subjects.filter((item) => item.setFiles.length).map((item) => item.subjectId); state.selected = new Set(saved.filter((subjectId) => readyIds.includes(subjectId)));
  renderExam();
}
function renderExam() {
  const index = examIndex(state.exam.id); const total = [...state.selected].reduce((sum, id) => sum + (index.subjects.find((item) => item.subjectId === id)?.cardCount || 0), 0);
  const readyIds = index.subjects.filter((item) => item.setFiles.length).map((item) => item.subjectId); const allSelected = readyIds.length > 0 && readyIds.every((id) => state.selected.has(id));
  const subjects = index.subjects.map((entry) => { const subject = subjectById(entry.subjectId); const ready = entry.setFiles.length > 0; const selected = state.selected.has(entry.subjectId); return `<button class="subject-card ${selected ? 'selected' : ''}" data-action="toggle-subject" data-id="${subject.id}" ${ready ? `aria-pressed="${selected}"` : 'disabled'} style="--subject-color:${subjectColors[subject.color]}"><span class="subject-symbol">${safe(subject.symbol)}</span>${ready ? '<span class="check" aria-hidden="true"></span>' : ''}<strong>${safe(subject.name)}</strong><small>${ready ? `${entry.cardCount}장 준비 완료` : '시험 범위 자료 준비 중'}</small></button>`; }).join('');
  app.innerHTML = `<section class="subpage"><button class="back-link" data-action="home">← 시험 지도로</button><div class="content-board"><div class="subpage-head"><div><p class="eyebrow" style="color:var(--blue)">${safe(state.exam.label)}</p><h1 class="view-title" data-page-focus tabindex="-1">${safe(state.exam.title)}</h1><p>오늘 공부할 과목을 골라 보세요. 여러 과목도 함께 할 수 있어요.</p></div><div class="subject-tools"><span class="tiny-label">${readyIds.length}/${index.subjects.length} READY</span>${readyIds.length > 1 ? `<button class="select-all" data-action="toggle-all">${allSelected ? '선택 해제' : '준비 과목 전체 선택'}</button>` : ''}</div></div><div class="subject-grid">${subjects}</div><div class="study-options"><label>복습 범위<select data-setting="studyMode"><option value="all" ${state.studyMode === 'all' ? 'selected' : ''}>전체 카드</option><option value="new" ${state.studyMode === 'new' ? 'selected' : ''}>새 카드</option><option value="weak" ${state.studyMode === 'weak' ? 'selected' : ''}>취약 카드</option><option value="wrong" ${state.studyMode === 'wrong' ? 'selected' : ''}>오답 카드</option></select></label><label>학습 순서<select data-setting="studyOrder"><option value="shuffle" ${state.studyOrder === 'shuffle' ? 'selected' : ''}>무작위</option><option value="textbook" ${state.studyOrder === 'textbook' ? 'selected' : ''}>교과서 순서</option></select></label></div><div class="selection-bar"><p><strong>${state.selected.size ? `${state.selected.size}과목 선택 · 카드 ${total}장` : readyIds.length ? '공부할 과목을 선택해요' : '아직 학습 카드가 없어요'}</strong><small>${state.selected.size ? '선택한 범위와 순서로 학습을 시작해요.' : readyIds.length ? '자료가 준비된 과목만 선택할 수 있어요.' : '시험 범위 자료를 추가하면 과목이 열려요.'}</small></p><button class="button primary" data-action="start" ${state.selected.size ? '' : 'disabled'}>퀘스트 시작 →</button></div></div></section>`;
  setDocumentTitle(state.exam.title);
}

async function startStudy() {
  const index = examIndex(state.exam.id); const entries = index.subjects.filter((entry) => state.selected.has(entry.subjectId)); state.cards = [];
  for (const entry of entries) for (const file of entry.setFiles) { const set = await readJson(file); const categories = new Map(set.categories.map((category) => [category.id, category.name])); state.cards.push(...set.cards.map((card) => ({ ...card, setId: set.id, subjectId: entry.subjectId, categoryName: categories.get(card.categoryId) || card.category || '기타' }))); }
  const progress = getProgress();
  if (state.studyMode === 'new') state.cards = state.cards.filter((card) => !progress[`${card.setId}:${card.id}`]);
  if (state.studyMode === 'weak') state.cards = state.cards.filter((card) => ['hesitant', 'wrong'].includes(progress[`${card.setId}:${card.id}`]?.grade));
  if (state.studyMode === 'wrong') state.cards = state.cards.filter((card) => progress[`${card.setId}:${card.id}`]?.grade === 'wrong');
  if (!state.cards.length) return renderEmpty();
  state.queue = state.studyOrder === 'shuffle' ? shuffle(state.cards) : [...state.cards]; state.index = 0; state.session = { correct: 0, hesitant: 0, wrong: 0 }; savePreference(); renderStudy();
}
function renderStudy() {
  const card = state.queue[state.index]; if (!card) return renderResult(); const subject = subjectById(card.subjectId); const progress = state.index / state.queue.length * 100;
  app.innerHTML = `<section class="study-shell"><div class="study-top"><button class="back-link" data-action="back-exam">← 그만하기</button><div class="progress-track" role="progressbar" aria-label="학습 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><div class="progress-fill" style="width:${progress}%"></div></div><span class="counter">${state.index + 1} / ${state.queue.length}</span></div><div class="study-grid"><article class="flashcard"><div class="card-badges"><span class="pill subject">${safe(subject.name)}</span><span class="pill">${safe(card.categoryName)}</span></div><h1 class="question" id="cardQuestion" data-page-focus tabindex="-1">${safe(card.front)}</h1><div class="answer-entry"><label class="visually-hidden" for="answerInput">카드 정답</label><input id="answerInput" aria-describedby="cardQuestion" autocomplete="off" placeholder="내 답을 적어 보세요"><button class="button primary" data-action="answer">정답 확인</button></div><div id="hint" class="reveal hint hidden">힌트 · ${safe(card.hint || '힌트 없이 한번 생각해 봐요.')}</div><div id="answer" class="reveal hidden" aria-live="polite"></div><div class="card-actions"><button class="button" data-action="hint" aria-expanded="false" aria-controls="hint">힌트 보기</button></div><div id="grades" class="grade-grid hidden"><button data-action="grade" data-grade="correct">알고 있었어!</button><button data-action="grade" data-grade="hesitant">조금 헷갈려</button><button data-action="grade" data-grade="wrong">다시 볼래</button></div></article><aside class="side-panel"><h3>이번 퀘스트</h3><div class="stat-list"><div><span>알고 있어요</span><b>${state.session.correct}</b></div><div><span>헷갈렸어요</span><b>${state.session.hesitant}</b></div><div><span>다시 볼래요</span><b>${state.session.wrong}</b></div><div><span>남은 카드</span><b>${Math.max(0, state.queue.length - state.index)}</b></div></div></div></section>`;
  setDocumentTitle(`${subject.name} 카드`); if (state.index === 0 && matchMedia('(pointer: fine)').matches) setTimeout(() => document.querySelector('#answerInput')?.focus(), 50);
}
function showAnswer() {
  const card = state.queue[state.index]; const input = document.querySelector('#answerInput'); const mine = input.value.trim();
  const accepted = [card.answer, ...(card.acceptedAnswers || [])].map(normalizeAnswer); const isCorrect = Boolean(mine) && accepted.includes(normalizeAnswer(mine));
  const answerBox = document.querySelector('#answer'); input.disabled = true; document.querySelector('[data-action="answer"]').disabled = true;
  answerBox.innerHTML = isCorrect ? `정답이에요! <strong>${safe(card.answer)}</strong>` : `정답 · <strong>${safe(card.answer)}</strong>${mine ? `<br><small>내 답 · ${safe(mine)}</small>` : ''}`;
  answerBox.classList.toggle('correct', isCorrect); answerBox.classList.remove('hidden');
  if (isCorrect) grade('correct'); else document.querySelector('#grades').classList.remove('hidden');
}
function celebrateCorrect() {
  const messages = ['좋아, 정확했어!', '한 칸 더 전진!', '기억에 제대로 남았어!', '멋져, 이건 완전히 내 것!'];
  const celebration = document.createElement('div');
  celebration.className = 'celebration'; celebration.setAttribute('role', 'status'); celebration.setAttribute('aria-live', 'polite');
  celebration.innerHTML = `<div class="celebration-burst" aria-hidden="true">${Array.from({ length: 10 }, (_, index) => `<i style="--i:${index}"></i>`).join('')}</div><span>✓</span><strong>${messages[Math.floor(Math.random() * messages.length)]}</strong>`;
  document.body.append(celebration); setTimeout(() => celebration.remove(), 720);
}
function grade(gradeValue) {
  const card = state.queue[state.index]; saveProgress(card, gradeValue); state.session[gradeValue] += 1;
  if (gradeValue === 'wrong') state.queue.splice(Math.min(state.index + 4, state.queue.length), 0, card);
  if (gradeValue === 'hesitant') state.queue.splice(Math.min(state.index + 8, state.queue.length), 0, card);
  state.index += 1;
  if (gradeValue === 'correct') { document.querySelectorAll('#grades button').forEach((button) => { button.disabled = true; }); celebrateCorrect(); setTimeout(renderStudy, 650); }
  else renderStudy();
}
function renderEmpty() { const filtered = state.cards.length === 0 && state.studyMode !== 'all'; app.innerHTML = `<section class="subpage"><div class="empty-state"><span class="big-icon">!</span><h2 data-page-focus tabindex="-1">${filtered ? '조건에 맞는 카드가 없어요' : '카드를 준비하고 있어요'}</h2><p>${filtered ? '다른 복습 범위를 선택해서 다시 시작해 보세요.' : '시험 범위 자료가 들어오면 이 과목의 퀘스트가 열려요.<br>다른 시험이나 준비된 과목을 먼저 골라 보세요.'}</p><button class="button primary" data-action="back-exam">학습 설정으로</button></div></section>`; setDocumentTitle('학습 카드'); }
function renderResult() { const first = state.session.correct + state.session.hesitant + state.session.wrong; app.innerHTML = `<section class="subpage"><div class="result"><span class="big-icon">★</span><p class="eyebrow" style="color:var(--blue)">QUEST COMPLETE</p><h2 data-page-focus tabindex="-1">오늘도 한 칸 전진!</h2><p>${first}번 생각하고 답했어요. 헷갈린 카드는 다음 퀘스트에서 다시 만나면 돼요.</p><div class="result-stats"><div><b>${state.session.correct}</b><span>알고 있어요</span></div><div><b>${state.session.hesitant}</b><span>헷갈려요</span></div><div><b>${state.session.wrong}</b><span>다시 볼래요</span></div></div><button class="button primary" data-action="restart">한 번 더 도전</button> <button class="button" data-action="home">시험 지도로</button></div></section>`; setDocumentTitle('퀘스트 완료'); }

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]'); if (!target) return; const action = target.dataset.action;
  if (action === 'home') renderHome(); else if (action === 'open-exam') openExam(target.dataset.id); else if (action === 'toggle-archive') { state.archiveOpen = !state.archiveOpen; renderHome(); } else if (action === 'toggle-subject') { state.selected.has(target.dataset.id) ? state.selected.delete(target.dataset.id) : state.selected.add(target.dataset.id); savePreference(); renderExam(); } else if (action === 'toggle-all') { const readyIds = examIndex(state.exam.id).subjects.filter((item) => item.setFiles.length).map((item) => item.subjectId); const allSelected = readyIds.every((id) => state.selected.has(id)); state.selected = new Set(allSelected ? [] : readyIds); savePreference(); renderExam(); } else if (action === 'start' || action === 'restart') startStudy(); else if (action === 'back-exam') renderExam(); else if (action === 'answer') showAnswer(); else if (action === 'hint') { const hint = document.querySelector('#hint'); hint?.classList.toggle('hidden'); target.setAttribute('aria-expanded', String(!hint?.classList.contains('hidden'))); target.textContent = hint?.classList.contains('hidden') ? '힌트 보기' : '힌트 접기'; } else if (action === 'grade') grade(target.dataset.grade);
});
document.addEventListener('click', (event) => { const target = event.target.closest('[data-action]'); const action = target?.dataset.action; if (action === 'home' && !target.closest('#app')) renderHome(); if (action === 'install') dialog.showModal(); if (action === 'close-install') dialog.close(); });
app.addEventListener('change', (event) => { const setting = event.target.dataset.setting; if (!setting) return; state[setting] = event.target.value; const current = getPreferences(); try { localStorage.setItem(preferenceKey, JSON.stringify({ ...current, [setting]: event.target.value })); setSaveState(true); } catch { setSaveState(false); } });
document.addEventListener('keydown', (event) => { if (event.key === 'Enter' && document.activeElement?.id === 'answerInput') showAnswer(); });

async function init() {
  try { migrateProgress(); } catch { setSaveState(false); } [state.exams, state.subjects] = await Promise.all([readJson('data/catalog/exams.json'), readJson('data/catalog/subjects.json')]);
  const indexes = await Promise.all(state.exams.map((exam) => readJson(exam.indexFile))); for (const index of indexes) { index.cardKeys = []; for (const entry of index.subjects) { entry.cardCount = 0; for (const file of entry.setFiles) { const set = await readJson(file); entry.cardCount += set.cards.length; index.cardKeys.push(...set.cards.map((card) => `${set.id}:${card.id}`)); } } state.indexes.set(index.examId, index); }
  renderHome();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
init().catch((error) => { app.innerHTML = `<div class="empty-state"><span class="big-icon">!</span><h2>앱을 열지 못했어요</h2><p>${safe(error.message)}<br>인터넷 연결을 확인하고 새로고침해 주세요.</p><button class="button primary" onclick="location.reload()">다시 열기</button></div>`; });
