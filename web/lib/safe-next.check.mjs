// ponytail: one assert-based self-check for the auth gate return path.
// Run: node lib/safe-next.check.mjs
import { loginHref, safeNext } from "./safe-next.ts";

console.assert(safeNext("/new") === "/new", "internal path passes through");
console.assert(safeNext("/jam/abc?x=1#y") === "/jam/abc?x=1#y", "query and hash survive");
console.assert(safeNext(null) === "/feed", "missing next falls back");
console.assert(safeNext("") === "/feed", "empty next falls back");

// Open redirect attempts must never leave the site.
for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "http://evil.com", "javascript:alert(1)", "evil.com"]) {
  console.assert(safeNext(bad) === "/feed", `rejected: ${bad}`);
}

console.assert(safeNext("/x", "/") === "/x", "custom fallback unused when valid");
console.assert(safeNext("//evil.com", "/") === "/", "custom fallback used when rejected");

console.assert(loginHref("/jam/a b") === "/login?next=%2Fjam%2Fa%20b", `encoded, got ${loginHref("/jam/a b")}`);
console.assert(loginHref("//evil.com") === "/login?next=%2Ffeed", "loginHref sanitises too");

console.log("safe-next ok");
