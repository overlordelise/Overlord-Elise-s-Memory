// === TIMER ===
let seconds = 0;
let timerInterval;

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `Time: ${formatTime(seconds)}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function formatTime(totalSeconds) {
  const min = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const sec = String(totalSeconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

// === IMAGES ===
const images = [
  "images/Overlord Elise (1).png",
  "images/Overlord Elise (2).png",
  "images/Overlord Elise (3).png",
  "images/Overlord Elise (4).png",
  "images/Overlord Elise (5).png",
  "images/Overlord Elise (6).png",
  "images/Overlord Elise (7).jpg",
  "images/Overlord Elise (8).png",
  "images/Overlord Elise (9).png",
  "images/Overlord Elise (10).png"
];

const frontImage = "images/front.png";
const winImage = "images/winner.png";

// Editable lose text & link
const loseActionText = "You lose, pay up!";
const loseActionURL = "https://throne.com/overlord_elise"; // <-- changeable

const START_INSTRUCTION = "Complete within 25 turns to win or pay €10 if you lose.";
const TURN_LIMIT = 25;

// === ELEMENTS / STATE ===
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const xInput = document.getElementById("twitter"); // renamed to X
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

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let turns = 0;
let cardImages = [];

// === INITIAL TEXTS ===
startInstructionEl.textContent = START_INSTRUCTION;
loseAction.textContent = loseActionText;
loseAction.href = loseActionURL;

// === Ensure Start requires X username ===
function updateStartButtonState() {
  const hasName = xInput.value.trim().length > 0;
  startBtn.disabled = !hasName;
  startBtn.style.opacity = hasName ? "1" : "0.6";
}
xInput.addEventListener("input", updateStartButtonState);
updateStartButtonState();

startBtn.addEventListener("click", () => {
  const name = xInput.value.trim();
  if (!name) {
    alert("Please enter your X username to start.");
    xInput.focus();
    return;
  }
  localStorage.setItem("playerX", name);
  startGame();
});

restartTop.addEventListener("click", () => resetEverything());
winRestart.addEventListener("click", () => resetEverything());
loseRestart.addEventListener("click", () => resetEverything());

// === BOARD CREATION ===
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
        <div class="card-front">
          <img src="${frontImage}" alt="front" />
        </div>
        <div class="card-back">
          <img src="${imgSrc}" alt="back" />
        </div>
      </div>
    `;
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
    markMatched();
    setTimeout(() => checkGameOver(), 200);
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

function markMatched() {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  resetTurn();
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
  if (matchedCount < cardImages.length && turns >= TURN_LIMIT) showLose();
}

// === UI TRANSITIONS ===
function startGame() {
  turns = 0;
  turnsDisplay.textContent = turns;
  createBoard();

  startScreen.classList.add("hidden");
  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  // Start timer
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

// === CONFETTI ===
let confettiPieces = [];
let confettiTimer = null;
let confettiRunning = false;

function setCanvasSize() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", setCanvasSize);

const confettiColors = [
  "#e3f2fd", "#bbdefb", "#90caf9", "#64b5f6", "#42a5f5",
  "#2196f3", "#1e88e5", "#1976d2", "#1565c0", "#0d47a1",
  "#c0c6cc", "#bfc7ca", "#a9b0b6"
];

function startConfetti() {
  if (confettiRunning) return;
  confettiRunning = true;
  setCanvasSize();
  confettiCanvas.style.display = "block";
  confettiPieces = [];
  const total = 160;
  for (let i = 0; i < total; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      w: 6 + Math.random() * 8,
      h: 6 + Math.random() * 8,
      r: (Math.random() * 360) | 0,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      speed: 2 + Math.random() * 4,
      rotSpeed: (Math.random() - 0.5) * 6
    });
  }
  confettiTimer = requestAnimationFrame(confettiLoop);
  setTimeout(stopConfetti, 7000);
}

function stopConfetti() {
  if (!confettiRunning) return;
  confettiRunning = false;
  confettiCanvas.style.display = "none";
  if (confettiTimer) cancelAnimationFrame(confettiTimer);
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

// === GOOGLE SHEET ENDPOINT ===
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxR7QWRpL4kBYFy-LWrHKHxKhIRTA-cgxjsLgwR5Ven2MaSFzlsawKjWTytKFLazB7i/exec";

// === SCORE VERSTUREN ===
async function sendResultToSheet(name, turns, time) {
  console.log("📤 Sending to Google Sheet:", { name, turns, time });

  try {
    const response = await fetch(GOOGLE_SHEET_URL + "?origin=" + window.location.origin, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ name, turns, time }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log("✅ Sheet response:", result);

  } catch (err) {
    console.error("❌ Error sending to sheet:", err);
  }
}

// === SCORES LADEN ===
async function loadTopScores() {
  console.log("📥 Loading top scores...");
  try {
    const response = await fetch(GOOGLE_SHEET_URL + "?origin=" + window.location.origin, {
      method: "GET",
      mode: "cors",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const list = document.getElementById("scores");
    list.innerHTML = "";

    data.slice(0, 5).forEach(([name, turns, time]) => {
      const li = document.createElement("li");
      li.textContent = `${name}: ${turns} beurten (${time})`;
      list.appendChild(li);
    });

    console.log("✅ Scores loaded:", data);

  } catch (err) {
    console.error("❌ Error loading scores:", err);
  }
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  setCanvasSize();
  createBoard();
  loadTopScores();
});








