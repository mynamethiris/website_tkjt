#!/usr/bin/env tsx
import { hashPin, verifyPin, isHashedPin } from "../src/server/picket_store";

let failed = false;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed = true;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`PASS: ${msg}`);
  }
}

console.log("=== PIN Hash Self-Check ===");

const pin = "12345678";
const hashed = hashPin(pin);
assert(hashed.startsWith("scrypt$"), `hash format starts with scrypt$ (got ${hashed.slice(0, 20)}...)`);
assert(isHashedPin(hashed), "isHashedPin recognizes scrypt hash");
assert(!isHashedPin(pin), "isHashedPin rejects plaintext pin");
assert(verifyPin(pin, hashed), "verifyPin succeeds with correct pin");
assert(!verifyPin("87654321", hashed), "verifyPin rejects wrong pin");
assert(verifyPin(pin, pin), "verifyPin accepts plaintext-stored pin for backward compat");

const corrupted = hashed.slice(0, 30) + "ZZZZ";
assert(!verifyPin(pin, corrupted), "verifyPin rejects corrupted hash");

console.log("");
if (failed) {
  console.error("Self-check FAILED");
  process.exit(1);
}
console.log("Self-check PASSED");
