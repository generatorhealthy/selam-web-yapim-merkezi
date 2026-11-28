export type HomeBlogPost = {
  slug: string;
  title: string;
  category: string;
  image: string | null;
};

export type LegacyBlogSource = {
  slug: string;
  title: string;
  featured_image: string | null;
  tags: string[] | null;
};

export type EditorialBlogSource = {
  slug: string;
  title: string;
  featured_image: string | null;
  keywords: string | null;
};

const clean = (value: string | null | undefined) => value?.trim() || "";

export function mergeHomeBlogPosts(
  legacyPosts: LegacyBlogSource[],
  editorialPosts: EditorialBlogSource[],
): HomeBlogPost[] {
  const bySlug = new Map<string, HomeBlogPost>();

  for (const post of [...editorialPosts, ...legacyPosts]) {
    const slug = clean(post.slug);
    const title = clean(post.title);
    if (!slug || !title) continue;

    const tags = "tags" in post ? post.tags : clean(post.keywords).split(",");
    const category = clean(tags?.[0]) || "İyi oluş";
    const existing = bySlug.get(slug);

    bySlug.set(slug, {
      slug,
      title: existing?.title || title,
      category: existing?.category || category,
      image: existing?.image || clean(post.featured_image) || null,
    });
  }

  return [...bySlug.values()];
}

export function pickRandomHomeBlogPosts(
  posts: HomeBlogPost[],
  count = 3,
  random: () => number = Math.random,
): HomeBlogPost[] {
  const shuffled = [...posts];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.max(0, count));
}
