import { customAlphabet } from "nanoid";

const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const eventIdGenerator = customAlphabet(alphabet, 21);
const hostTokenGenerator = customAlphabet(alphabet, 32);
const responseTokenGenerator = customAlphabet(alphabet, 32);
const idGenerator = customAlphabet(alphabet, 21);

export function generateEventId(): string {
  return eventIdGenerator();
}

export function generateHostToken(): string {
  return hostTokenGenerator();
}

export function generateResponseToken(): string {
  return responseTokenGenerator();
}

export function generateId(): string {
  return idGenerator();
}
