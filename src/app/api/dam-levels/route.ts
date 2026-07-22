import { NextResponse } from "next/server";

interface DamLevel {
  name: string;
  level: number;
  normalHigh: number;
  date: string;
  deviation: number;
}

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch("https://www.pimohweather.com/pimohHydroforecast.php", {
      headers: { "User-Agent": "WaterWatchSJDM/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    // Parse the dam table — look for Angat row
    const dams: DamLevel[] = [];
    const rowRegex = /<tr[^>]*>\s*<td[^>]*>\s*([A-Za-z\s]+?)<\/td>\s*<td[^>]*>\s*([\d:.APM\s]+?)<\/td>\s*<td[^>]*>\s*([\d.]+?)<\/td>\s*<td[^>]*>\s*([\d.]+?)<\/td>\s*<td[^>]*>\s*([\d.-]+?)<\/td>/gi;

    // Simpler approach: extract the table body and parse key rows
    const tableMatch = html.match(/<table[^>]*class="[^"]*hydro[^"]*"[^>]*>[\s\S]*?<\/table>/i) ||
                       html.match(/Dam Levels[\s\S]*?<table[\s\S]*?<\/table>/i);

    // Fall back to regex on full HTML for known dam names
    const damNames = ["Angat", "Ipo", "La Mesa", "Ambuklao", "Binga", "San Roque", "Pantabangan", "Magat Dam", "Caliraya"];

    for (const name of damNames) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `${escaped}[\\s\\S]*?<td[^>]*?>([\\d:.APM\\s]+?)<\\/td>\\s*<td[^>]*?>([\\d.]+?)<\\/td>`,
        'i'
      );
      const match = html.match(pattern);
      if (match) {
        const cleanName = name === "Magat Dam" ? "Magat" : name;

        // Find normal high water level for this dam
        const nhwlPattern = new RegExp(
          `${escaped}[\\s\\S]*?<td[^>]*?>([\\d:.APM\\s]+?)<\\/td>\\s*<td[^>]*?>([\\d.]+?)<\\/td>\\s*<td[^>]*?>([\\d.-]+?)<\\/td>\\s*<td[^>]*?>([\\d.]+?)<\\/td>`,
          'i'
        );
        const nhwlMatch = html.match(nhwlPattern);

        dams.push({
          name: cleanName,
          level: parseFloat(match[2]),
          normalHigh: nhwlMatch ? parseFloat(nhwlMatch[4]) : 0,
          date: (match[1] || "").trim(),
          deviation: nhwlMatch ? parseFloat(nhwlMatch[3]) : 0,
        });
      }
    }

    // If no dams found via regex, try simpler td-based extraction
    if (dams.length === 0) {
      const tdPattern = /<td[^>]*>\s*(Angat|Ipo|La Mesa|Ambuklao|Binga|San Roque|Pantabangan|Magat|Caliraya)\s*<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.-]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*<\/td>/gi;
      let m;
      while ((m = tdPattern.exec(html)) !== null) {
        dams.push({
          name: m[1],
          level: parseFloat(m[2]),
          normalHigh: parseFloat(m[4]),
          date: new Date().toISOString(),
          deviation: parseFloat(m[3]),
        });
      }
    }

    return NextResponse.json({ dams, updated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ dams: [], error: "Could not fetch dam data" }, { status: 502 });
  }
}
