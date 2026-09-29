import express from "express";
import http from "node:http";
import crypto from "node:crypto";
import { Server } from "socket.io";
import { questions } from "./questions.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;
const QUESTION_SECONDS = Number(process.env.QUESTION_SECONDS) || 30;
const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const HOST_GRACE_MS = 2 * 60 * 1000;
const MAX_PLAYERS = 120;

const rooms = new Map();

app.disable("x-powered-by");
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

function cleanName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .slice(0, 24);
}

function normalizeCode(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

function createRoomCode() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(crypto.randomInt(100000, 1000000));
    if (!rooms.has(code)) return code;
  }
  throw new Error("No fue posible generar un código de sala disponible.");
}

function sanitizeQuestion(question, index) {
  return {
    index,
    number: index + 1,
    total: questions.length,
    level: question.level,
    prize: question.prize,
    type: question.type,
    text: question.text,
    options: question.options,
    durationSeconds: QUESTION_SECONDS
  };
}

function publicPlayers(room) {
  return [...room.players.values()]
    .map(({ token, socketId, answers, ...player }) => ({
      ...player,
      connected: Boolean(socketId)
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function leaderboard(room) {
  return publicPlayers(room)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((player, index) => ({ ...player, rank: index + 1 }));
}

function roomSummary(room) {
  return {
    code: room.code,
    status: room.status,
    currentQuestion: room.currentQuestion,
    totalQuestions: questions.length,
    questionSeconds: QUESTION_SECONDS,
    players: publicPlayers(room)
  };
}

function emitLobby(room) {
  io.to(room.code).emit("lobby:update", roomSummary(room));
}

function clearRoomTimer(room) {
  if (room.questionTimer) {
    clearTimeout(room.questionTimer);
    room.questionTimer = null;
  }
}

function startQuestion(room, index) {
  clearRoomTimer(room);
  room.currentQuestion = index;
  room.status = "question";
  room.questionStartedAt = Date.now();
  room.currentAnswers = new Map();

  const payload = sanitizeQuestion(questions[index], index);
  io.to(room.code).emit("game:question", payload);
  io.to(room.code).emit("game:answer-count", {
    answered: 0,
    total: room.players.size
  });

  room.questionTimer = setTimeout(() => revealQuestion(room), QUESTION_SECONDS * 1000);
}

function revealQuestion(room) {
  if (!room || room.status !== "question") return;
  clearRoomTimer(room);
  room.status = "revealed";

  const question = questions[room.currentQuestion];
  const distribution = question.options.map((_, optionIndex) => {
    let count = 0;
    for (const answer of room.currentAnswers.values()) {
      if (answer.optionIndex === optionIndex) count += 1;
    }
    return count;
  });

  io.to(room.code).emit("game:reveal", {
    index: room.currentQuestion,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    distribution,
    leaderboard: leaderboard(room)
  });
}

function finishGame(room) {
  clearRoomTimer(room);
  room.status = "finished";
  io.to(room.code).emit("game:finished", {
    leaderboard: leaderboard(room)
  });
}

function isHost(room, socket) {
  return room && room.hostSocketId === socket.id;
}

function scheduleRoomCleanup(room) {
  if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
  room.cleanupTimer = setTimeout(() => {
    clearRoomTimer(room);
    rooms.delete(room.code);
  }, ROOM_TTL_MS);
}

io.on("connection", (socket) => {
  socket.on("host:create", (_payload, callback = () => {}) => {
    try {
      const code = createRoomCode();
      const hostToken = crypto.randomUUID();
      const room = {
        code,
        hostToken,
        hostSocketId: socket.id,
        hostDisconnectTimer: null,
        cleanupTimer: null,
        status: "lobby",
        currentQuestion: -1,
        questionStartedAt: null,
        questionTimer: null,
        currentAnswers: new Map(),
        players: new Map(),
        createdAt: Date.now()
      };

      rooms.set(code, room);
      scheduleRoomCleanup(room);
      socket.join(code);
      socket.data.role = "host";
      socket.data.roomCode = code;
      callback({ ok: true, code, hostToken, room: roomSummary(room) });
    } catch (error) {
      callback({ ok: false, message: error.message });
    }
  });

  socket.on("host:resume", ({ code, hostToken } = {}, callback = () => {}) => {
    const normalized = normalizeCode(code);
    const room = rooms.get(normalized);
    if (!room || room.hostToken !== hostToken) {
      callback({ ok: false, message: "No encontramos esa sesión de anfitrión." });
      return;
    }

    if (room.hostDisconnectTimer) {
      clearTimeout(room.hostDisconnectTimer);
      room.hostDisconnectTimer = null;
    }

    room.hostSocketId = socket.id;
    socket.join(room.code);
    socket.data.role = "host";
    socket.data.roomCode = room.code;

    const response = { ok: true, code: room.code, room: roomSummary(room) };
    if (room.status === "question") {
      response.question = sanitizeQuestion(questions[room.currentQuestion], room.currentQuestion);
      response.remainingMs = Math.max(
        0,
        QUESTION_SECONDS * 1000 - (Date.now() - room.questionStartedAt)
      );
    }
    callback(response);
    io.to(room.code).emit("host:online");
  });

  socket.on("player:join", ({ code, name } = {}, callback = () => {}) => {
    const normalized = normalizeCode(code);
    const clean = cleanName(name);
    const room = rooms.get(normalized);

    if (!room) {
      callback({ ok: false, message: "Ese código de sala no existe." });
      return;
    }
    if (room.status !== "lobby") {
      callback({ ok: false, message: "La partida ya comenzó." });
      return;
    }
    if (!clean) {
      callback({ ok: false, message: "Escribe un nombre para entrar." });
      return;
    }
    if (room.players.size >= MAX_PLAYERS) {
      callback({ ok: false, message: "La sala alcanzó el máximo de participantes." });
      return;
    }
    if ([...room.players.values()].some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      callback({ ok: false, message: "Ese nombre ya está siendo usado en la sala." });
      return;
    }

    const playerToken = crypto.randomUUID();
    const player = {
      token: playerToken,
      socketId: socket.id,
      name: clean,
      score: 0,
      connected: true,
      answers: []
    };

    room.players.set(playerToken, player);
    socket.join(room.code);
    socket.data.role = "player";
    socket.data.roomCode = room.code;
    socket.data.playerToken = playerToken;

    callback({ ok: true, playerToken, room: roomSummary(room) });
    emitLobby(room);
  });

  socket.on("player:resume", ({ code, playerToken } = {}, callback = () => {}) => {
    const normalized = normalizeCode(code);
    const room = rooms.get(normalized);
    const player = room?.players.get(playerToken);

    if (!room || !player) {
      callback({ ok: false, message: "No encontramos tu sesión anterior." });
      return;
    }

    player.socketId = socket.id;
    socket.join(room.code);
    socket.data.role = "player";
    socket.data.roomCode = room.code;
    socket.data.playerToken = playerToken;

    const response = {
      ok: true,
      name: player.name,
      score: player.score,
      room: roomSummary(room)
    };

    if (room.status === "question") {
      response.question = sanitizeQuestion(questions[room.currentQuestion], room.currentQuestion);
      response.remainingMs = Math.max(
        0,
        QUESTION_SECONDS * 1000 - (Date.now() - room.questionStartedAt)
      );
      response.alreadyAnswered = room.currentAnswers.has(playerToken);
    }

    callback(response);
    emitLobby(room);
  });

  socket.on("host:start", ({ code } = {}, callback = () => {}) => {
    const room = rooms.get(normalizeCode(code));
    if (!isHost(room, socket)) {
      callback({ ok: false, message: "No tienes control de esta sala." });
      return;
    }
    if (room.status !== "lobby") {
      callback({ ok: false, message: "La partida ya fue iniciada." });
      return;
    }
    if (room.players.size === 0) {
      callback({ ok: false, message: "Debe entrar al menos un participante." });
      return;
    }

    startQuestion(room, 0);
    callback({ ok: true });
  });

  socket.on("player:answer", ({ code, optionIndex } = {}, callback = () => {}) => {
    const room = rooms.get(normalizeCode(code));
    const playerToken = socket.data.playerToken;
    const player = room?.players.get(playerToken);

    if (!room || !player || room.status !== "question") {
      callback({ ok: false, message: "No hay una pregunta activa." });
      return;
    }
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
      callback({ ok: false, message: "Respuesta inválida." });
      return;
    }
    if (room.currentAnswers.has(playerToken)) {
      callback({ ok: false, message: "Ya respondiste esta pregunta." });
      return;
    }

    const question = questions[room.currentQuestion];
    const elapsedMs = Math.max(0, Date.now() - room.questionStartedAt);
    const correct = optionIndex === question.correctIndex;
    const speedFactor = Math.max(0, 1 - elapsedMs / (QUESTION_SECONDS * 1000));
    const points = correct ? Math.round(700 + 300 * speedFactor) : 0;

    room.currentAnswers.set(playerToken, {
      optionIndex,
      correct,
      points,
      elapsedMs
    });
    player.score += points;
    player.answers.push({
      questionIndex: room.currentQuestion,
      optionIndex,
      correct,
      points
    });

    callback({ ok: true, pointsPending: correct ? "correct" : "incorrect" });
    io.to(room.code).emit("game:answer-count", {
      answered: room.currentAnswers.size,
      total: room.players.size
    });
  });

  socket.on("host:reveal", ({ code } = {}, callback = () => {}) => {
    const room = rooms.get(normalizeCode(code));
    if (!isHost(room, socket)) {
      callback({ ok: false, message: "No tienes control de esta sala." });
      return;
    }
    revealQuestion(room);
    callback({ ok: true });
  });

  socket.on("host:next", ({ code } = {}, callback = () => {}) => {
    const room = rooms.get(normalizeCode(code));
    if (!isHost(room, socket)) {
      callback({ ok: false, message: "No tienes control de esta sala." });
      return;
    }
    if (room.status !== "revealed") {
      callback({ ok: false, message: "Primero debes revelar la respuesta." });
      return;
    }

    const nextIndex = room.currentQuestion + 1;
    if (nextIndex >= questions.length) {
      finishGame(room);
    } else {
      startQuestion(room, nextIndex);
    }
    callback({ ok: true });
  });

  socket.on("host:restart", ({ code } = {}, callback = () => {}) => {
    const room = rooms.get(normalizeCode(code));
    if (!isHost(room, socket)) {
      callback({ ok: false, message: "No tienes control de esta sala." });
      return;
    }

    clearRoomTimer(room);
    room.status = "lobby";
    room.currentQuestion = -1;
    room.currentAnswers = new Map();
    for (const player of room.players.values()) {
      player.score = 0;
      player.answers = [];
    }
    io.to(room.code).emit("game:restart", roomSummary(room));
    emitLobby(room);
    callback({ ok: true });
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;

    if (socket.data.role === "host" && room.hostSocketId === socket.id) {
      room.hostSocketId = null;
      io.to(room.code).emit("host:offline");
      room.hostDisconnectTimer = setTimeout(() => {
        io.to(room.code).emit("room:closed", {
          message: "El anfitrión se desconectó y la sala fue cerrada."
        });
        clearRoomTimer(room);
        rooms.delete(room.code);
      }, HOST_GRACE_MS);
    }

    if (socket.data.role === "player") {
      const player = room.players.get(socket.data.playerToken);
      if (player && player.socketId === socket.id) {
        player.socketId = null;
        emitLobby(room);
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ética Millonaria escuchando en puerto ${PORT}`);
});
