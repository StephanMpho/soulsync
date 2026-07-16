import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { VoicePlayer } from "../VoicePlayer";

type Note = {
  id: string;
  from_id: string;
  audio_path: string;
  duration_seconds: number | null;
  created_at: string;
};

export default async function VoiceNotesPage() {
  const { supabase, coupleId, userId, displayName, partner, unreadCount } = await requireCoupleContext();

  const { data: notes } = await supabase
    .from("love_notes")
    .select("id, from_id, audio_path, duration_seconds, created_at")
    .eq("couple_id", coupleId)
    .not("audio_path", "is", null)
    .order("created_at", { ascending: false })
    .overrideTypes<Note[]>();

  const list = notes ?? [];

  const paths = list.map((n) => n.audio_path);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("voice-notes").createSignedUrls(paths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] | null };
  const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  // Viewing this page counts as hearing whatever's here — keeps the Home
  // page's sealed-envelope state consistent with what's actually been heard,
  // rather than an older note staying "sealed" forever just because a newer
  // one already claimed the Home page's spotlight slot.
  if (partner) {
    await supabase
      .from("love_notes")
      .update({ opened_at: new Date().toISOString() })
      .eq("couple_id", coupleId)
      .eq("from_id", partner.id)
      .is("opened_at", null)
      .not("audio_path", "is", null);
  }

  const nameFor = (fromId: string) => (fromId === userId ? displayName : (partner?.display_name ?? "Partner"));

  return (
    <>
      <RoomHeader
        title="Voice notes"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Every <em>voice note</em>
        </h1>
        <p className="ss-sub">Every voice note the two of you have sent each other, in one place.</p>
      </section>

      {list.length === 0 ? (
        <div className="ss-card">
          <p className="ss-muted" style={{ margin: 0 }}>
            No voice notes yet — record one from the Home page.
          </p>
        </div>
      ) : (
        <div className="ss-navlist">
          {list.map((n) => (
            <div className="ss-card" key={n.id} style={{ padding: "14px 18px" }}>
              <div className="ss-tl-when">
                {nameFor(n.from_id)} ·{" "}
                {new Date(n.created_at).toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              {urlByPath.get(n.audio_path) ? (
                <VoicePlayer src={urlByPath.get(n.audio_path)!} duration={n.duration_seconds} />
              ) : (
                <p className="ss-muted" style={{ margin: "8px 0 0" }}>
                  Couldn&apos;t load this voice note.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
