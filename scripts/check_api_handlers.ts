#!/usr/bin/env tsx
import "dotenv/config";
import { hashPin } from "../src/server/picket_store";
import { verifyToken, issueToken, authConfigured } from "../src/server/auth_token";

let failed = false;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed = true;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`PASS: ${msg}`);
  }
}

console.log("=== API Handler Self-Check ===");

assert(authConfigured(), "AUTH_SECRET is configured (len >= 16)");

const token = issueToken({ username: "admin", role: "admin" });
assert(token.length > 0, "issueToken returns non-empty token");

const session = verifyToken(token);
assert(session !== null, "verifyToken accepts valid token");
assert(session?.role === "admin", "verifyToken returns correct role");

assert(verifyToken("invalid") === null, "verifyToken rejects malformed token");
assert(verifyToken("") === null, "verifyToken rejects empty token");

assert(verifyToken(`${token}.badSignature`) === null, "verifyToken rejects tampered token");

const pin = "12345678";
const hashed = hashPin(pin);
assert(hashed.startsWith("scrypt$"), "hashPin produces scrypt hash");

console.log("");
if (failed) {
  console.error("Handler self-check FAILED");
  process.exit(1);
}
console.log("Handler self-check PASSED");
