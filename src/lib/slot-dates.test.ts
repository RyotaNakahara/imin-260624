import { describe, expect, it } from "vitest";
import {
  generateDateRange,
  mergeDateKeysIntoSlots,
  slotDateKey,
  toSlotStartAt,
} from "./slot-dates";

describe("slot-dates", () => {
  it("extracts date keys for date and datetime slots", () => {
    expect(slotDateKey("2026-06-24", "date")).toBe("2026-06-24");
    expect(slotDateKey("2026-06-24T14:00", "datetime")).toBe("2026-06-24");
  });

  it("builds datetime slot values with default time", () => {
    expect(toSlotStartAt("2026-06-24", "datetime", "14:30")).toBe(
      "2026-06-24T14:30",
    );
  });

  it("generates inclusive date ranges", () => {
    expect(generateDateRange("2026-06-24", "2026-06-26")).toEqual([
      "2026-06-24",
      "2026-06-25",
      "2026-06-26",
    ]);
  });

  it("filters weekdays in range generation", () => {
    const weekdays = generateDateRange("2026-06-22", "2026-06-28", {
      weekdaysOnly: true,
    });
    expect(weekdays).toEqual([
      "2026-06-22",
      "2026-06-23",
      "2026-06-24",
      "2026-06-25",
      "2026-06-26",
    ]);
  });

  it("merges new dates without duplicates and respects max", () => {
    const existing = [{ id: "a", startAt: "2026-06-24" }];
    const merged = mergeDateKeysIntoSlots(
      existing,
      ["2026-06-24", "2026-06-25", "2026-06-26"],
      "date",
      (startAt) => ({ id: startAt, startAt }),
      { maxSlots: 2 },
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((slot) => slot.startAt)).toEqual([
      "2026-06-24",
      "2026-06-25",
    ]);
  });
});
