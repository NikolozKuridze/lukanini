import type { CoupleProgress } from "@/lib/types";

const memoryStore = new Map<string, CoupleProgress>();

export function getProgress(id: string) {
  return memoryStore.get(id);
}

export function listProgress() {
  return Array.from(memoryStore.values());
}

export function saveProgress(item: CoupleProgress) {
  memoryStore.set(item.id, item);
  return item;
}
