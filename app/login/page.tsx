"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/errors";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = email.trim() && password.trim() && (mode === "signin" || displayName.trim());

  return (
    <div className="ss-center">
      <div className="ss-wordmark" style={{ marginBottom: 26 }}>SoulSync</div>
      <h1 className="ss-greet" style={{ textAlign: "center" }}>
        A home for <em>the two of you</em>.
      </h1>
      <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 30px" }}>
        Sign in to continue, or create an account to begin your invitation.
      </p>

      <section className="ss-card col-12" style={{ width: "min(420px, 100%)" }}>
        <div className="ss-moods" style={{ marginBottom: 16 }}>
          <button className={`ss-mood ${mode === "signin" ? "sel" : ""}`} onClick={() => setMode("signin")}>
            Sign in
          </button>
          <button className={`ss-mood ${mode === "signup" ? "sel" : ""}`} onClick={() => setMode("signup")}>
            Create account
          </button>
        </div>

        {mode === "signup" && (
          <>
            <label className="ss-field-label" htmlFor="displayName">Your name</label>
            <input
              id="displayName"
              className="ss-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
            />
          </>
        )}

        <label className="ss-field-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="ss-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label className="ss-field-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="ss-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) submit();
          }}
        />

        {error && <p className="ss-error">{error}</p>}
        {info && <p className="ss-muted" style={{ marginBottom: 12 }}>{info}</p>}

        <button className="ss-btn solid" disabled={!canSubmit || busy} onClick={submit} style={{ width: "100%" }}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </section>
    </div>
  );
}
