import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  isSameYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  type Locale,
} from "date-fns";

export type DateRange = { from: Date; to: Date };

export const PRESET_IDS = ["last7", "last30", "last90", "thisMonth", "lastMonth", "ytd"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const DEFAULT_PRESET: PresetId = "last30";

/** Ranges are inclusive and always include `today` except "Last month". */
export function getPresetRange(id: PresetId, today: Date = new Date()): DateRange {
  const day = startOfDay(today);
  switch (id) {
    case "last7":
      return { from: subDays(day, 6), to: day };
    case "last30":
      return { from: subDays(day, 29), to: day };
    case "last90":
      return { from: subDays(day, 89), to: day };
    case "thisMonth":
      return { from: startOfMonth(day), to: day };
    case "lastMonth": {
      const prev = subMonths(day, 1);
      return { from: startOfMonth(prev), to: startOfDay(endOfMonth(prev)) };
    }
    case "ytd":
      return { from: startOfYear(day), to: day };
  }
}

/** Returns the preset matching a range exactly, if any. */
export function matchPreset(range: DateRange, today: Date = new Date()): PresetId | null {
  for (const id of PRESET_IDS) {
    const p = getPresetRange(id, today);
    if (isSameDay(p.from, range.from) && isSameDay(p.to, range.to)) return id;
  }
  return null;
}

/** Number of days in an inclusive range. */
export function rangeLength(range: DateRange): number {
  return differenceInCalendarDays(range.to, range.from) + 1;
}

/** Period of equal length immediately before `range`. */
export function getPreviousPeriod(range: DateRange): DateRange {
  const to = subDays(startOfDay(range.from), 1);
  return { from: subDays(to, rangeLength(range) - 1), to };
}

export function formatRange(range: DateRange, locale: Locale): string {
  const isFr = locale.code?.startsWith("fr") ?? false;
  const short = isFr ? "d MMM" : "MMM d";
  const long = isFr ? "d MMM yyyy" : "MMM d, yyyy";
  if (isSameDay(range.from, range.to)) return format(range.from, long, { locale });
  const fromPattern = isSameYear(range.from, range.to) ? short : long;
  return `${format(range.from, fromPattern, { locale })} – ${format(range.to, long, { locale })}`;
}
