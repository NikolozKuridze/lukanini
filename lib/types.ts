export type GameKey = "heartBurst" | "syncTap" | "loveQuiz";

export type PlayerStats = {
  name: string;
  points: number;
  wins: number;
};

export type CoupleProgress = {
  id: string;
  nini: string;
  luka: string;
  level: number;
  points: number;
  unlockedSurprises: number[];
  leaderboard: [PlayerStats, PlayerStats];
  gameStats: Record<GameKey, number>;
  updatedAt: string;
};

export type SurpriseItem = {
  level: number;
  title: string;
  message: string;
};

export type LeaderboardResponse = {
  coupleId: string;
  ranking: PlayerStats[];
  totalPoints: number;
  updatedAt: string;
};
