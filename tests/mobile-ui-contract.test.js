import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const css=fs.readFileSync(path.join(root,"apps/web/src/style.css"),"utf8");
const html=fs.readFileSync(path.join(root,"apps/web/index.html"),"utf8");
const jsx=fs.readFileSync(path.join(root,"apps/web/src/WizardApp.jsx"),"utf8");

test("mobile UI contract includes safe-area, viewport-fit and horizontal overflow protection",()=>{
  assert.match(css,/env\(safe-area-inset-(top|right|bottom|left)\)/);
  assert.match(css,/overflow-x:hidden/);
  assert.match(html,/viewport-fit=cover/);
  assert.match(css,/min-height:48px/);
  assert.match(css,/min-height:50px/);
});

test("capability UI explains unverified and extension-backed states",()=>{
  assert.match(jsx,/ยังไม่ยืนยัน/);
  assert.match(jsx,/EXTENSION-BACKED/);
  assert.match(jsx,/capability-note/);
});
