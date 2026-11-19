import { expect, test } from "bun:test";
import { isBlockedVisitor } from "../../src/utils/blockedNumbers";

test("Levent Deniz cannot submit an appointment under that name", () => {
  expect(isBlockedVisitor({ name: " LEVENT  DENİZ " })).toBe(true);
  expect(isBlockedVisitor({ name: "Sentetik Ziyaretçi" })).toBe(false);
});

test("the blocked appointment email cannot submit with another name", () => {
  expect(isBlockedVisitor({ name: "Sentetik Ziyaretçi", email: "LVNTDENIZ06@gmail.com" })).toBe(true);
});
test("the blocked phone cannot book under a different name or email", () => {
  expect(isBlockedVisitor({name:"Sentetik Ziyaretçi",email:"synthetic@example.invalid",phone:"+90 541 885 75 25"})).toBe(true);
  expect(isBlockedVisitor({name:"Sentetik Ziyaretçi",phone:"05550000000"})).toBe(false);
});