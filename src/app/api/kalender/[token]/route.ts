import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

// iCal subscription feed: all open "neste steg" in the user's organisation.
// Token is a per-user secret (profiles.calendar_token). Uses the service client
// because calendar apps fetch without a session; the token is the authorisation.
export const dynamic = "force-dynamic";

function esc(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/[,;]/g, (m) => "\\" + m);
}
function fold(line: string) {
  // RFC 5545: lines max 75 octets, continuation lines start with a space.
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 73) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}
const pad = (n: number) => String(n).padStart(2, "0");
function stampUtc(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!token || !/^[a-f0-9]{20,64}$/.test(token)) return new NextResponse("Not found", { status: 404 });

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("id, org_id, full_name, status")
    .eq("calendar_token", token)
    .maybeSingle();
  if (!me || !me.org_id || me.status !== "active") return new NextResponse("Not found", { status: 404 });

  const { data: org } = await admin.from("organizations").select("name").eq("id", me.org_id).single();

  const { data: deals } = await admin
    .from("deals")
    .select("id, company, contact, phone, owner_id, owner_name, next_step_text, next_step_date, next_step_time, next_step_who, stage, updated_at")
    .eq("org_id", me.org_id)
    .not("next_step_date", "is", null)
    .not("stage", "in", '("vunnet","tapt")');

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Altiv//Oppfølging//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${esc(`Altiv · ${org?.name ?? "Oppfølging"}`)}`),
    "X-WR-TIMEZONE:Europe/Oslo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  const now = stampUtc(new Date());
  for (const d of deals ?? []) {
    if (!d.next_step_date) continue;
    const date = d.next_step_date.replace(/-/g, "");
    const mine = d.owner_id === me.id;
    const who = d.next_step_who || d.owner_name || "";
    const summary = `${d.next_step_text || "Oppfølging"} — ${d.company || d.contact || "Kunde"}${mine ? "" : who ? ` (${who})` : ""}`;
    const desc = [
      d.contact ? `Kontakt: ${d.contact}` : "",
      d.phone ? `Tlf: ${d.phone}` : "",
      d.owner_name ? `Selger: ${d.owner_name}` : "",
      `Åpne i Altiv: ${SITE_URL}/app/pipeline?deal=${d.id}`,
    ].filter(Boolean).join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:deal-${d.id}@altiv.no`);
    lines.push(`DTSTAMP:${now}`);
    if (d.next_step_time && /^\d{2}:\d{2}/.test(d.next_step_time)) {
      // Timed event, 30 min, floating local time (Europe/Oslo via X-WR-TIMEZONE).
      const [hh, mm] = d.next_step_time.split(":").map(Number);
      const start = new Date(Date.UTC(2000, 0, 1, hh, mm));
      const end = new Date(start.getTime() + 30 * 60000);
      const t = (x: Date) => `${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}00`;
      lines.push(`DTSTART;TZID=Europe/Oslo:${date}T${t(start)}`);
      lines.push(`DTEND;TZID=Europe/Oslo:${date}T${t(end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${date}`);
    }
    lines.push(fold(`SUMMARY:${esc(summary)}`));
    lines.push(fold(`DESCRIPTION:${esc(desc)}`));
    lines.push(fold(`URL:${SITE_URL}/app/pipeline?deal=${d.id}`));
    lines.push(`LAST-MODIFIED:${stampUtc(new Date(d.updated_at))}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="altiv.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
