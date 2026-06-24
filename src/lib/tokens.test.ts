import { describe, expect, it } from "vitest";
import {
  generateEventId,
  generateHostToken,
  generateId,
  generateResponseToken,
} from "@/lib/tokens";

describe("tokens", () => {
  it("generates eventId with at least 21 characters", () => {
    const id = generateEventId();
    expect(id.length).toBeGreaterThanOrEqual(21);
  });

  it("generates hostToken with at least 32 characters", () => {
    const token = generateHostToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("generates responseToken with at least 32 characters", () => {
    const token = generateResponseToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  it("uses only URL-safe characters", () => {
    const pattern = /^[0-9A-Za-z]+$/;
    expect(pattern.test(generateEventId())).toBe(true);
    expect(pattern.test(generateHostToken())).toBe(true);
    expect(pattern.test(generateResponseToken())).toBe(true);
  });
});
