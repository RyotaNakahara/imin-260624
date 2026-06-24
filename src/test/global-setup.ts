import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_DB = path.join(process.cwd(), "test.db");

export default function globalSetup() {
  for (const file of [TEST_DB, `${TEST_DB}-journal`]) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
