import { supabase } from "@/lib/supabase";

export type DashboardSettings = {
  user_id: string;
  theme: string;
  clock_format: string;
  temperature_unit: string;
  /** null = show all; array = allowlist of Google calendar IDs */
  enabled_calendar_ids: string[] | null;
  /** null = show all; array = allowlist of Google task list IDs */
  enabled_task_list_ids: string[] | null;
};

/**
 * null/undefined → all sources enabled.
 * Non-null array → only listed IDs enabled (empty = none).
 */
export function isSourceEnabled(
  id: string,
  enabledIds: string[] | null | undefined
): boolean {
  if (enabledIds == null) {
    return true;
  }

  return enabledIds.includes(id);
}

/**
 * Switch state for the Sources page.
 * - null saved prefs → all on
 * - saved allowlist → on only if the ID is listed
 */
export function initialSourceToggles(
  currentIds: string[],
  savedEnabledIds: string[] | null | undefined
): Record<string, boolean> {
  if (savedEnabledIds == null) {
    return Object.fromEntries(currentIds.map((id) => [id, true]));
  }

  const saved = new Set(savedEnabledIds);

  return Object.fromEntries(
    currentIds.map((id) => [id, saved.has(id)])
  );
}

export function enabledIdsFromToggles(
  toggles: Record<string, boolean>
): string[] {
  return Object.entries(toggles)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);
}

export function filterByEnabledIds<T extends { id: string }>(
  items: T[],
  enabledIds: string[] | null | undefined
): T[] {
  if (enabledIds == null) {
    return items;
  }

  const enabled = new Set(enabledIds);
  return items.filter((item) => enabled.has(item.id));
}

function normalizeIdArray(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeSettings(data: DashboardSettings): DashboardSettings {
  return {
    ...data,
    enabled_calendar_ids: normalizeIdArray(data.enabled_calendar_ids),
    enabled_task_list_ids: normalizeIdArray(data.enabled_task_list_ids),
  };
}

export async function getDashboardSettings(userId: string) {
  const { data, error } = await supabase
    .from("dashboard_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeSettings(data as DashboardSettings) : null;
}

export async function createDashboardSettings(userId: string) {
  const { data, error } = await supabase
    .from("dashboard_settings")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeSettings(data as DashboardSettings);
}

export async function updateDashboardSettings(
  userId: string,
  patch: Partial<Omit<DashboardSettings, "user_id">>
) {
  const { data, error } = await supabase
    .from("dashboard_settings")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return normalizeSettings(data as DashboardSettings);
}

export async function getOrCreateDashboardSettings(userId: string) {
  const existing = await getDashboardSettings(userId);

  if (existing) {
    return existing;
  }

  return createDashboardSettings(userId);
}
