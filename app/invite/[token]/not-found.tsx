export default function InviteNotFound() {
  return (
    <div className="ss-center">
      <div className="ss-wordmark" style={{ marginBottom: 26 }}>
        SoulSync
      </div>
      <h1 className="ss-greet" style={{ textAlign: "center" }}>
        This link isn&apos;t <em>quite right</em>.
      </h1>
      <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 30px" }}>
        The invitation link you followed doesn&apos;t match one we have — it may have a typo, or the
        invitation may have been sent from a different link. Double-check it with whoever sent it.
      </p>
      <a className="ss-btn solid" href="/login" style={{ textDecoration: "none" }}>
        Go to sign in
      </a>
    </div>
  );
}
