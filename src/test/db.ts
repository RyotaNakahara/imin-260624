import { prisma } from "@/lib/db";

export async function resetDatabase(): Promise<void> {
  await prisma.answer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.event.deleteMany();
}
