"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildLetter } from "@/lib/invite";
import { errorMessage } from "@/lib/errors";

export function AcceptInvite({
  token,
  answers,
  inviterName,
  status,
  signedIn,
}: {
  token: string;
  answers: string[];
  inviterName: string;
  status: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [sealed, setSealed] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const letter = buildLetter(answers, inviterName);
  const alreadyAccepted = status === "accepted";

  const acceptAsSignedInUser = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("accept_invitation", { p_token: token });
      if (rpcError) throw rpcError;
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, "Couldn't accept the invitation."));
    } finally {
      setBusy(false);
    }
  };

  const signUpAndAccept = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/invite/${token}`,
        },
      });
      if (signUpError) throw signUpError;

      if (!data.session) {
        setInfo("Check your email to confirm your account, then come back to this page and tap Accept.");
        return;
      }

      const { error: rpcError } = await supabase.rpc("accept_invitation", { p_token: token });
      if (rpcError) throw rpcError;
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const canSignUp = name.trim() && email.trim() && password.trim();

  return (
    <div className="ss-letter-wrap">
      {sealed ? (
        <div style={{ textAlign: "center" }}>
          <div className="ss-wordmark" style={{ marginBottom: 26 }}>SoulSync</div>
          <button
            className="ss-envelope"
            onClick={() => setSealed(false)}
            aria-label="Break the seal and open the invitation"
          >
            <div className="ss-env-flap" />
            <div className="ss-seal">{inviterName.charAt(0).toUpperCase()}</div>
            <div className="ss-env-name">For you</div>
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

          {alreadyAccepted ? (
            <div style={{ marginTop: 12 }}>
              <p className="ss-muted" style={{ marginBottom: 12 }}>
                This invitation has already been accepted — your home is ready and waiting.
              </p>
              <a className="ss-btn solid" href="/login" style={{ display: "inline-block", textDecoration: "none" }}>
                Sign in to your home
              </a>
            </div>
          ) : signedIn ? (
            <>
              {error && <p className="ss-error">{error}</p>}
              <button className="ss-btn solid" disabled={busy} onClick={acceptAsSignedInUser}>
                {busy ? "Accepting…" : "Accept invitation ✦"}
              </button>
            </>
          ) : (
            <section style={{ marginTop: 12 }}>
              <label className="ss-field-label" htmlFor="name">Your name</label>
              <input id="name" className="ss-input" value={name} onChange={(e) => setName(e.target.value)} />
              <label className="ss-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="ss-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="ss-field-label" htmlFor="password">Choose a password</label>
              <input
                id="password"
                type="password"
                className="ss-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="ss-error">{error}</p>}
              {info && <p className="ss-muted" style={{ marginBottom: 12 }}>{info}</p>}
              <button className="ss-btn solid" disabled={!canSignUp || busy} onClick={signUpAndAccept}>
                {busy ? "Accepting…" : "Accept invitation ✦"}
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
