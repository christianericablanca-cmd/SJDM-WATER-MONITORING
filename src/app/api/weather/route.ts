import { NextResponse } from "next/server";

const API_KEY = process.env.WEATHER_API_KEY;

export async function GET() {
  if (!API_KEY) return NextResponse.json({ error: "not_configured" }, { status: 500 });
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=14.8136,121.0453&days=1&aqi=no&alerts=no`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return NextResponse.json({ error: "upstream_error" }, { status: 502 });
    const data = await res.json();
    const prob = data?.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain;
    const temp = data?.current?.temp_c;
    const cond = data?.current?.condition?.text;
    return NextResponse.json({
      probability: typeof prob === "number" ? prob : null,
      temp: typeof temp === "number" ? temp : null,
      condition: typeof cond === "string" ? cond : null,
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
