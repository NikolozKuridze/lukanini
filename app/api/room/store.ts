export type Role = "nini" | "luka";
export type RoomStatus = "waiting" | "playing" | "finished";
export type SignalType = "offer" | "answer" | "candidate";
export type GameType = "duo" | "nardi";

type DuoGem = {
  id: string;
  owner: Role;
  x: number;
  y: number;
};

type DuoPlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  finished: boolean;
  updatedAt: string;
};

type NardiPoint = {
  owner: Role | null;
  count: number;
};

type NardiMove = {
  from: number | "bar";
  to: number | "off";
  die: number;
};

export type SignalEvent = {
  id: number;
  fromClientId: string;
  toClientId: string;
  type: SignalType;
  payload: unknown;
  createdAt: string;
};

export type RoomState = {
  id: string;
  players: Record<Role, string | null>;
  status: RoomStatus;
  gameIndex: number;
  games: GameType[];
  score: Record<Role, number>;
  finalWinner: Role | "tie" | null;
  lastMessage: string;
  updatedAt: string;

  duo: {
    width: number;
    height: number;
    goalX: number;
    players: Record<Role, DuoPlayerState>;
    gems: DuoGem[];
    collectedBy: Record<Role, string[]>;
    winner: Role | "tie" | null;
  };

  nardi: {
    points: NardiPoint[];
    bar: Record<Role, number>;
    off: Record<Role, number>;
    turn: Role;
    dice: number[];
    rolled: boolean;
    winner: Role | null;
    moveHints: NardiMove[];
    lastMove: string;
  };

  signals: SignalEvent[];
  signalSeq: number;
};

type Subscriber = (state: RoomState) => void;

type Store = {
  rooms: Map<string, RoomState>;
  subscribers: Map<string, Set<Subscriber>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __LOVE_ROOM_STORE_V4__: Store | undefined;
}

const store: Store = globalThis.__LOVE_ROOM_STORE_V4__ ?? {
  rooms: new Map<string, RoomState>(),
  subscribers: new Map<string, Set<Subscriber>>()
};

globalThis.__LOVE_ROOM_STORE_V4__ = store;

function nowIso() {
  return new Date().toISOString();
}

function emptyDuoPlayer(x: number, y: number): DuoPlayerState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    finished: false,
    updatedAt: nowIso()
  };
}

function createNardiStartPoints(): NardiPoint[] {
  const points: NardiPoint[] = Array.from({ length: 24 }, () => ({ owner: null, count: 0 }));

  // Standard backgammon setup.
  points[0] = { owner: "nini", count: 2 };
  points[11] = { owner: "nini", count: 5 };
  points[16] = { owner: "nini", count: 3 };
  points[18] = { owner: "nini", count: 5 };

  points[23] = { owner: "luka", count: 2 };
  points[12] = { owner: "luka", count: 5 };
  points[7] = { owner: "luka", count: 3 };
  points[5] = { owner: "luka", count: 5 };

  return points;
}

function createRoom(id: string): RoomState {
  return {
    id,
    players: { nini: null, luka: null },
    status: "waiting",
    gameIndex: 0,
    games: ["duo", "nardi"],
    score: { nini: 0, luka: 0 },
    finalWinner: null,
    lastMessage: "",
    updatedAt: nowIso(),

    duo: {
      width: 1800,
      height: 580,
      goalX: 1700,
      players: {
        nini: emptyDuoPlayer(70, 500),
        luka: emptyDuoPlayer(130, 500)
      },
      gems: [
        { id: "n-g-1", owner: "nini", x: 260, y: 470 },
        { id: "n-g-2", owner: "nini", x: 750, y: 360 },
        { id: "n-g-3", owner: "nini", x: 1380, y: 260 },
        { id: "l-g-1", owner: "luka", x: 340, y: 470 },
        { id: "l-g-2", owner: "luka", x: 860, y: 420 },
        { id: "l-g-3", owner: "luka", x: 1520, y: 300 }
      ],
      collectedBy: { nini: [], luka: [] },
      winner: null
    },

    nardi: {
      points: createNardiStartPoints(),
      bar: { nini: 0, luka: 0 },
      off: { nini: 0, luka: 0 },
      turn: "nini",
      dice: [],
      rolled: false,
      winner: null,
      moveHints: [],
      lastMove: "Roll dice to start."
    },

    signals: [],
    signalSeq: 0
  };
}

function emit(room: RoomState) {
  const subs = store.subscribers.get(room.id);
  if (!subs) return;
  subs.forEach((fn) => fn(room));
}

function hasBoth(room: RoomState) {
  return Boolean(room.players.nini && room.players.luka);
}

function roleForClient(room: RoomState, clientId: string): Role | null {
  if (room.players.nini === clientId) return "nini";
  if (room.players.luka === clientId) return "luka";
  return null;
}

function roomFullFor(room: RoomState, clientId: string) {
  const occupied = [room.players.nini, room.players.luka].filter(Boolean) as string[];
  if (occupied.length < 2) return false;
  return !occupied.includes(clientId);
}

function currentGame(room: RoomState): GameType {
  return room.games[room.gameIndex] ?? "nardi";
}

function opposite(role: Role): Role {
  return role === "nini" ? "luka" : "nini";
}

function isHome(role: Role, idx: number) {
  return role === "nini" ? idx >= 18 && idx <= 23 : idx >= 0 && idx <= 5;
}

function direction(role: Role) {
  return role === "nini" ? 1 : -1;
}

function canLand(state: RoomState["nardi"], role: Role, idx: number) {
  const p = state.points[idx];
  if (!p.owner) return true;
  if (p.owner === role) return true;
  return p.count === 1;
}

function allInHome(state: RoomState["nardi"], role: Role) {
  if (state.bar[role] > 0) return false;
  for (let i = 0; i < state.points.length; i += 1) {
    const p = state.points[i];
    if (p.owner === role && p.count > 0 && !isHome(role, i)) return false;
  }
  return true;
}

function hasFurtherCheckerInHome(state: RoomState["nardi"], role: Role, idx: number) {
  if (role === "nini") {
    for (let i = idx + 1; i <= 23; i += 1) {
      const p = state.points[i];
      if (p.owner === role && p.count > 0) return true;
    }
  } else {
    for (let i = idx - 1; i >= 0; i -= 1) {
      const p = state.points[i];
      if (p.owner === role && p.count > 0) return true;
    }
  }
  return false;
}

function listLegalNardiMoves(state: RoomState["nardi"], role: Role): NardiMove[] {
  if (!state.rolled || state.winner) return [];
  const moves: NardiMove[] = [];
  const uniqueDice = Array.from(new Set(state.dice));

  for (const die of uniqueDice) {
    if (state.bar[role] > 0) {
      const to = role === "nini" ? die - 1 : 24 - die;
      if (to >= 0 && to <= 23 && canLand(state, role, to)) {
        moves.push({ from: "bar", to, die });
      }
      continue;
    }

    for (let from = 0; from < 24; from += 1) {
      const p = state.points[from];
      if (p.owner !== role || p.count < 1) continue;

      const to = from + direction(role) * die;
      if (to >= 0 && to <= 23) {
        if (canLand(state, role, to)) {
          moves.push({ from, to, die });
        }
        continue;
      }

      if (!allInHome(state, role) || !isHome(role, from)) continue;

      const exactOff = role === "nini" ? from + die === 24 : from - die === -1;
      const canUseBigDie = !exactOff && !hasFurtherCheckerInHome(state, role, from);
      if (exactOff || canUseBigDie) {
        moves.push({ from, to: "off", die });
      }
    }
  }

  return moves;
}

function removeDie(dice: number[], die: number) {
  const idx = dice.indexOf(die);
  if (idx >= 0) dice.splice(idx, 1);
}

function addChecker(points: NardiPoint[], idx: number, role: Role) {
  const p = points[idx];
  if (!p.owner || p.count === 0) {
    p.owner = role;
    p.count = 1;
    return;
  }

  if (p.owner === role) {
    p.count += 1;
  }
}

function removeChecker(points: NardiPoint[], idx: number) {
  const p = points[idx];
  p.count -= 1;
  if (p.count <= 0) {
    p.count = 0;
    p.owner = null;
  }
}

function applyNardiMove(state: RoomState["nardi"], role: Role, move: NardiMove) {
  if (move.from === "bar") {
    state.bar[role] -= 1;
  } else {
    removeChecker(state.points, move.from);
  }

  if (move.to === "off") {
    state.off[role] += 1;
  } else {
    const target = state.points[move.to];
    if (target.owner && target.owner !== role && target.count === 1) {
      state.bar[target.owner] += 1;
      target.owner = null;
      target.count = 0;
    }
    addChecker(state.points, move.to, role);
  }

  removeDie(state.dice, move.die);
}

function recalcHints(state: RoomState["nardi"], role: Role) {
  state.moveHints = listLegalNardiMoves(state, role);
}

function finalizeIfFinished(room: RoomState) {
  if (room.gameIndex >= room.games.length - 1) {
    room.status = "finished";
    if (room.score.nini > room.score.luka) room.finalWinner = "nini";
    else if (room.score.luka > room.score.nini) room.finalWinner = "luka";
    else room.finalWinner = "tie";
    room.lastMessage =
      room.finalWinner === "tie"
        ? "Both games finished as a draw."
        : room.finalWinner === "nini"
          ? "Nini wins the full match."
          : "Luka wins the full match.";
    room.updatedAt = nowIso();
    emit(room);
    return;
  }

  room.gameIndex += 1;
  room.lastMessage = "3D Backgammon started. Roll dice.";
  room.updatedAt = nowIso();
  emit(room);
}

function resetForNewMatch(room: RoomState) {
  room.status = "playing";
  room.gameIndex = 0;
  room.score = { nini: 0, luka: 0 };
  room.finalWinner = null;
  room.lastMessage = "Live Fire & Water challenge started.";

  room.duo.players.nini = emptyDuoPlayer(70, 500);
  room.duo.players.luka = emptyDuoPlayer(130, 500);
  room.duo.collectedBy = { nini: [], luka: [] };
  room.duo.winner = null;

  room.nardi.points = createNardiStartPoints();
  room.nardi.bar = { nini: 0, luka: 0 };
  room.nardi.off = { nini: 0, luka: 0 };
  room.nardi.turn = "nini";
  room.nardi.dice = [];
  room.nardi.rolled = false;
  room.nardi.winner = null;
  room.nardi.moveHints = [];
  room.nardi.lastMove = "Roll dice to start.";

  room.updatedAt = nowIso();
  emit(room);
}

export function getRoom(id: string) {
  let room = store.rooms.get(id);
  if (!room) {
    room = createRoom(id);
    store.rooms.set(id, room);
  }
  return room;
}

export function joinRoom(roomId: string, role: Role, clientId: string) {
  const room = getRoom(roomId);

  if (roomFullFor(room, clientId)) throw new Error("ROOM_FULL");

  const mine = roleForClient(room, clientId);
  if (mine && mine !== role) throw new Error("ROLE_LOCKED");

  const current = room.players[role];
  if (current && current !== clientId) throw new Error("ROLE_TAKEN");

  room.players[role] = clientId;
  room.updatedAt = nowIso();

  if (hasBoth(room) && room.status === "waiting") {
    resetForNewMatch(room);
    return room;
  }

  emit(room);
  return room;
}

export function leaveRoom(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  if (room.players.nini === clientId) room.players.nini = null;
  if (room.players.luka === clientId) room.players.luka = null;

  room.status = "waiting";
  room.lastMessage = "A player left. Waiting for both players.";
  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function syncDuoPlayer(
  roomId: string,
  role: Role,
  clientId: string,
  payload: { x?: number; y?: number; vx?: number; vy?: number; facing?: number; grounded?: boolean; finished?: boolean }
) {
  const room = getRoom(roomId);
  if (room.status !== "playing" || currentGame(room) !== "duo") return room;
  if (room.players[role] !== clientId) throw new Error("FORBIDDEN");

  const player = room.duo.players[role];
  player.x = Math.max(0, Math.min(room.duo.width, Number(payload.x ?? player.x)));
  player.y = Math.max(0, Math.min(room.duo.height, Number(payload.y ?? player.y)));
  player.vx = Number(payload.vx ?? player.vx);
  player.vy = Number(payload.vy ?? player.vy);
  player.facing = payload.facing === -1 ? -1 : 1;
  player.grounded = Boolean(payload.grounded ?? player.grounded);
  player.finished = Boolean(payload.finished ?? player.finished);
  player.updatedAt = nowIso();

  const bothFinished = room.duo.players.nini.finished && room.duo.players.luka.finished;
  if (bothFinished) {
    const tN = new Date(room.duo.players.nini.updatedAt).getTime();
    const tL = new Date(room.duo.players.luka.updatedAt).getTime();

    if (Math.abs(tN - tL) < 700) {
      room.duo.winner = "tie";
      room.score.nini += 2;
      room.score.luka += 2;
      room.lastMessage = "Fire & Water finished as perfect sync.";
    } else if (tN < tL) {
      room.duo.winner = "nini";
      room.score.nini += 3;
      room.lastMessage = "Fire girl finished first.";
    } else {
      room.duo.winner = "luka";
      room.score.luka += 3;
      room.lastMessage = "Water boy finished first.";
    }

    room.updatedAt = nowIso();
    finalizeIfFinished(room);
    return room;
  }

  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function collectDuoGem(roomId: string, role: Role, clientId: string, gemId: string) {
  const room = getRoom(roomId);
  if (room.status !== "playing" || currentGame(room) !== "duo") return room;
  if (room.players[role] !== clientId) throw new Error("FORBIDDEN");

  const gem = room.duo.gems.find((g) => g.id === gemId);
  if (!gem || gem.owner !== role) return room;

  const already = room.duo.collectedBy[role].includes(gemId);
  if (already) return room;

  room.duo.collectedBy[role].push(gemId);
  room.score[role] += 1;
  room.lastMessage = role === "nini" ? "Nini collected a fire gem." : "Luka collected a water gem.";
  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function nardiRoll(roomId: string, role: Role, clientId: string) {
  const room = getRoom(roomId);
  if (room.status !== "playing" || currentGame(room) !== "nardi") return room;
  if (room.players[role] !== clientId) throw new Error("FORBIDDEN");
  if (room.nardi.turn !== role || room.nardi.rolled || room.nardi.winner) return room;

  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  room.nardi.dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
  room.nardi.rolled = true;
  room.nardi.lastMove = `${role} rolled ${d1} and ${d2}.`;

  recalcHints(room.nardi, role);
  if (!room.nardi.moveHints.length) {
    room.nardi.lastMove = `${role} has no legal moves. Turn passed.`;
    room.nardi.dice = [];
    room.nardi.rolled = false;
    room.nardi.turn = opposite(role);
    room.nardi.moveHints = [];
  }

  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function nardiMove(
  roomId: string,
  role: Role,
  clientId: string,
  from: number | "bar",
  to: number | "off"
) {
  const room = getRoom(roomId);
  if (room.status !== "playing" || currentGame(room) !== "nardi") return room;
  if (room.players[role] !== clientId) throw new Error("FORBIDDEN");
  if (room.nardi.turn !== role || !room.nardi.rolled || room.nardi.winner) return room;

  recalcHints(room.nardi, role);
  const move = room.nardi.moveHints.find((m) => m.from === from && m.to === to);
  if (!move) return room;

  applyNardiMove(room.nardi, role, move);

  if (room.nardi.off[role] >= 15) {
    room.nardi.winner = role;
    room.nardi.lastMove = `${role} won backgammon.`;
    room.score[role] += 5;
    room.updatedAt = nowIso();
    finalizeIfFinished(room);
    return room;
  }

  recalcHints(room.nardi, role);
  if (!room.nardi.dice.length || !room.nardi.moveHints.length) {
    room.nardi.turn = opposite(role);
    room.nardi.dice = [];
    room.nardi.rolled = false;
    room.nardi.moveHints = [];
    room.nardi.lastMove = `Turn passed to ${room.nardi.turn}.`;
  } else {
    room.nardi.lastMove = `${role} moved ${from} -> ${to}.`;
  }

  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function restartMatch(roomId: string, role: Role, clientId: string) {
  const room = getRoom(roomId);
  if (room.players[role] !== clientId) throw new Error("FORBIDDEN");
  if (!hasBoth(room)) throw new Error("NEED_BOTH");
  resetForNewMatch(room);
  return room;
}

export function sendSignal(
  roomId: string,
  fromRole: Role,
  fromClientId: string,
  toClientId: string,
  type: SignalType,
  payload: unknown
) {
  const room = getRoom(roomId);
  if (room.players[fromRole] !== fromClientId) throw new Error("FORBIDDEN");

  room.signalSeq += 1;
  room.signals.push({
    id: room.signalSeq,
    fromClientId,
    toClientId,
    type,
    payload,
    createdAt: nowIso()
  });

  if (room.signals.length > 150) room.signals = room.signals.slice(-150);
  room.updatedAt = nowIso();
  emit(room);
  return room;
}

export function subscribeRoom(roomId: string, cb: Subscriber) {
  const set = store.subscribers.get(roomId) ?? new Set<Subscriber>();
  set.add(cb);
  store.subscribers.set(roomId, set);

  return () => {
    const current = store.subscribers.get(roomId);
    if (!current) return;
    current.delete(cb);
    if (current.size === 0) store.subscribers.delete(roomId);
  };
}

export function serializeRoom(room: RoomState) {
  return {
    id: room.id,
    players: room.players,
    status: room.status,
    gameIndex: room.gameIndex,
    games: room.games,
    currentGame: currentGame(room),
    score: room.score,
    finalWinner: room.finalWinner,
    lastMessage: room.lastMessage,
    updatedAt: room.updatedAt,

    duo: room.duo,
    nardi: room.nardi,
    signals: room.signals
  };
}
