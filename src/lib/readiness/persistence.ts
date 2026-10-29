/**
 * Simple persistence layer for examiner actions
 * Uses JSON file storage (in production, use a proper database)
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ExaminerAction } from "@/lib/types/readiness";

const STORAGE_DIR = join(process.cwd(), ".readiness-data");
const ACTIONS_FILE = join(STORAGE_DIR, "examiner-actions.json");

interface StoredActions {
  actions: ExaminerAction[];
}

/**
 * Initialize storage directory
 */
async function ensureStorage() {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
  if (!existsSync(ACTIONS_FILE)) {
    await writeFile(ACTIONS_FILE, JSON.stringify({ actions: [] }, null, 2));
  }
}

/**
 * Load all examiner actions
 */
export async function loadExaminerActions(): Promise<ExaminerAction[]> {
  try {
    await ensureStorage();
    const data = await readFile(ACTIONS_FILE, "utf-8");
    const stored: StoredActions = JSON.parse(data);
    return stored.actions;
  } catch (error) {
    console.error("Error loading examiner actions:", error);
    return [];
  }
}

/**
 * Save an examiner action
 */
export async function saveExaminerAction(
  action: ExaminerAction,
): Promise<void> {
  try {
    await ensureStorage();
    const actions = await loadExaminerActions();
    actions.push(action);
    await writeFile(
      ACTIONS_FILE,
      JSON.stringify({ actions }, null, 2),
    );
  } catch (error) {
    console.error("Error saving examiner action:", error);
    throw error;
  }
}

/**
 * Get examiner actions for a specific flag
 */
export async function getActionsForFlag(
  flagId: string,
): Promise<ExaminerAction[]> {
  const actions = await loadExaminerActions();
  return actions.filter((a) => a.flagId === flagId);
}

/**
 * Calculate acceptance/override rates
 */
export async function calculateAcceptanceRates(): Promise<{
  totalActions: number;
  acceptCount: number;
  overrideCount: number;
  acceptanceRate: number;
  overrideRate: number;
  byDefectType: Record<
    string,
    { accepts: number; overrides: number; rate: number }
  >;
}> {
  const actions = await loadExaminerActions();

  const totalActions = actions.length;
  const acceptCount = actions.filter((a) => a.action === "accept").length;
  const overrideCount = actions.filter((a) => a.action === "override").length;

  const acceptanceRate =
    totalActions > 0 ? acceptCount / totalActions : 0;
  const overrideRate =
    totalActions > 0 ? overrideCount / totalActions : 0;

  // Group by defect type (extracted from flag ID if available)
  const byDefectType: Record<
    string,
    { accepts: number; overrides: number; rate: number }
  > = {};

  // Note: In production, we'd store the defect type with each action
  // For now, this is a stub showing the structure

  return {
    totalActions,
    acceptCount,
    overrideCount,
    acceptanceRate,
    overrideRate,
    byDefectType,
  };
}

/**
 * Clear all stored actions (for testing)
 */
export async function clearExaminerActions(): Promise<void> {
  try {
    await ensureStorage();
    await writeFile(
      ACTIONS_FILE,
      JSON.stringify({ actions: [] }, null, 2),
    );
  } catch (error) {
    console.error("Error clearing examiner actions:", error);
  }
}
