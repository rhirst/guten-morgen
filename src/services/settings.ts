import { supabase } from "@/lib/supabase";
import { DEFAULT_TASK_DAY_TIMEZONE } from "@/lib/google-dates";
import type {
  ImportedTheme,
  ThemeCustomization,
  ThemeLayoutCustomization,
} from "@/types/theme-customizer";
import { DEFAULT_THEME_LAYOUT } from "@/types/theme-customizer";

export type DashboardSettings = {
  user_id: string;
  theme: string;
  clock_format: string;
  temperature_unit: string;
  /** null = show all; array = allowlist of Google calendar IDs */
  enabled_calendar_ids: string[] | null;
  /** null = show all; array = allowlist of Google task list IDs */
  enabled_task_list_ids: string[] | null;
  /** IANA timezone for the 4:00 AM task-day reset */
  task_day_timezone: string;
  /** null = app defaults; saved theme customizer selections */
  theme_customization: ThemeCustomization | null;
};

/** Common IANA zones for the Sources timezone picker. */
export const TASK_DAY_TIMEZONE_OPTIONS = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
] as const;

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

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return result;
}

function normalizeImportedTheme(value: unknown): ImportedTheme | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const light = normalizeStringRecord(record.light);
  const dark = normalizeStringRecord(record.dark);

  if (Object.keys(light).length === 0 && Object.keys(dark).length === 0) {
    return null;
  }

  return { light, dark };
}

function normalizeThemeLayout(value: unknown): ThemeLayoutCustomization {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_THEME_LAYOUT };
  }

  const record = value as Record<string, unknown>;

  const variant =
    record.variant === "sidebar" ||
    record.variant === "floating" ||
    record.variant === "inset"
      ? record.variant
      : DEFAULT_THEME_LAYOUT.variant;

  const collapsible =
    record.collapsible === "offcanvas" ||
    record.collapsible === "icon" ||
    record.collapsible === "none"
      ? record.collapsible
      : DEFAULT_THEME_LAYOUT.collapsible;

  const side =
    record.side === "left" || record.side === "right"
      ? record.side
      : DEFAULT_THEME_LAYOUT.side;

  return { variant, collapsible, side };
}

export function normalizeThemeCustomization(
  value: unknown
): ThemeCustomization | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    selectedTheme:
      typeof record.selectedTheme === "string" ? record.selectedTheme : "",
    selectedTweakcnTheme:
      typeof record.selectedTweakcnTheme === "string"
        ? record.selectedTweakcnTheme
        : "",
    selectedRadius:
      typeof record.selectedRadius === "string"
        ? record.selectedRadius
        : "0.5rem",
    importedTheme: normalizeImportedTheme(record.importedTheme),
    brandColors: normalizeStringRecord(record.brandColors),
    layout: normalizeThemeLayout(record.layout),
  };
}

function normalizeTaskDayTimezone(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return DEFAULT_TASK_DAY_TIMEZONE;
}

function normalizeSettings(data: DashboardSettings): DashboardSettings {
  return {
    ...data,
    enabled_calendar_ids: normalizeIdArray(data.enabled_calendar_ids),
    enabled_task_list_ids: normalizeIdArray(data.enabled_task_list_ids),
    task_day_timezone: normalizeTaskDayTimezone(data.task_day_timezone),
    theme_customization: normalizeThemeCustomization(data.theme_customization),
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
