"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INVITE_QUESTIONS, buildLetter } from "@/lib/invite";
import { errorMessage } from "@/lib/errors";
import { SignOutButton } from "@/app/SignOutButton";

type Stage = "welcome" | "questions" | "preview" | "share";

export function InviteJourney({ inviterName }: { inviterName: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("welcome");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [sealed, setSealed] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canCreate = answers.every((a) => a.trim());
  const letter = buildLetter(answers, inviterName);

  const back = () => {
    if (stage === "questions") setStage("welcome");
    else if (stage === "preview") {
      setSealed(true);
      setStage("questions");
    }
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("create_invitation", {
        p_answers: answers,
      });
      if (rpcError) throw rpcError;
      setToken(data);
      setStage("share");
    } catch (e) {
      setError(errorMessage(e, "Couldn't create the invitation."));
    } finally {
      setBusy(false);
    }
  };

  const link = token ? `${window.location.origin}/invite/${token}` : "";
  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `I have something for you 💌 ${link}`
  )}`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0" }}>
        {(stage === "questions" || stage === "preview") ? (
          <button className="ss-back" onClick={back} aria-label="Go back">← Back</button>
        ) : (
          <span />
        )}
        <SignOutButton />
      </div>

      {stage === "welcome" && (
        <div className="ss-center">
          <div className="ss-wordmark" style={{ marginBottom: 26 }}>SoulSync</div>
          <h1 className="ss-greet" style={{ textAlign: "center" }}>
            Before the app,<br /><em>there is an invitation.</em>
          </h1>
          <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 30px" }}>
            SoulSync begins the way every good story does — with one person choosing another.
            Answer three questions, and we&apos;ll turn them into a letter for your partner.
          </p>
          <button className="ss-btn solid" onClick={() => setStage("questions")}>Begin</button>
        </div>
      )}

      {stage === "questions" && (
        <>
          <section className="ss-hero slim">
            <h1 className="ss-greet sm">Three questions, <em>from the heart</em></h1>
            <p className="ss-sub">Your answers become the letter they open — and the first pages of your timeline.</p>
          </section>
          <div className="ss-grid">
            {INVITE_QUESTIONS.map((q, i) => (
              <section className="ss-card col-12" key={q}>
                <div className="ss-kicker">Question {i + 1} of 3</div>
                <h3>{q}</h3>
                <textarea
                  className="ss-input"
                  rows={2}
                  value={answers[i]}
                  onChange={(e) =>
                    setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))
                  }
                  placeholder="A sentence is enough."
                />
              </section>
            ))}
            <div className="col-12">
              <button
                className="ss-btn solid"
                disabled={!canCreate}
                style={{ opacity: canCreate ? 1 : 0.45 }}
                onClick={() => setStage("preview")}
              >
                Create their invitation
              </button>
            </div>
          </div>
        </>
      )}

      {stage === "preview" && (
        <div className="ss-letter-wrap">
          {sealed ? (
            <div style={{ textAlign: "center" }}>
              <p className="ss-sub" style={{ marginBottom: 24 }}>This is what arrives on their phone.</p>
              <button
                className="ss-envelope"
                onClick={() => setSealed(false)}
                aria-label="Break the seal and open the invitation"
              >
                <div className="ss-env-flap" />
                <div className="ss-seal">{inviterName.charAt(0).toUpperCase()}</div>
                <div className="ss-env-name">A letter, sealed</div>
              </button>
              <p
                className="ss-sub"
                style={{ marginTop: 22, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}
              >
                Tap the seal to open
              </p>
            </div>
          ) : (
            <div className="ss-letter">
              <div className="ss-letter-head">{inviterName} has invited you to build something beautiful.</div>
              <div className="ss-letter-body">
                {letter.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <p className="ss-letter-sign">— {inviterName}</p>
              </div>
              {error && <p className="ss-error">{error}</p>}
              <button className="ss-btn solid" disabled={busy} onClick={send}>
                {busy ? "Sending…" : "Send this invitation ✦"}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "share" && (
        <div className="ss-center">
          <div className="ss-stars">
            <span className="star a" /><span className="star b" /><span className="thread-line" />
          </div>
          <h1 className="ss-greet" style={{ textAlign: "center" }}>
            Today marks the beginning<br /><em>of your shared journey.</em>
          </h1>
          <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 28px" }}>
            Send this link — the letter opens the moment they tap it. No account needed to read it.
          </p>
          <section className="ss-card col-12" style={{ width: "min(480px, 100%)" }}>
            <div className="ss-kicker">Your invitation link</div>
            <div className="ss-inline">
              <input className="ss-input" readOnly value={link} onFocus={(e) => e.target.select()} />
              <button className="ss-btn tiny" onClick={copyLink}>{copied ? "Copied ✓" : "Copy"}</button>
            </div>
            <a
              className="ss-btn solid"
              style={{ display: "block", textAlign: "center", marginTop: 12, textDecoration: "none" }}
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send via WhatsApp
            </a>
          </section>
          <button className="ss-btn" style={{ marginTop: 20 }} onClick={() => router.push("/")}>
            Go to your home
          </button>
        </div>
      )}
    </>
  );
}
