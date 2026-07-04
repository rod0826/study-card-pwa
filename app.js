const state = {
  sets: [],
  currentSet: null,
  cards: [],
  queue: [],
  index: 0,
  shuffled: true,
};

const $ = (id) => document.getElementById(id);

const els = {
  installCard: $('installCard'),
  installButton: $('installButton'),
  installGuide: $('installGuide'),
  setupPanel: $('setupPanel'),
  studyPanel: $('studyPanel'),
  setSelect: $('setSelect'),
  setMeta: $('setMeta'),
  modeSelect: $('modeSelect'),
  categorySelect: $('categorySelect'),
  startBtn: $('startBtn'),
  shuffleBtn: $('shuffleBtn'),
  backBtn: $('backBtn'),
  progressBar: $('progressBar'),
  counter: $('counter'),
  categoryBadge: $('categoryBadge'),
  typeBadge: $('typeBadge'),
  question: $('question'),
  answerInput: $('answerInput'),
  hintBox: $('hintBox'),
  answerBox: $('answerBox'),
  hintBtn: $('hintBtn'),
  showAnswerBtn: $('showAnswerBtn'),
  gradeActions: $('gradeActions'),
  statCorrect: $('statCorrect'),
  statHesitant: $('statHesitant'),
  statWrong: $('statWrong'),
  statNew: $('statNew'),
  resetProgressBtn: $('resetProgressBtn'),
};

function storageKey(setId) {
  return `study-card-progress:${setId}`;
}

function getProgress() {
  if (!state.currentSet) return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey(state.currentSet.id)) || '{}');
  } catch {
    return {};
  }
}

function setProgress(cardId, grade) {
  const progress = getProgress();
  progress[cardId] = {
    grade,
    reviewedAt: new Date().toISOString(),
    count: (progress[cardId]?.count || 0) + 1,
  };
  localStorage.setItem(storageKey(state.currentSet.id), JSON.stringify(progress));
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[·ㆍ]/g, '')
    .toLowerCase();
}

function typeLabel(type) {
  return type === 'sequence' ? '순서' : type === 'relation' ? '원인·결과' : '빈칸';
}

async function loadSets() {
  const res = await fetch('data/sets.json', { cache: 'no-store' });
  state.sets = await res.json();
  els.setSelect.innerHTML = state.sets
    .map((set) => `<option value="${set.id}">${set.title} · ${set.subject}</option>`)
    .join('');
  await loadSelectedSet();
}

async function loadSelectedSet() {
  const selected = state.sets.find((set) => set.id === els.setSelect.value) || state.sets[0];
  if (!selected) return;
  const res = await fetch(selected.file, { cache: 'no-store' });
  state.currentSet = await res.json();
  state.cards = state.currentSet.cards || [];

  els.setMeta.innerHTML = `
    <strong>${state.currentSet.grade} · ${state.currentSet.exam}</strong><br />
    ${state.currentSet.description}<br />
    <span>${state.cards.length}장 · ${state.currentSet.categories.length}개 단원</span>
  `;

  els.categorySelect.innerHTML = '<option value="all">전체 단원</option>' +
    state.currentSet.categories.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
  updateStats();
}

function filteredCards() {
  const progress = getProgress();
  const mode = els.modeSelect.value;
  const category = els.categorySelect.value;

  return state.cards.filter((card) => {
    const record = progress[card.id];
    const categoryOk = category === 'all' || card.category === category;
    if (!categoryOk) return false;
    if (mode === 'new') return !record;
    if (mode === 'wrong') return record?.grade === 'wrong';
    if (mode === 'weak') return record?.grade === 'wrong' || record?.grade === 'hesitant';
    return true;
  });
}

function startStudy() {
  const cards = filteredCards();
  state.queue = state.shuffled ? shuffle(cards) : [...cards];
  state.index = 0;
  els.setupPanel.classList.add('hidden');
  els.studyPanel.classList.remove('hidden');
  if (!state.queue.length) {
    els.question.textContent = '조건에 맞는 카드가 없어요. 다른 모드나 단원을 선택해 주세요.';
    els.categoryBadge.textContent = '완료';
    els.typeBadge.textContent = '카드 없음';
    els.answerInput.disabled = true;
    els.hintBtn.disabled = true;
    els.showAnswerBtn.disabled = true;
    els.gradeActions.classList.add('hidden');
    updateTopbar();
    return;
  }
  els.answerInput.disabled = false;
  els.hintBtn.disabled = false;
  els.showAnswerBtn.disabled = false;
  renderCard();
}

function currentCard() {
  return state.queue[state.index];
}

function renderCard() {
  const card = currentCard();
  if (!card) return finishQueue();

  els.categoryBadge.textContent = card.category;
  els.typeBadge.textContent = typeLabel(card.type);
  els.question.textContent = card.front;
  els.answerInput.value = '';
  els.hintBox.textContent = card.hint || '힌트가 없어요.';
  els.answerBox.innerHTML = '';
  els.hintBox.classList.add('hidden');
  els.answerBox.classList.add('hidden');
  els.gradeActions.classList.add('hidden');
  updateTopbar();
  updateStats();
  setTimeout(() => els.answerInput.focus(), 50);
}

function finishQueue() {
  els.question.textContent = '이번 카드 묶음을 다 봤어요. 틀린 카드만 다시 보면 더 좋아요.';
  els.categoryBadge.textContent = '완료';
  els.typeBadge.textContent = '복습 끝';
  els.answerInput.value = '';
  els.answerInput.disabled = true;
  els.hintBox.classList.add('hidden');
  els.answerBox.classList.add('hidden');
  els.gradeActions.classList.add('hidden');
  els.hintBtn.disabled = true;
  els.showAnswerBtn.disabled = true;
  updateTopbar();
  updateStats();
}

function showHint() {
  els.hintBox.classList.toggle('hidden');
}

function showAnswer() {
  const card = currentCard();
  if (!card) return;
  const mine = els.answerInput.value.trim();
  const exact = normalize(mine) && normalize(mine) === normalize(card.answer);
  els.answerBox.innerHTML = `정답: <strong>${card.answer}</strong>${mine ? `<br />내 답: ${mine}${exact ? ' <span class="auto-good">✓</span>' : ''}` : ''}`;
  els.answerBox.classList.remove('hidden');
  els.gradeActions.classList.remove('hidden');
}

function gradeCurrent(grade) {
  const card = currentCard();
  if (!card) return;
  setProgress(card.id, grade);

  if (grade === 'wrong') {
    state.queue.splice(Math.min(state.index + 4, state.queue.length), 0, card);
  } else if (grade === 'hesitant') {
    state.queue.splice(Math.min(state.index + 8, state.queue.length), 0, card);
  }

  state.index += 1;
  renderCard();
}

function updateTopbar() {
  const total = state.queue.length || 0;
  const current = total ? Math.min(state.index + 1, total) : 0;
  els.counter.textContent = `${current} / ${total}`;
  els.progressBar.style.width = total ? `${Math.min(100, (state.index / total) * 100)}%` : '0%';
}

function updateStats() {
  const progress = getProgress();
  let correct = 0, hesitant = 0, wrong = 0, fresh = 0;
  for (const card of state.cards) {
    const grade = progress[card.id]?.grade;
    if (grade === 'correct') correct += 1;
    else if (grade === 'hesitant') hesitant += 1;
    else if (grade === 'wrong') wrong += 1;
    else fresh += 1;
  }
  els.statCorrect.textContent = correct;
  els.statHesitant.textContent = hesitant;
  els.statWrong.textContent = wrong;
  els.statNew.textContent = fresh;
}

function resetProgress() {
  if (!state.currentSet) return;
  if (confirm('이 세트의 맞음/틀림 기록을 모두 지울까요?')) {
    localStorage.removeItem(storageKey(state.currentSet.id));
    updateStats();
    renderCard();
  }
}

function goBack() {
  els.studyPanel.classList.add('hidden');
  els.setupPanel.classList.remove('hidden');
  updateStats();
}

function isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function hideInstallCard() {
  els.installCard?.classList.add('hidden');
}

function setupInstallGuide() {
  let installPrompt = null;

  if (isStandaloneApp()) {
    hideInstallCard();
    return;
  }

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', (event) => {
    if (event.matches) hideInstallCard();
  });

  window.addEventListener('appinstalled', hideInstallCard);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (els.installButton) els.installButton.textContent = '웹앱 설치';
  });

  els.installButton?.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      if (choice?.outcome === 'accepted') {
        hideInstallCard();
        return;
      }
      els.installButton.textContent = '설치 방법 보기';
      return;
    }
    els.installGuide?.classList.toggle('hidden');
  });
}

setupInstallGuide();

els.setSelect.addEventListener('change', loadSelectedSet);
els.startBtn.addEventListener('click', startStudy);
els.shuffleBtn.addEventListener('click', () => {
  state.shuffled = !state.shuffled;
  els.shuffleBtn.textContent = state.shuffled ? '섞기 켜짐' : '순서대로';
});
els.backBtn.addEventListener('click', goBack);
els.hintBtn.addEventListener('click', showHint);
els.showAnswerBtn.addEventListener('click', showAnswer);
els.answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') showAnswer();
});
els.gradeActions.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-grade]');
  if (button) gradeCurrent(button.dataset.grade);
});
els.resetProgressBtn.addEventListener('click', resetProgress);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

loadSets().catch((error) => {
  els.setMeta.textContent = `카드 데이터를 불러오지 못했어요: ${error.message}`;
});
