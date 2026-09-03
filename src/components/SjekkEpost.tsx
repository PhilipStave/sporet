"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendBekreftelsePaaNytt, type AuthState } from "@/app/(auth)/actions";
import { Logo } from "./Logo";

/**
 * What you see instead of being let in.
 *
 * The account exists but the address is not proven yet. The single most common
 * support request behind a screen like this is "I never got the mail", so the
 * spam-folder line and the resend button are here rather than a paragraph down
 * — and the address is spelled out, because roughly half of those cases are a
 * typo the person can spot themselves.
 */
export function SjekkEpost({ epost }: { epost: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    sendBekreftelsePaaNytt,
    {}
  );
  const sendtIgjen = !pending && state.sjekkEpost === epost;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
      }}
    >
      <div className="card" style={{ padding: 34, maxWidth: 440, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Logo />
        </div>

        <h1 style={{ fontSize: 23, margin: "0 0 10px", textAlign: "center" }}>
          Sjekk e-posten din
        </h1>
        <p style={{ fontSize: 15, margin: "0 0 6px", textAlign: "center", lineHeight: 1.6 }}>
          Vi har sendt en bekreftelse til
        </p>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 18px",
            wordBreak: "break-all",
          }}
        >
          {epost}
        </p>
        <p style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 22px" }}>
          Trykk på lenken i e-posten, så er kontoen klar. Finner du den ikke,
          se i søppelpost — den havner der oftere enn den burde.
        </p>

        {sendtIgjen ? (
          <p
            style={{
              fontSize: 14,
              background: "var(--tint-success)",
              color: "#059669",
              padding: "11px 14px",
              borderRadius: 10,
              margin: "0 0 16px",
              textAlign: "center",
            }}
          >
            Sendt på nytt. Det kan ta et minutt.
          </p>
        ) : (
          <form action={formAction} style={{ marginBottom: 16 }}>
            <input type="hidden" name="email" value={epost} />
            <button
              type="submit"
              className="btn"
              disabled={pending}
              style={{ width: "100%", padding: "11px 0", fontSize: 15 }}
            >
              {pending ? "Sender …" : "Send e-posten på nytt"}
            </button>
          </form>
        )}

        <p style={{ fontSize: 13.5, color: "var(--muted)", textAlign: "center", margin: 0 }}>
          Skrev du feil adresse?{" "}
          <Link href="/setup" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Start på nytt
          </Link>
        </p>
      </div>
    </main>
  );
}

/**
 * The same resend, in one line, for the login screen — where the person has
 * already typed their password and just needs the mail again.
 */
export function SjekkEpostLenke({ epost }: { epost: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    sendBekreftelsePaaNytt,
    {}
  );
  if (!pending && state.sjekkEpost === epost)
    return (
      <p style={{ margin: "8px 0 0", fontSize: 13, color: "#059669" }}>
        Sendt på nytt. Det kan ta et minutt.
      </p>
    );
  return (
    <form action={formAction} style={{ margin: "8px 0 0" }}>
      <input type="hidden" name="email" value={epost} />
      <button
        type="submit"
        disabled={pending}
        style={{
          border: "none",
          background: "none",
          padding: 0,
          fontSize: 13,
          fontWeight: 600,
          color: "var(--primary)",
          cursor: "pointer",
        }}
      >
        {pending ? "Sender …" : "Send bekreftelsen på nytt"}
      </button>
    </form>
  );
}
