import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.STORAGE_MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  process.env.JWT_SECRET = "bioseal-test-secret-key-32-chars-long";
  (process.env as any).NODE_ENV = "test";
});

afterAll(() => {
  // Cleanup
});
