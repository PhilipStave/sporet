"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store/Store";
import { Icon } from "@/components/Icon";
import { relativeLabel } from "@/lib/format";
import type { DealDocumentRow } from "@/types/database";

const BUCKET = "documents";
const MAX_MB = 25;

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Documents attached to a customer (quotes, contracts, drawings). Stored in a private bucket scoped by org. */
export function DealDocuments({ dealId }: { dealId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { org, profile, canWrite, logActivity } = useStore();
  const [docs, setDocs] = useState<DealDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("deal_documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setDocs(data ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, dealId]);

  const upload = async (files: FileList | File[]) => {
    setErr("");
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    for (const file of list) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setErr(`«${file.name}» er større enn ${MAX_MB} MB.`);
        continue;
      }
      const safe = file.name.replace(/[^\w.\-æøåÆØÅ ]+/g, "_");
      const path = `${org.id}/${dealId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) {
        setErr(`Kunne ikke laste opp «${file.name}»: ${upErr.message}`);
        continue;
      }
      const { data: row, error: dbErr } = await supabase
        .from("deal_documents")
        .insert({
          org_id: org.id,
          deal_id: dealId,
          name: file.name,
          path,
          size: file.size,
          mime: file.type || "",
          uploaded_by: profile.id,
          uploaded_by_name: profile.full_name,
        })
        .select("*")
        .single();
      if (dbErr || !row) {
        await supabase.storage.from(BUCKET).remove([path]);
        setErr(`Kunne ikke lagre «${file.name}».`);
        continue;
      }
      setDocs((d) => [row, ...d]);
      void logActivity(dealId, { icon: "file", label: "Dokument", note: `Lastet opp ${file.name}` });
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const open = async (doc: DealDocumentRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.path, 60 * 10, {
      download: doc.name,
    });
    if (error || !data?.signedUrl) {
      setErr("Kunne ikke åpne dokumentet.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async (doc: DealDocumentRow) => {
    if (!confirm(`Slette «${doc.name}»?`)) return;
    setBusy(true);
    const { error } = await supabase.from("deal_documents").delete().eq("id", doc.id);
    if (error) {
      setErr("Kunne ikke slette (bare den som lastet opp, eller admin, kan slette).");
    } else {
      await supabase.storage.from(BUCKET).remove([doc.path]);
      setDocs((d) => d.filter((x) => x.id !== doc.id));
      void logActivity(dealId, { icon: "trash", label: "Dokument", note: `Slettet ${doc.name}` });
    }
    setBusy(false);
  };

  const canDelete = (doc: DealDocumentRow) => profile.role === "admin" || doc.uploaded_by === profile.id;

  return (
    <div>
      {canWrite && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          style={{
            border: `1.5px dashed ${drag ? "var(--primary)" : "var(--border)"}`,
            background: drag ? "var(--primary-050)" : "transparent",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          <Icon name="upload" size={15} />
          {busy ? "Laster opp …" : "Slipp filer her, eller klikk for å velge (tilbud, kontrakt, tegning …)"}
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => e.target.files && void upload(e.target.files)}
          />
        </div>
      )}
      {err && <p style={{ fontSize: 12, color: "var(--danger)", margin: "0 0 8px" }}>{err}</p>}

      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Henter …</p>
      ) : docs.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Ingen dokumenter ennå.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface)",
              }}
            >
              <span
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "var(--primary-050)", color: "var(--primary)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="file" size={15} />
              </span>
              <button
                type="button"
                onClick={() => void open(doc)}
                title="Åpne / last ned"
                style={{
                  flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0,
                  color: "var(--text)", cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {fmtSize(doc.size)} · {relativeLabel(doc.created_at)}
                  {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name}` : ""}
                </div>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => void open(doc)}
                title="Last ned"
                style={{ padding: "6px 8px" }}
              >
                <Icon name="download" size={15} />
              </button>
              {canWrite && canDelete(doc) && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => void remove(doc)}
                  disabled={busy}
                  title="Slett"
                  style={{ padding: "6px 8px", color: "var(--danger)" }}
                >
                  <Icon name="trash" size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
