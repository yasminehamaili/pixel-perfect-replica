import { describe, expect, it } from "vitest";
import { format } from "date-fns";

import { getPresetRange, getPreviousPeriod } from "@/lib/date-range";

const today = new Date(2026, 10, 21); // 21 Nov 2026
const fmt = (d: Date) => format(d, "yyyy-MM-dd");

describe("date range presets", () => {
  it("Last 7 days covers 7 days ending today", () => {
    const r = getPresetRange("last7", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-11-15", "2026-11-21"]);
  });
  it("Last 30 days covers 30 days ending today", () => {
    const r = getPresetRange("last30", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-10-23", "2026-11-21"]);
  });
  it("Last 90 days covers 90 days ending today", () => {
    const r = getPresetRange("last90", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-08-24", "2026-11-21"]);
  });
  it("This month runs from the 1st to today", () => {
    const r = getPresetRange("thisMonth", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-11-01", "2026-11-21"]);
  });
  it("Last month is the full previous calendar month", () => {
    const r = getPresetRange("lastMonth", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-10-01", "2026-10-31"]);
  });
  it("Year to date runs from 1 January to today", () => {
    const r = getPresetRange("ytd", today);
    expect([fmt(r.from), fmt(r.to)]).toEqual(["2026-01-01", "2026-11-21"]);
  });
});

describe("previous period comparison", () => {
  it("is the same length, ending the day before the range starts", () => {
    const prev = getPreviousPeriod({ from: new Date(2026, 10, 1), to: new Date(2026, 10, 21) });
    expect([fmt(prev.from), fmt(prev.to)]).toEqual(["2026-10-11", "2026-10-31"]);
  });
});
