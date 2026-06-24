import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createEvent } from "@/app/api/events/route";
import { GET as getEvent, PATCH as patchEvent } from "@/app/api/events/[eventId]/route";
import { GET as getManage } from "@/app/api/events/[eventId]/manage/route";
import { GET as getSummary } from "@/app/api/events/[eventId]/summary/route";
import { POST as createResponse } from "@/app/api/events/[eventId]/responses/route";
import {
  GET as getResponse,
  PUT as updateResponse,
} from "@/app/api/events/[eventId]/responses/[responseToken]/route";
import { prisma } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { createSampleEvent, sampleSlots } from "@/test/fixtures";

function routeContext(eventId: string) {
  return { params: Promise.resolve({ eventId }) };
}

function responseRouteContext(eventId: string, responseToken: string) {
  return { params: Promise.resolve({ eventId, responseToken }) };
}

describe("events API", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T03:00:00.000Z"));
    await resetDatabase();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("POST /api/events", () => {
    it("creates an event and returns URLs", async () => {
      const { response, body } = await createSampleEvent();

      expect(response.status).toBe(201);
      expect(body.eventId).toBeTruthy();
      expect(body.hostToken).toBeTruthy();
      expect(body.urls.guest).toContain(`/e/${body.eventId}`);
      expect(body.urls.host).toContain(`token=${body.hostToken}`);

      const event = await prisma.event.findUnique({
        where: { id: body.eventId },
        include: { slots: true },
      });
      expect(event?.title).toBe("テスト予定");
      expect(event?.slots).toHaveLength(2);
    });

    it("rejects duplicate slots", async () => {
      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "重複テスト",
          slots: [
            { type: "date", startAt: "2026-07-01" },
            { type: "date", startAt: "2026-07-01" },
          ],
        }),
      });

      const response = await createEvent(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("同じ候補日が重複しています");
    });

    it("rejects a past deadline", async () => {
      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "期限切れ",
          deadline: "2026-06-23T12:00",
          slots: sampleSlots,
        }),
      });

      const response = await createEvent(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("回答期限は未来の日時を指定してください");
    });
  });

  describe("GET /api/events/[eventId]", () => {
    it("returns event data for a valid eventId", async () => {
      const { body: created } = await createSampleEvent();
      const response = await getEvent(
        new Request(`http://localhost:3000/api/events/${created.eventId}`),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe(created.eventId);
      expect(body.title).toBe("テスト予定");
      expect(body.slots).toHaveLength(2);
      expect(body.hostToken).toBeUndefined();
    });

    it("returns 404 for an unknown eventId", async () => {
      const response = await getEvent(
        new Request("http://localhost:3000/api/events/unknown-event-id"),
        routeContext("unknown-event-id"),
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("予定が見つかりません");
    });
  });

  describe("GET /api/events/[eventId]/manage", () => {
    it("returns event with responses when hostToken is valid", async () => {
      const { body: created } = await createSampleEvent();
      const response = await getManage(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/manage?token=${created.hostToken}`,
        ),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.hostToken).toBe(created.hostToken);
      expect(body.responses).toEqual([]);
    });

    it("returns 404 when hostToken is invalid", async () => {
      const { body: created } = await createSampleEvent();
      const response = await getManage(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/manage?token=invalid-token`,
        ),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("予定が見つかりません");
    });
  });

  describe("POST /api/events/[eventId]/responses", () => {
    it("creates a guest response", async () => {
      const { body: created } = await createSampleEvent();
      const event = await prisma.event.findUnique({
        where: { id: created.eventId },
        include: { slots: { orderBy: { sortOrder: "asc" } } },
      });
      const slots = event!.slots;

      const response = await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲストA",
              answers: slots.map((slot) => ({
                slotId: slot.id,
                status: "available",
              })),
            }),
          },
        ),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.displayName).toBe("ゲストA");
      expect(body.responseToken).toBeTruthy();
      expect(body.answers).toHaveLength(2);
    });

    it("returns 403 after the deadline has passed", async () => {
      const { body: created } = await createSampleEvent({
        deadline: "2026-06-25T18:00",
      });

      await prisma.event.update({
        where: { id: created.eventId },
        data: { deadline: new Date("2026-06-24T01:00:00.000Z") }, // 2026-06-24 10:00 JST
      });

      const event = await prisma.event.findUnique({
        where: { id: created.eventId },
        include: { slots: true },
      });

      const response = await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲストB",
              answers: event!.slots.map((slot) => ({
                slotId: slot.id,
                status: "unavailable",
              })),
            }),
          },
        ),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe("回答期限を過ぎています");
    });
  });

  describe("PUT /api/events/[eventId]/responses/[responseToken]", () => {
    it("updates an existing response", async () => {
      const { body: created } = await createSampleEvent();
      const event = await prisma.event.findUnique({
        where: { id: created.eventId },
        include: { slots: { orderBy: { sortOrder: "asc" } } },
      });
      const slots = event!.slots;

      const createRes = await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲストC",
              answers: slots.map((slot) => ({
                slotId: slot.id,
                status: "available",
              })),
            }),
          },
        ),
        routeContext(created.eventId),
      );
      const createdResponse = await createRes.json();

      const updateRes = await updateResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses/${createdResponse.responseToken}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲストC（更新）",
              answers: slots.map((slot, index) => ({
                slotId: slot.id,
                status: index === 0 ? "unavailable" : "available",
              })),
            }),
          },
        ),
        responseRouteContext(
          created.eventId,
          createdResponse.responseToken,
        ),
      );
      const updated = await updateRes.json();

      expect(updateRes.status).toBe(200);
      expect(updated.displayName).toBe("ゲストC（更新）");
      const firstSlotAnswer = updated.answers.find(
        (answer: { slotId: string }) => answer.slotId === slots[0].id,
      );
      expect(firstSlotAnswer?.status).toBe("unavailable");
    });

    it("returns an existing response via GET", async () => {
      const { body: created } = await createSampleEvent();
      const event = await prisma.event.findUnique({
        where: { id: created.eventId },
        include: { slots: true },
      });

      const createRes = await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲストD",
              answers: event!.slots.map((slot) => ({
                slotId: slot.id,
                status: "available",
              })),
            }),
          },
        ),
        routeContext(created.eventId),
      );
      const createdResponse = await createRes.json();

      const getRes = await getResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses/${createdResponse.responseToken}`,
        ),
        responseRouteContext(
          created.eventId,
          createdResponse.responseToken,
        ),
      );
      const body = await getRes.json();

      expect(getRes.status).toBe(200);
      expect(body.displayName).toBe("ゲストD");
    });
  });

  describe("PATCH /api/events/[eventId]", () => {
    it("updates event title when hostToken is valid", async () => {
      const { body: created } = await createSampleEvent();
      const response = await patchEvent(
        new Request(`http://localhost:3000/api/events/${created.eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostToken: created.hostToken,
            title: "更新後タイトル",
          }),
        }),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.title).toBe("更新後タイトル");
    });

    it("returns 404 when hostToken is invalid", async () => {
      const { body: created } = await createSampleEvent();
      const response = await patchEvent(
        new Request(`http://localhost:3000/api/events/${created.eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostToken: "wrong-token",
            title: "更新失敗",
          }),
        }),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("予定が見つかりません");
    });
  });

  describe("GET /api/events/[eventId]/summary", () => {
    it("returns per-slot availability counts", async () => {
      const { body: created } = await createSampleEvent();
      const event = await prisma.event.findUnique({
        where: { id: created.eventId },
        include: { slots: { orderBy: { sortOrder: "asc" } } },
      });
      const slots = event!.slots;

      await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲスト1",
              answers: [
                { slotId: slots[0].id, status: "available" },
                { slotId: slots[1].id, status: "unavailable" },
              ],
            }),
          },
        ),
        routeContext(created.eventId),
      );

      await createResponse(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: "ゲスト2",
              answers: [
                { slotId: slots[0].id, status: "available" },
                { slotId: slots[1].id, status: "available" },
              ],
            }),
          },
        ),
        routeContext(created.eventId),
      );

      const response = await getSummary(
        new Request(
          `http://localhost:3000/api/events/${created.eventId}/summary`,
        ),
        routeContext(created.eventId),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.slots).toHaveLength(2);
      expect(body.slots[0]).toEqual({
        slotId: slots[0].id,
        available: 2,
        unavailable: 0,
      });
      expect(body.slots[1]).toEqual({
        slotId: slots[1].id,
        available: 1,
        unavailable: 1,
      });
    });
  });
});
