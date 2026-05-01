INSERT INTO social_shares (blog_post_id, platform, status, shared_at, updated_at)
SELECT id, 'linkedin', 'success', now(), now()
FROM blog_posts
WHERE id IN (
  'f20ae9d5-80a1-49d5-8831-9079b40c851d'
)
ON CONFLICT (blog_post_id, platform) DO UPDATE
SET status = 'success', shared_at = now(), updated_at = now();