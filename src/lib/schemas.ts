import { z } from "zod";

export const slotTypeSchema = z.enum(["date", "datetime"]);
export const answerStatusSchema = z.enum(["available", "unavailable", "tentative"]);

export const createSlotSchema = z.object({
  type: slotTypeSchema,
  /** date: "YYYY-MM-DD", datetime: "YYYY-MM-DDTHH:mm" (JST as local input) */
  startAt: z.string().min(1),
});

export const updateSlotSchema = createSlotSchema.extend({
  id: z.string().min(1).optional(),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  /** ISO 8601 or "YYYY-MM-DDTHH:mm" in JST semantics; null = no deadline */
  deadline: z.string().nullable().optional(),
  slots: z.array(createSlotSchema).min(1).max(30),
});

export const updateEventSchema = z.object({
  hostToken: z.string().min(1),
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  deadline: z.string().nullable().optional(),
  slots: z.array(updateSlotSchema).min(1).max(30).optional(),
});

export const answerInputSchema = z.object({
  slotId: z.string().min(1),
  status: answerStatusSchema,
});

export const createResponseSchema = z.object({
  displayName: z.string().trim().min(1).max(50),
  comment: z.string().trim().max(500).optional().nullable(),
  answers: z.array(answerInputSchema).min(1),
});

export const updateResponseSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  comment: z.string().trim().max(500).optional().nullable(),
  answers: z.array(answerInputSchema).min(1),
});

export const hostTokenQuerySchema = z.object({
  token: z.string().min(1),
});

export type SlotType = z.infer<typeof slotTypeSchema>;
export type AnswerStatus = z.infer<typeof answerStatusSchema>;
export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateResponseInput = z.infer<typeof createResponseSchema>;
export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;
