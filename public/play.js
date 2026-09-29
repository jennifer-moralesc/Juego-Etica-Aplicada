const socket = io();
const $ = (id) => document.getElementById(id);
const letters = ["A", "B", "C", "D"];

let roomCode = sessionStorage.getItem("ethicsPlayerRoom") || "";
let playerToken = sessionStorage.getItem("ethicsPlayerToken") || "";
let playerName = sessionStorage.getItem("ethicsPlayerName") || "";
let score = 0;
let selectedIndex = null;
let timerInterval = null;
let questionDeadline = null;

function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
}
function setJoinNotice(message = "", type = "") {
  $("joinNotice").textContent = message;
  $("joinNotice").className = `notice ${type}`;
}

const queryCode = new URLSearchParams(location.search).get("room");
if (queryCode) $("roomInput").value = queryCode.replace(/\D/g, "").slice(0, 6);

function showWaiting() {
  hide("joinCard");
  hide("questionCard");
  hide("resultsCard");
  $("welcomeName").textContent = `¡Entraste, ${playerName}!`;
  $("waitingCode").textContent = roomCode;
  show("waiting");
}

function startTimer(durationMs) {
  clearInterval(timerInterval);
  questionDeadline = Date.now() + durationMs;
  const total = Math.max(1, durationMs);
  const tick = () => {
    const remaining = Math.max(0, questionDeadline - Date.now());
    $("timerText").textContent = `${Math.ceil(remaining / 1000)} s`;
    $("timerFill").style.width = `${Math.max(0, Math.min(100, remaining / total * 100))}%`;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      document.querySelectorAll("#qOptions button").forEach((b) => b.disabled = true);
    }
  };
  tick();
  timerInterval = setInterval(tick, 200);
}

function renderQuestion(q, remainingMs = q.durationSeconds * 1000, alreadyAnswered = false) {
  selectedIndex = null;
  hide("joinCard");
  hide("waiting");
  hide("resultsCard");
  show("questionCard");
  hide("explanation");
  $("answerNotice").textContent = alreadyAnswered ? "Tu respuesta ya fue registrada. Espera el resultado." : "Elige una opción.";
  $("qNumber").textContent = `Pregunta ${q.number} de ${q.total} · ${q.prize}`;
  $("scoreLabel").textContent = `${score} puntos`;
  $("qText").textContent = q.text;
  $("qOptions").innerHTML = q.options.map((opt, i) => `<button class="option" type="button" data-index="${i}" ${alreadyAnswered ? "disabled" : ""}><span class="letter">${letters[i]}</span><span>${escapeHtml(opt)}</span></button>`).join("");

  document.querySelectorAll("#qOptions button").forEach((button) => {
    button.addEventListener("click", () => submitAnswer(Number(button.dataset.index)));
  });
  startTimer(remainingMs);
}

function submitAnswer(optionIndex) {
  if (selectedIndex !== null) return;
  selectedIndex = optionIndex;
  document.querySelectorAll("#qOptions button").forEach((button) => {
    button.disabled = true;
    if (Number(button.dataset.index) === optionIndex) button.classList.add("selected");
  });
  $("answerNotice").textContent = "Respuesta registrada. Espera el resultado…";

  socket.emit("player:answer", { code: roomCode, optionIndex }, (response) => {
    if (!response.ok) $("answerNotice").textContent = response.message;
  });
}

function saveSession(response) {
  playerToken = response.playerToken || playerToken;
  sessionStorage.setItem("ethicsPlayerRoom", roomCode);
  sessionStorage.setItem("ethicsPlayerToken", playerToken);
  sessionStorage.setItem("ethicsPlayerName", playerName);
}

$("joinForm").addEventListener("submit", (event) => {
  event.preventDefault();
  roomCode = $("roomInput").value.replace(/\D/g, "").slice(0, 6);
  playerName = $("nameInput").value.trim().replace(/\s+/g, " ").slice(0, 24);
  if (roomCode.length !== 6 || !playerName) {
    setJoinNotice("Revisa el código de 6 dígitos y tu nombre.", "error");
    return;
  }

  socket.emit("player:join", { code: roomCode, name: playerName }, (response) => {
    if (!response.ok) {
      setJoinNotice(response.message, "error");
      return;
    }
    saveSession(response);
    score = 0;
    showWaiting();
  });
});

socket.on("connect", () => {
  if (!roomCode || !playerToken) return;
  socket.emit("player:resume", { code: roomCode, playerToken }, (response) => {
    if (!response.ok) {
      sessionStorage.removeItem("ethicsPlayerRoom");
      sessionStorage.removeItem("ethicsPlayerToken");
      sessionStorage.removeItem("ethicsPlayerName");
      roomCode = "";
      playerToken = "";
      return;
    }
    playerName = response.name;
    score = response.score;
    if (response.room.status === "lobby") showWaiting();
    if (response.room.status === "question" && response.question) {
      renderQuestion(response.question, response.remainingMs, response.alreadyAnswered);
    }
  });
});

socket.on("game:question", (q) => renderQuestion(q));

socket.on("game:reveal", ({ correctIndex, explanation, leaderboard }) => {
  clearInterval(timerInterval);
  document.querySelectorAll("#qOptions button").forEach((button) => {
    const idx = Number(button.dataset.index);
    if (idx === correctIndex) button.classList.add("correct");
    if (selectedIndex === idx && idx !== correctIndex) button.classList.add("incorrect");
  });

  const me = leaderboard.find((p) => p.name === playerName);
  if (me) score = me.score;
  $("scoreLabel").textContent = `${score} puntos`;
  $("answerNotice").textContent = selectedIndex === correctIndex ? "✅ ¡Correcto!" : "La respuesta correcta está marcada en verde.";
  $("explanation").textContent = explanation;
  show("explanation");
});

socket.on("game:finished", ({ leaderboard }) => {
  clearInterval(timerInterval);
  hide("questionCard");
  hide("waiting");
  show("resultsCard");
  const me = leaderboard.find((p) => p.name === playerName);
  if (me) {
    score = me.score;
    $("myFinal").textContent = `Terminaste #${me.rank} con ${me.score} puntos.`;
  }
  $("finalLeaderboard").innerHTML = leaderboard.slice(0, 10).map((p) => `<div class="podium-row"><span class="rank">#${p.rank}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score} pts</span></div>`).join("");
});

socket.on("game:restart", () => {
  score = 0;
  selectedIndex = null;
  showWaiting();
});

socket.on("host:offline", () => {
  if (!$("questionCard").classList.contains("hidden")) {
    $("answerNotice").textContent = "El anfitrión perdió conexión temporalmente. La sala intentará recuperarse.";
  }
});

socket.on("room:closed", ({ message }) => {
  sessionStorage.removeItem("ethicsPlayerRoom");
  sessionStorage.removeItem("ethicsPlayerToken");
  sessionStorage.removeItem("ethicsPlayerName");
  alert(message);
  location.href = "/play.html";
});
