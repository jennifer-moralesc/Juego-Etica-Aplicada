const socket = io();
const $ = (id) => document.getElementById(id);
const letters = ["A", "B", "C", "D"];

let roomCode = sessionStorage.getItem("ethicsHostRoom") || "";
let hostToken = sessionStorage.getItem("ethicsHostToken") || "";
let currentQuestion = null;
let timerInterval = null;
let questionDeadline = null;
let latestPlayers = [];
let audioEnabled = false;

function show(id) { $(id).classList.remove("hidden"); }

async function toggleAudio() {
  const btn = $("audioBtn");
  btn.disabled = false;

  if (!audioEnabled) {
    const started = await window.millionaireAudio.enable();
    if (started) {
      audioEnabled = true;
      btn.textContent = "🔊 Apagar música";
      btn.setAttribute("aria-pressed", "true");
    }
  } else {
    window.millionaireAudio.disable();
    audioEnabled = false;
    btn.textContent = "🔇 Activar música";
    btn.setAttribute("aria-pressed", "false");
  }
}

function hide(id) { $(id).classList.add("hidden"); }
function setNotice(message = "", type = "") {
  const el = $("hostNotice");
  el.textContent = message;
  el.className = `notice ${type}`;
}

function renderPlayers(players = []) {
  latestPlayers = players;
  $("playerCount").textContent = players.length;
  $("playerList").innerHTML = players.length
    ? players.map((p) => `<div class="player-row"><strong><span class="presence ${p.connected ? "" : "offline"}"></span>${escapeHtml(p.name)}</strong><span class="score">${p.score} pts</span></div>`).join("")
    : `<p class="muted small">Aún no ha entrado nadie.</p>`;
  $("startBtn").disabled = players.length === 0;
}

function renderLeaderboard(players = []) {
  $("leaderboard").innerHTML = players.slice(0, 10).map((p, i) => `<div class="podium-row"><span class="rank">#${p.rank ?? i + 1}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score} pts</span></div>`).join("") || `<p class="muted small">El ranking aparecerá aquí.</p>`;
}

function renderFinal(players = []) {
  $("finalLeaderboard").innerHTML = players.map((p, i) => `<div class="podium-row"><span class="rank">#${p.rank ?? i + 1}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score} pts</span></div>`).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
}

function startTimer(durationMs) {
  clearInterval(timerInterval);
  questionDeadline = Date.now() + durationMs;
  const total = Math.max(1, durationMs);

  const tick = () => {
    const remaining = Math.max(0, questionDeadline - Date.now());
    $("timerText").textContent = `${Math.ceil(remaining / 1000)} s`;
    $("timerFill").style.width = `${Math.max(0, Math.min(100, remaining / total * 100))}%`;
    if (remaining <= 0) clearInterval(timerInterval);
  };
  tick();
  timerInterval = setInterval(tick, 200);
}

function renderQuestion(q, remainingMs = q.durationSeconds * 1000) {
  currentQuestion = q;
  hide("lobby");
  hide("finished");
  show("game");
  hide("nextBtn");
  show("revealBtn");
  hide("explanation");
  $("qNumber").textContent = `Pregunta ${q.number} de ${q.total}`;
  $("qPrize").textContent = `${q.prize} · ${q.type}`;
  $("qText").textContent = q.text;
  $("qOptions").innerHTML = q.options.map((opt, i) => `<div class="option" data-index="${i}"><span class="letter">${letters[i]}</span><span>${escapeHtml(opt)}</span></div>`).join("");
  $("answerCount").textContent = `0 / ${latestPlayers.length} respuestas`;
  startTimer(remainingMs);
  if (audioEnabled) window.millionaireAudio?.playQuestion(q.number);
}

function initializeRoom(data) {
  roomCode = data.code;
  $("roomCode").textContent = roomCode;
  $("joinUrl").textContent = `${location.host}/play.html`;
  hide("loadingCard");
  if (data.room.status === "lobby") {
    show("lobby");
    renderPlayers(data.room.players);
  }
  if (data.room.status === "question" && data.question) {
    latestPlayers = data.room.players;
    renderQuestion(data.question, data.remainingMs ?? data.question.durationSeconds * 1000);
  }
}

function createOrResume() {
  if (roomCode && hostToken) {
    socket.emit("host:resume", { code: roomCode, hostToken }, (response) => {
      if (response.ok) {
        initializeRoom(response);
      } else {
        sessionStorage.removeItem("ethicsHostRoom");
        sessionStorage.removeItem("ethicsHostToken");
        roomCode = "";
        hostToken = "";
        createRoom();
      }
    });
  } else {
    createRoom();
  }
}

function createRoom() {
  socket.emit("host:create", {}, (response) => {
    if (!response.ok) {
      $("loadingCard").innerHTML = `<p class="notice error">${escapeHtml(response.message || "No se pudo crear la sala.")}</p>`;
      return;
    }
    hostToken = response.hostToken;
    sessionStorage.setItem("ethicsHostRoom", response.code);
    sessionStorage.setItem("ethicsHostToken", hostToken);
    initializeRoom(response);
  });
}

$("audioBtn").disabled = false;
$("audioBtn").removeAttribute("disabled");
$("audioBtn").addEventListener("click", toggleAudio);

$("startBtn").addEventListener("click", async () => {
  if (!audioEnabled) await toggleAudio();
  socket.emit("host:start", { code: roomCode }, (response) => {
    if (!response.ok) setNotice(response.message, "error");
  });
});

$("revealBtn").addEventListener("click", () => {
  socket.emit("host:reveal", { code: roomCode }, () => {});
});

$("nextBtn").addEventListener("click", () => {
  socket.emit("host:next", { code: roomCode }, () => {});
});

$("restartBtn").addEventListener("click", () => {
  socket.emit("host:restart", { code: roomCode }, () => {});
});

socket.on("connect", createOrResume);

socket.on("lobby:update", (room) => {
  if (room.code !== roomCode) return;
  renderPlayers(room.players);
  if (room.status === "lobby") {
    hide("game");
    hide("finished");
    show("lobby");
  }
});

socket.on("game:question", (q) => renderQuestion(q));

socket.on("game:answer-count", ({ answered, total }) => {
  $("answerCount").textContent = `${answered} / ${total} respuestas`;
});

socket.on("game:reveal", ({ correctIndex, explanation, distribution, leaderboard }) => {
  clearInterval(timerInterval);
  document.querySelectorAll("#qOptions .option").forEach((el) => {
    const index = Number(el.dataset.index);
    if (index === correctIndex) el.classList.add("correct");
    const count = distribution?.[index] ?? 0;
    el.querySelector("span:last-child").insertAdjacentHTML("beforeend", `<div class="muted small" style="margin-top:6px">${count} respuesta${count === 1 ? "" : "s"}</div>`);
  });
  $("explanation").textContent = explanation;
  show("explanation");
  hide("revealBtn");
  $("nextBtn").textContent = currentQuestion?.number === currentQuestion?.total ? "Ver resultado final" : "Siguiente pregunta";
  show("nextBtn");
  renderLeaderboard(leaderboard);
  if (audioEnabled) window.millionaireAudio?.playReveal(true);
});

socket.on("game:finished", ({ leaderboard }) => {
  clearInterval(timerInterval);
  hide("game");
  hide("lobby");
  show("finished");
  renderFinal(leaderboard);
  if (audioEnabled) window.millionaireAudio?.playFinal();
});

socket.on("game:restart", (room) => {
  latestPlayers = room.players;
  hide("game");
  hide("finished");
  show("lobby");
  renderPlayers(room.players);
  if (audioEnabled) window.millionaireAudio?.playLobby();
});

socket.on("host:offline", () => setNotice("Conexión del anfitrión interrumpida. Intentando reconectar…", "error"));
socket.on("host:online", () => setNotice("Conexión restablecida.", "success"));
socket.on("room:closed", ({ message }) => {
  sessionStorage.removeItem("ethicsHostRoom");
  sessionStorage.removeItem("ethicsHostToken");
  alert(message);
  location.href = "/";
});
