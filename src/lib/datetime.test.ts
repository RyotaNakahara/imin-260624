import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatJstDate,
  formatJstDateTime,
  formatSlotStartAt,
  isPastDeadline,
  jstDateStringToDate,
  jstDateTimeStringToDate,
  toJstDateInput,
  toJstDateTimeLocalInput,
  validateFutureDeadline,
} from "@/lib/datetime";

describe("datetime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T03:00:00.000Z")); // 2026-06-24 12:00 JST
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("jstDateStringToDate", () => {
    it("converts a JST date string to UTC midnight JST", () => {
      const date = jstDateStringToDate("2026-06-24");
      expect(date.toISOString()).toBe("2026-06-23T15:00:00.000Z");
    });
  });

  describe("jstDateTimeStringToDate", () => {
    it("converts a JST datetime string without seconds", () => {
      const date = jstDateTimeStringToDate("2026-06-24T14:00");
      expect(date.toISOString()).toBe("2026-06-24T05:00:00.000Z");
    });

    it("converts a JST datetime string with seconds", () => {
      const date = jstDateTimeStringToDate("2026-06-24T14:00:00");
      expect(date.toISOString()).toBe("2026-06-24T05:00:00.000Z");
    });
  });

  describe("formatJstDate", () => {
    it("formats a date in JST as yyyy/MM/dd", () => {
      const date = jstDateStringToDate("2026-06-24");
      expect(formatJstDate(date)).toBe("2026/06/24");
    });
  });

  describe("formatJstDateTime", () => {
    it("formats a datetime in JST as yyyy/MM/dd HH:mm", () => {
      const date = jstDateTimeStringToDate("2026-06-24T14:00");
      expect(formatJstDateTime(date)).toBe("2026/06/24 14:00");
    });
  });

  describe("formatSlotStartAt", () => {
    it("formats date-only slots without time", () => {
      const date = jstDateStringToDate("2026-06-24");
      expect(formatSlotStartAt(date, "date")).toBe("2026/06/24");
    });

    it("formats datetime slots with time", () => {
      const date = jstDateTimeStringToDate("2026-06-24T14:00");
      expect(formatSlotStartAt(date, "datetime")).toBe("2026/06/24 14:00");
    });
  });

  describe("isPastDeadline", () => {
    it("returns false when deadline is null", () => {
      expect(isPastDeadline(null)).toBe(false);
    });

    it("returns false when deadline is in the future", () => {
      const future = jstDateTimeStringToDate("2026-06-25T12:00");
      expect(isPastDeadline(future)).toBe(false);
    });

    it("returns true when deadline is in the past", () => {
      const past = jstDateTimeStringToDate("2026-06-23T12:00");
      expect(isPastDeadline(past)).toBe(true);
    });
  });

  describe("validateFutureDeadline", () => {
    it("returns null when deadline is null", () => {
      expect(validateFutureDeadline(null)).toBeNull();
    });

    it("returns an error when deadline is in the past", () => {
      const past = jstDateTimeStringToDate("2026-06-23T12:00");
      expect(validateFutureDeadline(past)).toBe(
        "回答期限は未来の日時を指定してください",
      );
    });

    it("returns null when deadline is in the future", () => {
      const future = jstDateTimeStringToDate("2026-06-25T12:00");
      expect(validateFutureDeadline(future)).toBeNull();
    });
  });

  describe("toJstDateInput", () => {
    it("returns yyyy-MM-dd for form inputs", () => {
      const date = jstDateStringToDate("2026-06-24");
      expect(toJstDateInput(date)).toBe("2026-06-24");
    });
  });

  describe("toJstDateTimeLocalInput", () => {
    it("returns yyyy-MM-ddTHH:mm for datetime-local inputs", () => {
      const date = jstDateTimeStringToDate("2026-06-24T14:00");
      expect(toJstDateTimeLocalInput(date)).toBe("2026-06-24T14:00");
    });
  });
});
