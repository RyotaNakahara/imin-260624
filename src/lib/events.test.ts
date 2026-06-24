import { describe, expect, it } from "vitest";
import { jstDateStringToDate, jstDateTimeStringToDate } from "@/lib/datetime";
import {
  getBaseUrl,
  hasDuplicateSlots,
  parseDeadlineInput,
  parseSlotStartAt,
  sortSlotsByStartAt,
  validateAnswersForEvent,
} from "@/lib/events";

describe("events helpers", () => {
  describe("parseSlotStartAt", () => {
    it("parses date-only slots", () => {
      const date = parseSlotStartAt({ type: "date", startAt: "2026-07-01" });
      expect(date.toISOString()).toBe("2026-06-30T15:00:00.000Z");
    });

    it("parses datetime slots", () => {
      const date = parseSlotStartAt({
        type: "datetime",
        startAt: "2026-07-01T10:00",
      });
      expect(date.toISOString()).toBe("2026-07-01T01:00:00.000Z");
    });

    it("throws for invalid date format", () => {
      expect(() =>
        parseSlotStartAt({ type: "date", startAt: "2026/07/01" }),
      ).toThrow("日付の形式が正しくありません（YYYY-MM-DD）");
    });

    it("throws for invalid datetime format", () => {
      expect(() =>
        parseSlotStartAt({ type: "datetime", startAt: "2026-07-01" }),
      ).toThrow("日時の形式が正しくありません（YYYY-MM-DDTHH:mm）");
    });
  });

  describe("parseDeadlineInput", () => {
    it("returns null for empty values", () => {
      expect(parseDeadlineInput(null)).toBeNull();
      expect(parseDeadlineInput(undefined)).toBeNull();
      expect(parseDeadlineInput("")).toBeNull();
    });

    it("parses date-only deadline", () => {
      const date = parseDeadlineInput("2026-07-10");
      expect(date).toEqual(jstDateStringToDate("2026-07-10"));
    });

    it("parses datetime deadline", () => {
      const date = parseDeadlineInput("2026-07-10T18:00");
      expect(date).toEqual(jstDateTimeStringToDate("2026-07-10T18:00"));
    });
  });

  describe("hasDuplicateSlots", () => {
    it("returns false when all slots are unique", () => {
      const result = hasDuplicateSlots([
        { type: "date", startAt: "2026-07-01" },
        { type: "datetime", startAt: "2026-07-01T10:00" },
      ]);
      expect(result).toBe(false);
    });

    it("returns true when slots have the same type and startAt", () => {
      const result = hasDuplicateSlots([
        { type: "date", startAt: "2026-07-01" },
        { type: "date", startAt: "2026-07-01" },
      ]);
      expect(result).toBe(true);
    });
  });

  describe("sortSlotsByStartAt", () => {
    it("sorts slots by start time ascending", () => {
      const sorted = sortSlotsByStartAt([
        { type: "date", startAt: "2026-07-03" },
        { type: "date", startAt: "2026-07-01" },
        { type: "datetime", startAt: "2026-07-02T14:00" },
      ]);

      expect(sorted.map((slot) => slot.startAt)).toEqual([
        "2026-07-01",
        "2026-07-02T14:00",
        "2026-07-03",
      ]);
    });
  });

  describe("validateAnswersForEvent", () => {
    const slotIds = ["slot-a", "slot-b"];

    it("returns null when all slots are answered exactly once", () => {
      const result = validateAnswersForEvent(slotIds, [
        { slotId: "slot-a", status: "available" },
        { slotId: "slot-b", status: "unavailable" },
      ]);
      expect(result).toBeNull();
    });

    it("rejects when answer count does not match slot count", () => {
      const result = validateAnswersForEvent(slotIds, [
        { slotId: "slot-a", status: "available" },
      ]);
      expect(result).toBe("すべての候補日に回答してください");
    });

    it("rejects invalid slot ids", () => {
      const result = validateAnswersForEvent(slotIds, [
        { slotId: "slot-a", status: "available" },
        { slotId: "slot-x", status: "unavailable" },
      ]);
      expect(result).toBe("無効な候補日が含まれています");
    });

    it("rejects duplicate answers for the same slot", () => {
      const result = validateAnswersForEvent(slotIds, [
        { slotId: "slot-a", status: "available" },
        { slotId: "slot-a", status: "unavailable" },
      ]);
      expect(result).toBe("同じ候補日への重複回答があります");
    });
  });

  describe("getBaseUrl", () => {
    it("builds URL from request headers", () => {
      const request = new Request("http://ignored/api/events", {
        headers: {
          host: "example.com",
          "x-forwarded-proto": "https",
        },
      });
      expect(getBaseUrl(request)).toBe("https://example.com");
    });

    it("falls back to localhost when headers are missing", () => {
      const request = new Request("http://ignored/api/events");
      expect(getBaseUrl(request)).toBe("http://localhost:3000");
    });
  });
});
