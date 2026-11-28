import { test } from "node:test";
import assert from "node:assert/strict";
import { pickRandomHomeReviews } from "./reviewSelection.js";

const reviews = Array.from({ length: 104 }, (_, index) => ({ id: `yorum-${index + 1}` }));

test("ana sayfadaki beş yorum listenin tamamı arasından seçilir", () => {
  let call = 0;
  const selected = pickRandomHomeReviews(reviews, 5, () => {
    call += 1;
    return call === 1 ? 0 : 0.999999;
  });

  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((review) => review.id)).size, 5);
  assert.ok(selected.some((review) => review.id === "yorum-104"));
  assert.ok(selected.every((selectedReview) => reviews.some((review) => review.id === selectedReview.id)));
});

test("sayfa açılışındaki farklı rastgelelik farklı yorum grupları üretir", () => {
  const first = pickRandomHomeReviews(reviews, 5, () => 0);
  const second = pickRandomHomeReviews(reviews, 5, () => 0.999999);

  assert.notDeepEqual(first.map((review) => review.id), second.map((review) => review.id));
});

test("beşten az yorum varsa yalnız mevcut yorumlar gösterilir", () => {
  const selected = pickRandomHomeReviews(reviews.slice(0, 3));
  assert.deepEqual(new Set(selected.map((review) => review.id)), new Set(["yorum-1", "yorum-2", "yorum-3"]));
  assert.deepEqual(pickRandomHomeReviews([], 5), []);
});
