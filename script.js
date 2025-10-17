const TOTAL_QUESTIONS = 10;
let questions = [];
let current = 0;
let correct = 0;
let startTime = null;
let translations = {}; // optional: can be filled from external i18n
let currentLang = 'en';

// DOM refs (assigned on DOMContentLoaded)
let startBtn,
  quizEl,
  introEl,
  questionEl,
  answerEl,
  submitBtn,
  progressEl,
  resultEl,
  summaryEl,
  restartBtn,
  leaderboardBody,
  confettiCanvas,
  ctx;

// Confetti
let confettiPieces = [];
let confettiActive = false;
let confettiRafId = null;

function resizeCanvas() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function getRandomQuestion() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a * b };
}

function startGame() {
  questions = Array.from({ length: TOTAL_QUESTIONS }, getRandomQuestion);
  current = 0;
  correct = 0;
  startTime = Date.now();
  if (introEl) introEl.style.display = 'none';
  if (resultEl) resultEl.style.display = 'none';
  if (quizEl) quizEl.style.display = 'block';
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  const qText = q ? `${q.a} × ${q.b} = ?` : '';
  if (questionEl) {
    questionEl.textContent = qText;
    questionEl.style.animation = 'none';
  }
  if (progressEl) {
    const qLabel = (translations && translations['question']) || 'Question';
    progressEl.textContent = `${qLabel} ${current + 1}/${TOTAL_QUESTIONS}`;
  }
  if (answerEl) answerEl.value = '';
}

function submitAnswer() {
  const q = questions[current];
  if (!q) return;
  const val = parseInt(answerEl?.value || '', 10);
  if (!Number.isNaN(val) && val === q.answer) {
    correct++;
    if (questionEl) questionEl.style.animation = 'popCorrect 0.4s ease';
  } else {
    if (questionEl) questionEl.style.animation = 'popWrong 0.4s ease';
  }

  setTimeout(() => {
    current++;
    if (current < TOTAL_QUESTIONS) showQuestion();
    else endGame();
  }, 400);
}

function endGame() {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  if (quizEl) quizEl.style.display = 'none';
  if (resultEl) resultEl.style.display = 'block';

  const tpl = (translations && translations['summary']) || '{correct}/{total} in {time}s';
  if (summaryEl) {
    summaryEl.textContent = tpl
      .replace('{correct}', String(correct))
      .replace('{total}', String(TOTAL_QUESTIONS))
      .replace('{time}', String(totalTime));
  }

  saveResult(correct, totalTime);
  renderLeaderboard();

  if (correct === TOTAL_QUESTIONS) {
    startConfetti();
    setTimeout(stopConfetti, 4000);
  }
}

function saveResult(correctCount, time) {
  try {
    const results = JSON.parse(localStorage.getItem('multiplicationResults') || '[]');
    results.push({ correct: correctCount, time: parseFloat(time) });
    results.sort((a, b) => b.correct - a.correct || a.time - b.time);
    localStorage.setItem('multiplicationResults', JSON.stringify(results.slice(0, 10)));
  } catch (e) {
    // ignore storage errors
    console.error('Failed to save result', e);
  }
}

function renderLeaderboard() {
  if (!leaderboardBody) return;
  const results = JSON.parse(localStorage.getItem('multiplicationResults') || '[]');
  leaderboardBody.innerHTML = '';
  results.forEach((r, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${i + 1}</td><td>${r.correct}</td><td>${r.time}</td>`;
    leaderboardBody.appendChild(row);
  });
}

// Confetti engine
function startConfetti() {
  if (!confettiCanvas || !ctx) return;
  if (confettiActive) return;
  confettiPieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * -window.innerHeight,
    r: Math.random() * 6 + 4,
    d: Math.random() * 0.5 + 0.5,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
  }));
  confettiActive = true;
  drawConfetti();
}

function drawConfetti() {
  if (!confettiActive || !ctx || !confettiCanvas) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
  updateConfetti();
  confettiRafId = requestAnimationFrame(drawConfetti);
}

function updateConfetti() {
  confettiPieces.forEach((p) => {
    p.y += p.d * 5;
    p.x += Math.sin(p.y / 20) * 2;
    if (p.y > window.innerHeight) {
      p.y = -10;
      p.x = Math.random() * window.innerWidth;
    }
  });
}

function stopConfetti() {
  confettiActive = false;
  if (confettiRafId) {
    cancelAnimationFrame(confettiRafId);
    confettiRafId = null;
  }
  if (ctx && confettiCanvas) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// Wire up DOM and events after load
document.addEventListener('DOMContentLoaded', () => {
  startBtn = document.getElementById('startBtn');
  quizEl = document.getElementById('quiz');
  introEl = document.getElementById('intro');
  questionEl = document.getElementById('question');
  answerEl = document.getElementById('answer');
  submitBtn = document.getElementById('submitBtn');
  progressEl = document.getElementById('progress');
  resultEl = document.getElementById('result');
  summaryEl = document.getElementById('summary');
  restartBtn = document.getElementById('restartBtn');
  leaderboardBody = document.getElementById('leaderboardBody');
  confettiCanvas = document.getElementById('confettiCanvas');
  ctx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

  resizeCanvas();

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (restartBtn) restartBtn.addEventListener('click', startGame);
  if (answerEl) {
    answerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer();
    });
  }

  document.querySelectorAll('.numBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (answerEl) answerEl.value += btn.textContent;
    });
  });

  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (answerEl) answerEl.value = '';
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      submitAnswer();
      if (answerEl) answerEl.focus();
    });
  }

  renderLeaderboard();
});
