import Link from "next/link";
import { requireCoupleContext } from "@/lib/session";
import { daysSince, daysToNextAnniversary } from "@/lib/dates";
import { MOODS, ROOMS } from "@/lib/rooms";
import { SignOutButton } from "@/app/SignOutButton";
import { WaitingCard } from "@/app/WaitingCard";
import { NotificationBell } from "./NotificationBell";
import { LoveNoteCard } from "./LoveNoteCard";
import { PushSubscribeButton } from "./PushSubscribeButton";
import { getCompanionInsight } from "@/lib/companion";
import { getOnThisDayMemories } from "@/lib/memories";
import { setMood } from "./actions";
import type { SupabaseClient } from "@supabase/supabase-js";

type LoveNote = {
  id: string;
  body: string | null;
  created_at: string;
  opened_at: string | null;
  audio_path: string | null;
  duration_seconds: number | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

async function toNoteView(supabase: SupabaseClient, note: LoveNote | null) {
  if (!note) return null;
  const audioUrl = note.audio_path
    ? (await supabase.storage.from("voice-notes").createSignedUrl(note.audio_path, 3600)).data?.signedUrl ?? null
    : null;
  return {
    id: note.id,
    text: note.body,
    when: formatWhen(note.created_at),
    createdAt: note.created_at,
    openedAt: note.opened_at,
    audioUrl,
    durationSeconds: note.duration_seconds,
    hasAudio: Boolean(note.audio_path),
  };
}

export default async function HomePage() {
  const { supabase, userId, displayName, mood, coupleId, partner, unreadCount, unseenActivity } =
    await requireCoupleContext();

  const [
    { data: couple },
    { data: pendingInvite },
    { data: latestTextNote },
    { data: latestVoiceNote },
    { data: myLatestNote },
    insight,
    memories,
  ] = await Promise.all([
    supabase
      .from("couples")
      .select("met_date, anniversary")
      .eq("id", coupleId)
      .single()
      .overrideTypes<{ met_date: string | null; anniversary: string | null }>(),
    supabase
      .from("invitations")
      .select("token")
      .eq("couple_id", coupleId)
      .eq("status", "sent")
      .maybeSingle()
      .overrideTypes<{ token: string } | null>(),
    // Latest text and latest voice note from the partner are tracked as two
    // independent slots — otherwise a text note sent after a voice note
    // (or vice versa) silently buries the older one with no way to reach it.
    partner
      ? supabase
          .from("love_notes")
          .select("id, body, created_at, opened_at, audio_path, duration_seconds")
          .eq("couple_id", coupleId)
          .eq("from_id", partner.id)
          .not("body", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .overrideTypes<LoveNote | null>()
      : Promise.resolve({ data: null as LoveNote | null }),
    partner
      ? supabase
          .from("love_notes")
          .select("id, body, created_at, opened_at, audio_path, duration_seconds")
          .eq("couple_id", coupleId)
          .eq("from_id", partner.id)
          .not("audio_path", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .overrideTypes<LoveNote | null>()
      : Promise.resolve({ data: null as LoveNote | null }),
    supabase
      .from("love_notes")
      .select("id, body, created_at, opened_at, audio_path, duration_seconds")
      .eq("couple_id", coupleId)
      .eq("from_id", userId)
      .not("audio_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .overrideTypes<LoveNote | null>(),
    getCompanionInsight(supabase, coupleId),
    getOnThisDayMemories(supabase, coupleId),
  ]);

  const [textView, voiceView, myVoiceUrl] = await Promise.all([
    toNoteView(supabase, latestTextNote),
    toNoteView(supabase, latestVoiceNote),
    myLatestNote?.audio_path
      ? supabase.storage
          .from("voice-notes")
          .createSignedUrl(myLatestNote.audio_path, 3600)
          .then((r) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ]);

  const latestNotes = [textView, voiceView]
    .filter((n): n is NonNullable<typeof n> => n !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <header className="ss-topbar">
        <div className="ss-wordmark">SoulSync</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell coupleId={coupleId} userId={userId} initialUnread={unreadCount} />
          <SignOutButton />
        </div>
      </header>

      {unseenActivity.length > 0 && (
        <a href="/alerts" className="ss-card ss-newbanner">
          <b>♡ {unseenActivity[0].payload.text}</b>
          <small>
            {unseenActivity.length > 1 ? `and ${unseenActivity.length - 1} more — tap to see` : "Tap to see"}
          </small>
        </a>
      )}

      <section className="ss-hero">
        <h1 className="ss-greet">
          Welcome home, <em>{displayName}</em>.
        </h1>
        <p className="ss-sub">
          {partner
            ? `${partner.display_name} is part of your home.`
            : "Your invitation is out — this page will fill in the moment it's accepted."}
        </p>
        {couple?.met_date && (
          <div className="ss-days">
            <div>
              <div className="ss-stat-num">{daysSince(couple.met_date).toLocaleString()}</div>
              <div className="ss-stat-label">Days together</div>
            </div>
            {couple.anniversary && (
              <div>
                <div className="ss-stat-num">{daysToNextAnniversary(couple.anniversary)}</div>
                <div className="ss-stat-label">To anniversary</div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="ss-grid" style={{ marginBottom: 16 }}>
        {!partner && pendingInvite?.token && <WaitingCard token={pendingInvite.token} />}

        <PushSubscribeButton />

        <section className="ss-card ss-insight col-12">
          <div className="ss-kicker">From your companion</div>
          <p className="ss-insight-quote">{insight}</p>
        </section>

        {memories.length > 0 && (
          <section className="ss-card ss-rosecard col-12">
            <div className="ss-kicker">On this day</div>
            {memories.map((m) => (
              <Link
                key={`${m.type}-${m.id}`}
                href={m.href}
                className="ss-entry-text"
                style={{ display: "block", marginTop: 10, textDecoration: "none", color: "inherit" }}
              >
                <b>{m.yearsAgo === 1 ? "1 year ago today" : `${m.yearsAgo} years ago today`}</b> —{" "}
                &ldquo;{m.text}&rdquo;
              </Link>
            ))}
          </section>
        )}

        <section className="ss-card col-12">
          <div className="ss-kicker">How are you feeling, {displayName}?</div>
          <div className="ss-moods" role="group" aria-label="Set your mood">
            {MOODS.map((m) => (
              <form action={setMood} key={m.key} style={{ display: "contents" }}>
                <input type="hidden" name="mood" value={m.key} />
                <button
                  type="submit"
                  className={`ss-mood ${mood === m.key ? "sel" : ""}`}
                  aria-pressed={mood === m.key}
                >
                  <span className="ss-dot" style={{ background: m.dot }} />
                  {m.label}
                </button>
              </form>
            ))}
          </div>
        </section>

        {partner && (
          <LoveNoteCard
            partnerName={partner.display_name}
            latestNotes={latestNotes}
            mine={
              myLatestNote?.audio_path
                ? {
                    audioUrl: myVoiceUrl,
                    durationSeconds: myLatestNote.duration_seconds,
                    when: formatWhen(myLatestNote.created_at),
                  }
                : null
            }
          />
        )}
      </div>

      <div className="ss-kicker">Your home</div>
      <div className="ss-navlist">
        {ROOMS.map((room) => (
          <Link key={room.name} className="ss-navcard" href={room.href}>
            <span className="ss-navicon">{room.icon}</span>
            <span>
              <b>{room.name}</b>
              <small>{room.desc}</small>
            </span>
            <span className="ss-chev">›</span>
          </Link>
        ))}
      </div>
    </>
  );
}
