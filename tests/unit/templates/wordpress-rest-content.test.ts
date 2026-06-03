import { describe, expect, it } from 'vitest';
import { wordpressRestContent } from '../../../src/bait/templates/wordpress-rest-content.js';

const ctx = (path: string) => ({
  request: new Request(`http://example.test${path}`),
  path,
  category: 'cms-auth' as const,
  subcategory: 'wordpress-rest-content',
});

describe('wordpress-rest-content', () => {
  it('serves a posts collection authored by the fabricated roster (author id 1)', async () => {
    const response = wordpressRestContent(ctx('/wp-json/wp/v2/posts'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const posts = JSON.parse(await response.text()) as Array<{ author: number; title: unknown }>;
    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].author).toBe(1);
    expect(posts[0]).toHaveProperty('title');
  });

  it('serves type-appropriate shapes for comments and media', async () => {
    const comments = JSON.parse(
      await wordpressRestContent(ctx('/wp-json/wp/v2/comments')).text(),
    ) as Array<Record<string, unknown>>;
    expect(comments[0]).toHaveProperty('post');
    const media = JSON.parse(
      await wordpressRestContent(ctx('/wp-json/wp/v2/media')).text(),
    ) as Array<Record<string, unknown>>;
    expect(media[0]).toHaveProperty('source_url');
  });

  it('returns a valid empty collection for unknown segments (never reflects the path)', async () => {
    const response = wordpressRestContent(ctx('/wp-json/wp/v2/<script>'));
    const text = await response.text();
    expect(text).toBe('[]');
    expect(text).not.toContain('<script>');
  });
});
