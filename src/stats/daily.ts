import type { Env } from '../types.js';

const TOP_N = 20;
const DAY_MS = 86_400_000;
const DAY_SECONDS = 86_400;

interface Totals {
  total: number;
  unique_ips: number;
  unique_asns: number;
}

interface RankedRow {
  key: string;
  n: number;
}

interface AsnRow {
  asn: number;
  asn_org: string | null;
  n: number;
}

interface SignalRow {
  signal: string;
  n: number;
}

/**
 * Cron-triggered daily aggregation. At the 00:00 UTC trigger this
 * aggregates the previous full UTC day of `requests` and upserts a
 * single `daily_stats` row. Idempotent (ON CONFLICT upsert) and
 * independent of the retention GC. Days with no traffic are skipped.
 */
export async function runDailyStats(env: Env, nowMs: number = Date.now()): Promise<void> {
  // Previous full UTC day: [dayStart, dayEnd) in epoch seconds.
  const todayMidnightMs = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const dayEnd = Math.floor(todayMidnightMs / 1000);
  const dayStart = dayEnd - DAY_SECONDS;
  const date = new Date(dayStart * 1000).toISOString().slice(0, 10);

  console.log(JSON.stringify({ msg: 'stats_start', date, day_start: dayStart, day_end: dayEnd }));

  try {
    const totals = await env.DB.prepare(
      `SELECT
         COUNT(*)            AS total,
         COUNT(DISTINCT ip)  AS unique_ips,
         COUNT(DISTINCT asn) AS unique_asns
       FROM requests
       WHERE ts >= ? AND ts < ?`,
    )
      .bind(dayStart, dayEnd)
      .first<Totals>();

    const total = totals?.total ?? 0;
    if (total === 0) {
      console.log(JSON.stringify({ msg: 'stats_skip_empty', date }));
      return;
    }

    const [topCategories, topPaths, topAsns, signalCounts] = await Promise.all([
      rankColumn(env, 'category', dayStart, dayEnd),
      rankColumn(env, 'path', dayStart, dayEnd),
      rankAsns(env, dayStart, dayEnd),
      countSignals(env, dayStart, dayEnd),
    ]);

    await env.DB.prepare(
      `INSERT INTO daily_stats
         (date, total, unique_ips, unique_asns,
          top_categories, top_paths, top_asns, signal_counts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         total          = excluded.total,
         unique_ips     = excluded.unique_ips,
         unique_asns    = excluded.unique_asns,
         top_categories = excluded.top_categories,
         top_paths      = excluded.top_paths,
         top_asns       = excluded.top_asns,
         signal_counts  = excluded.signal_counts`,
    )
      .bind(
        date,
        total,
        totals?.unique_ips ?? 0,
        totals?.unique_asns ?? 0,
        JSON.stringify(topCategories),
        JSON.stringify(topPaths),
        JSON.stringify(topAsns),
        JSON.stringify(signalCounts),
      )
      .run();

    console.log(JSON.stringify({ msg: 'stats_complete', date, total }));
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: 'stats_error',
        date,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    throw err;
  }
}

// `category` and `path` are fixed identifiers (never user input), but
// each gets its own literal query rather than an interpolated column
// name so no SQL string is built from a variable.
async function rankColumn(
  env: Env,
  column: 'category' | 'path',
  start: number,
  end: number,
): Promise<Array<{ value: string; count: number }>> {
  const sql =
    column === 'category'
      ? `SELECT category AS key, COUNT(*) AS n
           FROM requests
          WHERE ts >= ? AND ts < ? AND category IS NOT NULL
          GROUP BY category
          ORDER BY n DESC, key ASC
          LIMIT ?`
      : `SELECT path AS key, COUNT(*) AS n
           FROM requests
          WHERE ts >= ? AND ts < ? AND path IS NOT NULL
          GROUP BY path
          ORDER BY n DESC, key ASC
          LIMIT ?`;
  const { results } = await env.DB.prepare(sql).bind(start, end, TOP_N).all<RankedRow>();
  return results.map((r) => ({ value: r.key, count: r.n }));
}

async function rankAsns(
  env: Env,
  start: number,
  end: number,
): Promise<Array<{ asn: number; asn_org: string | null; count: number }>> {
  const { results } = await env.DB.prepare(
    `SELECT asn AS asn, MAX(asn_org) AS asn_org, COUNT(*) AS n
       FROM requests
      WHERE ts >= ? AND ts < ? AND asn IS NOT NULL
      GROUP BY asn
      ORDER BY n DESC, asn ASC
      LIMIT ?`,
  )
    .bind(start, end, TOP_N)
    .all<AsnRow>();
  return results.map((r) => ({ asn: r.asn, asn_org: r.asn_org, count: r.n }));
}

async function countSignals(env: Env, start: number, end: number): Promise<Record<string, number>> {
  // `signals` is stored as a JSON array of SignalName (see storage/d1.ts);
  // json_each expands it so each signal can be counted independently.
  const { results } = await env.DB.prepare(
    `SELECT je.value AS signal, COUNT(*) AS n
       FROM requests, json_each(requests.signals) AS je
      WHERE requests.ts >= ? AND requests.ts < ? AND requests.signals IS NOT NULL
      GROUP BY je.value
      ORDER BY n DESC, signal ASC`,
  )
    .bind(start, end)
    .all<SignalRow>();
  const counts: Record<string, number> = {};
  for (const row of results) {
    counts[row.signal] = row.n;
  }
  return counts;
}
