import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeHomeBlogPosts, pickRandomHomeBlogPosts } from "./blogSelection.js";

const posts = [
  { slug: "bir", title: "Birinci yazı", category: "Psikoloji", image: "bir.jpg" },
  { slug: "iki", title: "İkinci yazı", category: "İlişkiler", image: "iki.jpg" },
  { slug: "uc", title: "Üçüncü yazı", category: "İyi oluş", image: null },
  { slug: "dort", title: "Dördüncü yazı", category: "Beslenme", image: "dort.jpg" },
];

test("ana sayfa seçimi iki blog kaynağındaki bütün benzersiz yazıları kapsar", () => {
  const merged = mergeHomeBlogPosts(
    [{ slug: "bir", title: "Birinci yazı", featured_image: null, tags: ["Psikoloji"] }],
    [
      { slug: "bir", title: "Birinci yazı", featured_image: "bir.jpg", keywords: "Psikoloji" },
      { slug: "iki", title: "İkinci yazı", featured_image: "iki.jpg", keywords: "İlişkiler,Bağlanma" },
    ],
  );

  assert.equal(merged.length, 2);
  assert.deepEqual(merged.find((post) => post.slug === "bir"), posts[0]);
  assert.equal(merged.find((post) => post.slug === "iki")?.category, "İlişkiler");
});

test("her seçim üç farklı yazı döndürür ve kaynak dışına çıkmaz", () => {
  const selected = pickRandomHomeBlogPosts(posts, 3, () => 0.42);

  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.map((post) => post.slug)).size, 3);
  assert.ok(selected.every((selectedPost) => posts.some((post) => post.slug === selectedPost.slug)));
});

test("farklı rastgelelik sonuçları farklı kart sıraları üretebilir", () => {
  const first = pickRandomHomeBlogPosts(posts, 3, () => 0);
  const second = pickRandomHomeBlogPosts(posts, 3, () => 0.999999);

  assert.notDeepEqual(first.map((post) => post.slug), second.map((post) => post.slug));
});

test("üçten az yazı varsa yalnız mevcut yazılar gösterilir", () => {
  assert.deepEqual(pickRandomHomeBlogPosts(posts.slice(0, 2), 3), posts.slice(0, 2));
  assert.deepEqual(pickRandomHomeBlogPosts([], 3), []);
});
