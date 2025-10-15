const TOTAL_QUESTIONS = 10;
let questions = [];
let current = 0;
let correct = 0;
let startTime = null;
let translations = {};
let currentLang = 'en';

// DOM refs
const startBtn = document.getElementById('startBtn');
const quizEl = document.getElementById('quiz');
const introEl = document.getElementById('intro');
const questionEl = document.getElementById('question');
const answerEl = document.getElementById('answer');
const submitBtn = document.getElementById('submitBtn');
const progressEl = document.getElementById('progress');
const resultEl = document.getElementById('result');
const summaryEl = document.getElementById('summary');
const restartBtn = document.getElementById('restartBtn');
const leaderboardBody = document.getElementById('leaderboardBody');
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');

// Confetti
let confettiPieces = [];
let confettiActive = false;
function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

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
  introEl.style.display = 'none';
  resultEl.style.display = 'none';
  quizEl.style.display = 'block';
  showQuestion();
}

function showQuestion() {
  const q = questions[current];
  questionEl.textContent = `${q.a} × ${q.b} = ?`;
  progressEl.textContent = `${translations['question'] || 'Question'} ${current + 1}/${TOTAL_QUESTIONS}`;
  answerEl.value = '';
  questionEl.style.animation = 'none';
}

function submitAnswer() {
  const q = questions[current];
  const val = parseInt(answerEl.value, 10);
  if (val === q.answer) {
    correct++;
    questionEl.style.animation = 'popCorrect 0.4s ease';
  } else {
    questionEl.style.animation = 'popWrong 0.4s ease';
  }

  setTimeout(() => {
    current++;
    if (current < TOTAL_QUESTIONS) showQuestion();
    else endGame();
  }, 400);
}

function endGame() {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  quizEl.style.display = 'none';
  resultEl.style.display = 'block';
  summaryEl.textContent = translations['summary']
    .replace('{correct}', correct)
    .replace('{total}', TOTAL_QUESTIONS)
    .replace('{time}', totalTime);

  saveResult(correct, totalTime);
  renderLeaderboard();

  if (correct === TOTAL_QUESTIONS) {
    startConfetti();
    setTimeout(stopConfetti, 4000);
  }
}

function saveResult(correct, time) {
  const results = JSON.parse(localStorage.getItem('multiplicationResults') || '[]');
  results.push({ correct, time: parseFloat(time) });
  results.sort((a, b) => b.correct - a.correct || a.time - b.time);
  localStorage.setItem('multiplicationResults', JSON.stringify(results.slice(0, 10)));
}

function renderLeaderboard() {
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
  confettiPieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight - window.innerHeight,
    r: Math.random() * 6 + 4,
    d: Math.random() * 0.5 + 0.5,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
  }));
  confettiActive = true;
  drawConfetti();
}

function drawConfetti() {
  if (!confettiActive) return;
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiPieces.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
  updateConfetti();
  requestAnimationFrame(drawConfetti);
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
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// Events
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
answerEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitAnswer();
});

// Init
(async function init() {
  renderLeaderboard();
})();

// NumPad event
document.querySelectorAll('.numBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    answerEl.value += btn.textContent;
  });
});

// Clear-knapp
document.getElementById('clearBtn').addEventListener('click', () => {
  answerEl.value = '';
});

// Submit-knapp (flyttad)
document.getElementById('submitBtn').addEventListener('click', submitAnswer);
