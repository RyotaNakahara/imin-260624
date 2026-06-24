import { describe, expect, it } from "vitest";
import {
  createEventSchema,
  createResponseSchema,
  hostTokenQuerySchema,
  updateEventSchema,
  updateResponseSchema,
} from "@/lib/schemas";

describe("schemas", () => {
  const validSlot = { type: "date" as const, startAt: "2026-07-01" };

  describe("createEventSchema", () => {
    it("accepts a valid event payload", () => {
      const result = createEventSchema.safeParse({
        title: "飲み会",
        description: "居酒屋で",
        deadline: "2026-07-10T18:00",
        slots: [validSlot],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty title", () => {
      const result = createEventSchema.safeParse({
        title: "   ",
        slots: [validSlot],
      });
      expect(result.success).toBe(false);
    });

    it("rejects a title longer than 100 characters", () => {
      const result = createEventSchema.safeParse({
        title: "a".repeat(101),
        slots: [validSlot],
      });
      expect(result.success).toBe(false);
    });

    it("rejects when no slots are provided", () => {
      const result = createEventSchema.safeParse({
        title: "飲み会",
        slots: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 30 slots", () => {
      const result = createEventSchema.safeParse({
        title: "飲み会",
        slots: Array.from({ length: 31 }, () => validSlot),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateEventSchema", () => {
    it("requires hostToken", () => {
      const result = updateEventSchema.safeParse({ title: "更新" });
      expect(result.success).toBe(false);
    });

    it("accepts partial updates with hostToken", () => {
      const result = updateEventSchema.safeParse({
        hostToken: "valid-host-token",
        title: "更新後タイトル",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("createResponseSchema", () => {
    it("accepts a valid response", () => {
      const result = createResponseSchema.safeParse({
        displayName: "田中",
        answers: [{ slotId: "slot-1", status: "available" }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects an empty display name", () => {
      const result = createResponseSchema.safeParse({
        displayName: "  ",
        answers: [{ slotId: "slot-1", status: "available" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects a display name longer than 50 characters", () => {
      const result = createResponseSchema.safeParse({
        displayName: "a".repeat(51),
        answers: [{ slotId: "slot-1", status: "available" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid answer status", () => {
      const result = createResponseSchema.safeParse({
        displayName: "田中",
        answers: [{ slotId: "slot-1", status: "maybe" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateResponseSchema", () => {
    it("requires answers even when displayName is omitted", () => {
      const result = updateResponseSchema.safeParse({
        answers: [{ slotId: "slot-1", status: "unavailable" }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("hostTokenQuerySchema", () => {
    it("rejects an empty token", () => {
      const result = hostTokenQuerySchema.safeParse({ token: "" });
      expect(result.success).toBe(false);
    });

    it("accepts a non-empty token", () => {
      const result = hostTokenQuerySchema.safeParse({ token: "abc123" });
      expect(result.success).toBe(true);
    });
  });
});
