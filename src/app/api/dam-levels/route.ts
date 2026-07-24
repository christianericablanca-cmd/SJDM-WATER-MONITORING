import { NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

interface DamLevel {
  name: string;
  level: number;
  normalHigh: number;
  date: string;
  deviation: number;
}

const FALLBACK: DamLevel[] = [
  { name: "Angat", level: 200.13, normalHigh: 212, date: "Jul 22, 2026", deviation: -11.87 },
  { name: "Ipo", level: 100.35, normalHigh: 101, date: "Jul 22, 2026", deviation: -0.65 },
  { name: "La Mesa", level: 79.62, normalHigh: 80.15, date: "Jul 22, 2026", deviation: -0.53 },
];

interface CacheEntry {
  data: DamData;
  expiry: number;
}

type DamData = { dams: DamLevel[]; updated: string; source: "live" | "fallback" };

const CACHE_TTL = 30 * 60 * 1000;
let cache: CacheEntry | null = null;
let pending: Promise<DamData | null> | null = null;

async function fetchFromPAGASA(): Promise<DamData> {
  const res = await fetch("https://bagong.pagasa.dost.gov.ph/index.php/flood", {
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  const dams: DamLevel[] = [];
  const dateMatch = html.match(/<h5[^>]*class="pull-right"[^>]*>([^<]+)<\/h5>/i);
  const updateDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

  const targets = [
    { id: "Angat", name: "Angat" },
    { id: "Ipo", name: "Ipo" },
    { id: "La Mesa", name: "La Mesa" },
  ];

  for (const t of targets) {
    const escId = t.id.replace(/\s+/g, "\\s+");
    const rows = html.match(new RegExp(
      `<tr[^>]*>[\\s\\S]*?data-id="${escId}"[^>]*class="[^"]*current-data[^"]*"\\s+rowspan="2">([\\d.]+)<\\/td>[\\s\\S]*?<\\/tr>`,
      "i"
    ));
    const nhwlMatch = html.match(new RegExp(
      `data-id="${escId}"[^>]*class="[^"]*current-data[^"]*"\\s+rowspan="4">([\\d.]+)<\\/td>`,
      "i"
    ));

    if (rows && nhwlMatch) {
      const level = parseFloat(rows[1]);
      const nhwl = parseFloat(nhwlMatch[1]);
      dams.push({
        name: t.name,
        level,
        normalHigh: nhwl,
        date: updateDate,
        deviation: parseFloat((level - nhwl).toFixed(2)),
      });
    }
  }

  if (dams.length === 0) throw new Error("No dams parsed");

  return { dams, updated: new Date().toISOString(), source: "live" as const };
}

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request);
  const { allowed } = await checkRateLimit(identifier, "dam_levels", 60, 1);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  if (cache && Date.now() < cache.expiry) {
    return NextResponse.json(cache.data);
  }

  if (!pending) {
    pending = fetchFromPAGASA().then((data) => {
      cache = { data, expiry: Date.now() + CACHE_TTL };
      pending = null;
      return data;
    }).catch(() => {
      pending = null;
      return null;
    });
  }

  const live = await pending;
  if (live) return NextResponse.json(live);
  if (cache) return NextResponse.json(cache.data);

  return NextResponse.json({ dams: FALLBACK, updated: new Date().toISOString(), source: "fallback" });
}
