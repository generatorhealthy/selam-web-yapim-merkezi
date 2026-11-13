import { test } from "node:test";
import assert from "node:assert/strict";
import { safeCsv, safeCsvCell } from "./safeCsv";

for (const value of ["=1+1", "+SUM(A1)", "-1+2", "@SUM(A1)", "\t=1", "\r=1", "  =1", "\u0000=1"]) test(`formula cell ${JSON.stringify(value)} is text`, () => {
  assert.equal(safeCsvCell(value), `"'${value}"`);
});
test("quotes, delimiters and newlines stay inside the cell", () => {
  assert.equal(safeCsv([["a,b", 'a"b', "a\nb", 5000]]), '"a,b","a""b","a\nb","5000"');
});
test("ordinary Turkish text remains unchanged and semicolon exports are supported", () => {
  assert.equal(safeCsv([["İzin", "Hayır"]], ";"), '"İzin";"Hayır"');
});