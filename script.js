// === TIMER ===
let seconds = 0;
let timerInterval;
const GAME_DURATION = 120; // 2 minuten (120 seconden)

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();

    if (seconds >= GAME_DURATION) {
      stopTimer();
      checkLoseCondition(); // automatisch verliezen als tijd om is
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const remaining = Math.max(0, GAME_DURATION - seconds);
  document.getElementById("timer").textContent = `Time: ${formatTime(remaining)}`;
}

function formatTime(totalSeconds) {
  const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const sec = String(totalSeconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

// === IMAGES ===
const images = [
  "images/Overlord Elise (1).png", "images/Overlord Elise (2).png",
  "images/Overlord Elise (3).png", "images/Overlord Elise (4).png",
  "images/Overlord Elise (5).png", "images/Overlord Elise (6).png",
  "images/Overlord Elise (7).jpg", "images/Overlord Elise (8).png",
  "images/Overlord Elise (9).png", "images/Overlord Elise (10).png"
];
const frontImage = "images/front.png";
const winImage = "images/winner.png";

const loseActionText = "Link to the Overlord";
const loseActionURL = "https://throne.com/overlord_elise";

const START_INSTRUCTION = "Complete within 18 turns to win.";
const TURN_LIMIT = 18;

// === ELEMENTS ===
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const xInput = document.getElementById("twitter");
const startInstructionEl = document.getElementById("start-instruction");
const gameScreen = document.getElementById("game-screen");
const board = document.getElementById("game-board");
const turnsDisplay = document.getElementById("turns");
const restartTop = document.getElementById("restart-top");
const winScreen = document.getElementById("win-screen");
const winnerImageEl = document.getElementById("winner-image");
const winRestart = document.getElementById("win-restart");
const loseScreen = document.getElementById("lose-screen");
const loseAction = document.getElementById("lose-action");
const loseRestart = document.getElementById("lose-restart");
const confettiCanvas = document.getElementById("confetti-canvas");
const ctx = confettiCanvas.getContext("2d");

// === GAME STATE ===
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let turns = 0;
let cardImages = [];

// === INITIAL TEXTS ===
startInstructionEl.textContent = START_INSTRUCTION;
loseAction.textContent = loseActionText;
loseAction.href = loseActionURL;

// === ENABLE START BUTTON ===
function updateStartButtonState() {
  const hasName = xInput.value.trim().length > 0;
  startBtn.disabled = !hasName;
  startBtn.classList.toggle("disabled", !hasName);
}
xInput.addEventListener("input", updateStartButtonState);
updateStartButtonState();

startBtn.addEventListener("click", () => {
  const name = xInput.value.trim();
  if (!name) {
    alert("Please enter your X username to start.");
    return;
  }
  localStorage.setItem("playerX", name);
  startGame();
});

restartTop.addEventListener("click", resetEverything);
winRestart.addEventListener("click", resetEverything);
loseRestart.addEventListener("click", resetEverything);

// === CREATE BOARD ===
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function createBoard() {
  board.innerHTML = "";
  cardImages = [...images, ...images];
  shuffleArray(cardImages);

  cardImages.forEach((imgSrc) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front"><img src="${frontImage}" alt="front" /></div>
        <div class="card-back"><img src="${imgSrc}" alt="back" /></div>
      </div>`;
    card.addEventListener("click", () => flipCard(card));
    board.appendChild(card);
  });
}

// === GAME LOGIC ===
function flipCard(card) {
  if (lockBoard || card === firstCard || card.classList.contains("matched")) return;
  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  checkForMatch();
}

function checkForMatch() {
  const firstImg = firstCard.querySelector(".card-back img").src;
  const secondImg = secondCard.querySelector(".card-back img").src;

  if (firstImg === secondImg) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    resetTurn();
    checkGameOver();
  } else {
    turns++;
    turnsDisplay.textContent = turns;
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
      if (turns >= TURN_LIMIT) checkLoseCondition();
    }, 900);
  }
}

function resetTurn() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

function checkGameOver() {
  const matchedCount = document.querySelectorAll(".matched").length;
  if (matchedCount === cardImages.length) showWin();
  else if (turns >= TURN_LIMIT) checkLoseCondition();
}

function checkLoseCondition() {
  const matchedCount = document.querySelectorAll(".matched").length;
  if (matchedCount < cardImages.length) showLose();
}

// === SCREENS ===
function startGame() {
  turns = 0;
  turnsDisplay.textContent = turns;
  createBoard();

  startScreen.classList.add("hidden");
  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTimer();
}

function showWin() {
  stopTimer();
  gameScreen.classList.add("hidden");
  winScreen.classList.remove("hidden");
  winnerImageEl.src = winImage;

  startConfetti();

  const name = localStorage.getItem("playerX") || "Unknown";
  const time = formatTime(seconds);
  sendResultToSheet(name, turns, time);
  loadTopScores();
}

function showLose() {
  stopTimer();
  gameScreen.classList.add("hidden");
  loseScreen.classList.remove("hidden");

  const name = localStorage.getItem("playerX") || "Unknown";
  const time = formatTime(seconds);
  sendResultToSheet(name, turns, time);
  loadTopScores();
}

function resetEverything() {
  stopConfetti();
  turns = 0;
  turnsDisplay.textContent = turns;
  createBoard();
  startScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
}

// === CONFETTI (same) ===
let confettiPieces = [];
let confettiTimer = null;
let confettiRunning = false;

function setCanvasSize() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", setCanvasSize);

const confettiColors = [
  "#c0c6cc", "#bbdefb", "#90caf9", "#64b5f6", "#42a5f5", "#a9b0b6"
];

function startConfetti() {
  if (confettiRunning) return;
  confettiRunning = true;
  setCanvasSize();
  confettiCanvas.style.display = "block";
  confettiPieces = Array.from({ length: 160 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * -confettiCanvas.height,
    w: 6 + Math.random() * 8,
    h: 6 + Math.random() * 8,
    r: Math.random() * 360,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    speed: 2 + Math.random() * 4,
    rotSpeed: (Math.random() - 0.5) * 6
  }));
  confettiTimer = requestAnimationFrame(confettiLoop);
  setTimeout(stopConfetti, 7000);
}

function stopConfetti() {
  if (!confettiRunning) return;
  confettiRunning = false;
  confettiCanvas.style.display = "none";
  cancelAnimationFrame(confettiTimer);
  confettiPieces = [];
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function confettiLoop() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  for (let p of confettiPieces) {
    p.y += p.speed;
    p.x += Math.sin(p.y / 50) * 2;
    p.r += p.rotSpeed;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  confettiTimer = requestAnimationFrame(confettiLoop);
}

// === GOOGLE SHEET ===
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbw9ysILBdivQjQczFqgSiBmkcf1xTpbKJXn5rqVXvTlE8NHk0Iz1lfOKEUG_0DjlExc/exec";
const DEBUG = true;

async function sendResultToSheet(name, turns, time) {
  try {
    const response = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, turns, time })
    });
    const text = await response.text();
    const result = JSON.parse(text);
    if (result.success) showStatus("✅ Score saved!"), await loadTopScores();
  } catch (err) {
    showStatus("❌ Connection error");
  }
}

async function loadTopScores() {
  try {
    const response = await fetch(GOOGLE_SHEET_URL, { cache: "no-cache" });
    const data = JSON.parse(await response.text());
    const list = document.getElementById("scores");
    list.innerHTML = "";
    data.slice(0, 5).forEach(([name, turns, time], i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class='rank'>#${i + 1}</span>
                      <span class='player'>${name}</span>
                      <span class='turns'>${turns} turns</span>
                      <span class='time'>${time}</span>`;
      list.appendChild(li);
    });
  } catch {
    showStatus("⚠️ Could not load leaderboard");
  }
}

// === STATUS POPUP ===
function showStatus(message) {
  let el = document.getElementById("status");
  if (!el) {
    el = document.createElement("div");
    el.id = "status";
    el.style.position = "fixed";
    el.style.bottom = "10px";
    el.style.right = "10px";
    el.style.background = "rgba(0,0,0,0.8)";
    el.style.color = "white";
    el.style.padding = "6px 12px";
    el.style.borderRadius = "8px";
    el.style.fontSize = "14px";
    el.style.zIndex = "9999";
    el.style.transition = "opacity 0.5s";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => (el.style.opacity = "0"), 3000);
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  setCanvasSize();
  createBoard();
  loadTopScores();
});
