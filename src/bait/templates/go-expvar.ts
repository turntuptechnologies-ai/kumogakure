import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for `/debug/vars` — the endpoint Go's standard-library
// `expvar` package registers on `http.DefaultServeMux` at init. Any service
// that imports `expvar` (often transitively, or alongside `net/http/pprof`)
// and serves its default mux to the internet exposes it unauthenticated,
// leaking the process argv and full runtime memory statistics
// (CWE-200 / CWE-489). It is also a reliable "Go service on its default mux"
// fingerprint, which is why scanners probe it. Same family as the
// symfony-profiler / django-debug-toolbar / laravel-telescope decoys.
//
// `cmdline` carries only benign flags: publishing a fake credential in argv
// would be an actionable-looking secret for no added engagement value
// (RESPONSE_TEMPLATE_POLICY §A.1). The interest is in the probe, not in
// baiting a specific credential.
//
// `memstats` is generated so that it is internally consistent — a scanner
// that parses it finds Sys equal to the sum of the subsystem arenas,
// HeapInuse + HeapIdle == HeapSys, HeapObjects == Mallocs - Frees, TotalAlloc
// equal to the bytes implied by BySize, and PauseTotalNs consistent with the
// PauseNs ring — rather than round numbers that would read as synthetic.

const CMDLINE = [
  '/usr/local/bin/exampled',
  '-config',
  '/etc/exampled/config.yaml',
  '-listen',
  ':8080',
  '-metrics-listen',
  '127.0.0.1:9090',
];

// The Go size-class table; `expvar` reports one bucket per class, plus the
// leading zero-size entry.
const SIZE_CLASSES = [
  0, 8, 16, 24, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 352,
  384, 416, 448, 480, 512, 576, 640, 704, 768, 896, 1024, 1152, 1280, 1408, 1536, 1792, 2048, 2304,
  2688, 3072, 3200, 3456, 4096, 4864, 5376, 6144, 6528, 6784, 6912, 8192, 9472, 9728, 10240, 10880,
  12288, 13568, 14336, 16384, 18432, 19072,
];

// Small allocations dominate, so counts fall off with the size class. Fully
// deterministic — the same numbers on every start, no randomness.
const BY_SIZE = SIZE_CLASSES.map((size, i) => {
  if (size === 0) return { Size: 0, Mallocs: 0, Frees: 0 };
  const mallocs = Math.floor(9_400_000 / (i + 1)) + ((i * 7919) % 4096);
  return { Size: size, Mallocs: mallocs, Frees: mallocs - ((i * 1327) % 512) - 31 };
});

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

// Allocations too large for a size class are not reported per-bucket but do
// count toward the Mallocs / Frees / TotalAlloc totals.
const LARGE_MALLOCS = 214_887;
const LARGE_FREES = 208_119;
const LARGE_BYTES = 1_284_551_168;

const MALLOCS = sum(BY_SIZE.map((b) => b.Mallocs)) + LARGE_MALLOCS;
const FREES = sum(BY_SIZE.map((b) => b.Frees)) + LARGE_FREES;
const TOTAL_ALLOC = sum(BY_SIZE.map((b) => b.Size * b.Mallocs)) + LARGE_BYTES;

const NUM_GC = 1247;
const GC_INTERVAL_NS = 4_213_000_000n;

// PauseNs / PauseEnd are 256-entry ring buffers indexed by `NumGC % 256`, so
// slot i holds the most recent GC whose number is congruent to i. Deriving
// each slot's age from that keeps the two arrays consistent with NumGC.
const PAUSE_NS = Array.from({ length: 256 }, (_, i) => 60_000 + ((i * 2_654_435_761) % 143_000));
const PAUSE_SLOT_AGE_NS = Array.from({ length: 256 }, (_, i) => {
  const gcNumber = i + 256 * Math.floor((NUM_GC - i) / 256);
  return BigInt(NUM_GC - gcNumber) * GC_INTERVAL_NS;
});
const PAUSE_TOTAL_NS = Math.round((sum(PAUSE_NS) / PAUSE_NS.length) * NUM_GC);

// Arena sizes; Sys is their sum, and HeapInuse + HeapIdle is HeapSys.
const HEAP_INUSE = 15_433_728;
const HEAP_IDLE = 17_694_720;
const HEAP_SYS = HEAP_INUSE + HEAP_IDLE;
const STACK_SYS = 1_310_720;
const MSPAN_SYS = 293_760;
const MCACHE_SYS = 31_200;
const BUCK_HASH_SYS = 1_468_446;
const GC_SYS = 7_513_240;
const OTHER_SYS = 1_409_510;
const SYS = HEAP_SYS + STACK_SYS + MSPAN_SYS + MCACHE_SYS + BUCK_HASH_SYS + GC_SYS + OTHER_SYS;

const HEAP_ALLOC = 12_845_672;

// `LastGC` and `PauseEnd` are nanosecond wall-clock values large enough to
// lose precision as JS numbers, so they are stamped in as exact integer
// literals through these placeholders rather than serialised as numbers.
const LAST_GC_TOKEN = '"__LAST_GC__"';
const PAUSE_END_TOKEN = '"__PAUSE_END__"';

// Field order matches the declaration order of runtime.MemStats, which is
// what encoding/json emits.
const memstatsTemplate = JSON.stringify({
  Alloc: HEAP_ALLOC,
  TotalAlloc: TOTAL_ALLOC,
  Sys: SYS,
  Lookups: 0,
  Mallocs: MALLOCS,
  Frees: FREES,
  HeapAlloc: HEAP_ALLOC,
  HeapSys: HEAP_SYS,
  HeapIdle: HEAP_IDLE,
  HeapInuse: HEAP_INUSE,
  HeapReleased: 9_871_360,
  HeapObjects: MALLOCS - FREES,
  StackInuse: 1_310_720,
  StackSys: STACK_SYS,
  MSpanInuse: 233_280,
  MSpanSys: MSPAN_SYS,
  MCacheInuse: 19_200,
  MCacheSys: MCACHE_SYS,
  BuckHashSys: BUCK_HASH_SYS,
  GCSys: GC_SYS,
  OtherSys: OTHER_SYS,
  NextGC: 24_117_248,
  LastGC: '__LAST_GC__',
  PauseTotalNs: PAUSE_TOTAL_NS,
  PauseNs: PAUSE_NS,
  PauseEnd: '__PAUSE_END__',
  NumGC: NUM_GC,
  NumForcedGC: 0,
  GCCPUFraction: 0.00012849,
  EnableGC: true,
  DebugGC: false,
  BySize: BY_SIZE,
});

export const goExpvar: TemplateFn = () => {
  // The process is alive, so the last collection is recent; anchoring the ring
  // to request time keeps LastGC from drifting into an implausible past.
  const lastGc = BigInt(Date.now()) * 1_000_000n - 1_182_374_411n;
  const pauseEnd = PAUSE_SLOT_AGE_NS.map((age) => (lastGc - age).toString()).join(',');

  const memstats = memstatsTemplate
    .replace(LAST_GC_TOKEN, lastGc.toString())
    .replace(PAUSE_END_TOKEN, `[${pauseEnd}]`);

  // expvar's handler writes one `"key": value` line per published variable,
  // comma-separated, wrapped in bare braces — not indented JSON.
  const body = `{\n"cmdline": ${JSON.stringify(CMDLINE)},\n"memstats": ${memstats}\n}\n`;

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
