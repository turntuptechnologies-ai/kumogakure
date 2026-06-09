import { Hono } from 'hono';
import { findExplicitBait } from './bait/catalog.js';
import { findHeaderBait } from './bait/headers.js';
import { findPatternBait } from './bait/patterns.js';
import { getTemplate } from './bait/templates/index.js';
import { fingerprintHeaders } from './fingerprint/headers.js';
import { runDailyGc } from './gc/cron.js';
import { uuidv7 } from './id.js';
import { readRequestBody, resolveBodyReadLimit } from './request-body.js';
import { detectAcross } from './signals/detector.js';
import { runDailyStats } from './stats/daily.js';
import { insertRequest } from './storage/d1.js';
import { buildR2Key, storePayload } from './storage/r2.js';
import type { BaitCategory, Env, RequestRecord } from './types.js';

const app = new Hono<{ Bindings: Env }>();

app.all('*', async (c) => {
  const request = c.req.raw;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Path-based matchers first; the header-signature matcher is a
    // fallback for probes routed by a header rather than the URL (e.g.
    // Next.js Server Actions), so it never overrides a known product path.
    const match = findExplicitBait(path) ?? findPatternBait(path) ?? findHeaderBait(request);
    const category: BaitCategory = match?.category ?? 'unknown';
    const subcategory = match?.subcategory;
    const templateName = match?.template ?? 'not-found';

    const method = request.method;
    const bodyLimit = resolveBodyReadLimit(c.env.BODY_READ_LIMIT);
    const {
      body,
      size: bodySize,
      truncated: bodyTruncated,
    } = await readRequestBody(request.clone(), bodyLimit);
    const signals = detectAcross(request, body);

    const template = getTemplate(templateName);
    const baseResponse = template({ request, path, category, subcategory, body });
    const response = new Response(baseResponse.body, baseResponse);

    for (const [k, v] of Object.entries(fingerprintHeaders(category))) {
      response.headers.set(k, v);
    }

    const id = uuidv7();
    const ts = Math.floor(Date.now() / 1000);

    let r2Key: string | undefined;
    if (bodySize > 0 || signals.length > 0) {
      r2Key = buildR2Key(id, ts);
      const headers: Record<string, string> = {};
      for (const [k, v] of request.headers.entries()) {
        headers[k] = v;
      }
      const r2Target = r2Key;
      c.executionCtx.waitUntil(
        storePayload(c.env, r2Target, { headers, body }).catch((err) => {
          console.error(
            JSON.stringify({
              msg: 'r2_store_failed',
              id,
              key: r2Target,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
        }),
      );
    }

    const cf = (request.cf ?? {}) as IncomingRequestCfProperties;

    const record: RequestRecord = {
      id,
      ts,
      ip: request.headers.get('cf-connecting-ip') ?? undefined,
      asn: typeof cf.asn === 'number' ? cf.asn : undefined,
      asn_org: typeof cf.asOrganization === 'string' ? cf.asOrganization : undefined,
      country: typeof cf.country === 'string' ? cf.country : undefined,
      method,
      path,
      query: url.search ? url.search.slice(1) : undefined,
      ua: request.headers.get('user-agent') ?? undefined,
      category,
      subcategory,
      status: response.status,
      body_size: bodySize > 0 ? bodySize : undefined,
      body_truncated: bodyTruncated ? true : undefined,
      r2_key: r2Key,
      signals: signals.length > 0 ? signals : undefined,
      tls_version: typeof cf.tlsVersion === 'string' ? cf.tlsVersion : undefined,
      tls_cipher: typeof cf.tlsCipher === 'string' ? cf.tlsCipher : undefined,
    };

    c.executionCtx.waitUntil(
      insertRequest(c.env, record).catch((err) => {
        console.error(
          JSON.stringify({
            msg: 'd1_insert_failed',
            id,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }),
    );

    console.log(
      JSON.stringify({
        msg: 'capture',
        id,
        method,
        path,
        category,
        subcategory,
        status: response.status,
        body_size: bodySize,
        body_truncated: bodyTruncated,
        signals,
      }),
    );

    return response;
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: 'handler_error',
        path,
        method: request.method,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
});

export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    // Independent waitUntils: a stats failure must not block retention
    // GC (and vice-versa). Their data ranges do not overlap — stats
    // aggregates yesterday, GC deletes rows older than RETENTION_DAYS.
    ctx.waitUntil(runDailyStats(env, event.scheduledTime));
    ctx.waitUntil(runDailyGc(env));
  },
} satisfies ExportedHandler<Env>;
