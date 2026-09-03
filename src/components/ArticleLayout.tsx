import { LogoMark } from "@/components/Logo";
import { BLOG_POSTS } from "@/lib/blog";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { COMPANY_LEGAL_NAME, COMPANY_ORG_NR } from "@/lib/legal";

// Shared shell for content pages (/hvorfor-altiv, /blogg/*): header, article JSON-LD, CTA, footer.

// A named human author is a stronger trust signal to search engines than an
// organisation byline, and it is simply true: Philip writes these.
const AUTHOR = { name: "Philip Stave", role: "Grunnlegger av Altiv" };

const wrap: React.CSSProperties = { maxWidth: 820, margin: "0 auto" };

export const articleStyles = {
  h2: {
    fontFamily: "var(--font-display)",
    fontWeight: 400,
    fontSize: "clamp(26px, 3.4vw, 36px)",
    margin: "44px 0 12px",
    lineHeight: 1.15,
  } as React.CSSProperties,
  p: { margin: "0 0 14px", fontSize: 17, lineHeight: 1.65 } as React.CSSProperties,
  li: { marginBottom: 8, fontSize: 17, lineHeight: 1.6 } as React.CSSProperties,
  ul: { paddingLeft: 22, margin: "0 0 14px" } as React.CSSProperties,
  lead: { margin: "0 0 14px", fontSize: 19, lineHeight: 1.65, color: "var(--muted)" } as React.CSSProperties,
};


const MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${MONTHS[m - 1]} ${y}`;
}

export type ArticleMeta = {
  slug: string; // path without leading slash, e.g. "blogg/hva-er-crm"
  kicker: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  readMinutes?: number;
  image?: string;
  imageAlt?: string;
};

export function ArticleLayout({
  meta,
  children,
  related,
}: {
  meta: ArticleMeta;
  children: React.ReactNode;
  related?: { href: string; label: string }[];
}) {
  const url = `${SITE_URL}/${meta.slug}`;

  // Three onward reads, always. The author picks first; the newest posts that
  // are not this one fill the rest.
  const valgt = (related ?? []).map((r) => ({ ...r, sub: undefined as string | undefined }));
  const nesteLesning = [
    ...valgt,
    ...BLOG_POSTS.filter(
      (b) =>
        `blogg/${b.slug}` !== meta.slug &&
        !valgt.some((v) => v.href === `/blogg/${b.slug}`)
    ).map((b) => ({ href: `/blogg/${b.slug}`, label: b.title, sub: b.description })),
  ].slice(0, 3);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    inLanguage: "nb-NO",
    author: {
      "@type": "Person",
      name: AUTHOR.name,
      jobTitle: AUTHOR.role,
      url: `${SITE_URL}/hvorfor-altiv`,
    },
    publisher: { "@type": "Organization", name: "Altiv", url: SITE_URL },
    mainEntityOfPage: url,
    ...(meta.image ? { image: `${SITE_URL}${meta.image}` } : {}),
    datePublished: meta.datePublished,
    dateModified: meta.dateModified ?? meta.datePublished,
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Altiv", item: SITE_URL },
      ...(meta.slug.startsWith("blogg/")
        ? [{ "@type": "ListItem", position: 2, name: "Blogg", item: `${SITE_URL}/blogg` }]
        : []),
      { "@type": "ListItem", position: meta.slug.startsWith("blogg/") ? 3 : 2, name: meta.title, item: url },
    ],
  };

  return (
    <div
      className="landing"
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-karla)",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--bg)",
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div style={{ ...wrap, padding: "16px 24px", display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text)" }}
          >
            <LogoMark size={38} />
            Altiv
          </Link>
          <nav style={{ display: "flex", gap: 18, marginLeft: "auto", fontSize: 15, fontWeight: 600, flexWrap: "wrap" }}>
            <Link href="/hvorfor-altiv" style={{ color: "var(--text)" }}>Hvorfor Altiv</Link>
            <Link href="/blogg" style={{ color: "var(--text)" }}>Blogg</Link>
            <Link href="/#priser" style={{ color: "var(--text)" }}>Priser</Link>
            <Link href="/login" style={{ color: "var(--text)" }}>Logg inn</Link>
            <Link
              href="/setup"
              style={{ padding: "8px 16px", borderRadius: 999, background: "var(--ink)", color: "#f7f4ee" }}
            >
              Prøv gratis
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ ...wrap, padding: "56px 24px 80px" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 10px" }}>
          {meta.kicker}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(36px, 5.4vw, 58px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            margin: "0 0 18px",
          }}
        >
          {meta.title}
        </h1>

        <p
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--muted)",
            margin: "0 0 22px",
          }}
        >
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{AUTHOR.name}</span>
          <span aria-hidden>·</span>
          <span>{AUTHOR.role}</span>
          <span aria-hidden>·</span>
          <time dateTime={meta.datePublished}>{formatDate(meta.datePublished)}</time>
          {meta.readMinutes ? (
            <>
              <span aria-hidden>·</span>
              <span>{meta.readMinutes} min lesing</span>
            </>
          ) : null}
        </p>

        {meta.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meta.image}
            alt={meta.imageAlt ?? ""}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "var(--r-lg-land)",
              border: "1px solid var(--divider)",
              margin: "6px 0 18px",
              display: "block",
            }}
          />
        )}

        {children}

        <div
          style={{
            marginTop: 40,
            padding: 28,
            background: "var(--ink)",
            color: "#f4f1ea",
            borderRadius: "var(--r-lg-land)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginBottom: 6 }}>
              Prøv Altiv gratis i 14 dager
            </h3>
            <p style={{ margin: 0, fontSize: 15, color: "#c3ccc4" }}>
              Sett opp bedriften på to minutter. Ingen binding, ingen trekk i prøveperioden.
            </p>
          </div>
          <Link
            href="/setup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "13px 26px",
              borderRadius: 999,
              background: "#f4f1ea",
              color: "var(--ink)",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Sett opp bedriften
          </Link>
        </div>

        {/*
          Every article ends with three real ways onward, not a grey line of
          text after the sign-up box — and never an empty space, because these
          were hand-written per article and most articles had none. Whatever
          the author picked comes first; the rest is filled from the newest
          posts that are not this one.
        */}
        {nesteLesning.length > 0 && (
          <section style={{ marginTop: 44, borderTop: "1px solid var(--divider)", paddingTop: 26 }}>
            <h2 style={{ fontSize: 19, margin: "0 0 14px" }}>Les videre</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              {nesteLesning.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="land-card"
                  style={{
                    display: "block",
                    background: "var(--surface)",
                    border: "1px solid var(--divider)",
                    borderRadius: 14,
                    padding: 18,
                    textDecoration: "none",
                    color: "var(--text)",
                  }}
                >
                  <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.32 }}>
                    {r.label}
                  </div>
                  {r.sub && (
                    <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 7, lineHeight: 1.5 }}>
                      {r.sub}
                    </div>
                  )}
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", marginTop: 11 }}>
                    Les →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--divider)" }}>
        <div style={{ ...wrap, padding: "22px 24px", display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14, color: "var(--muted)" }}>
          <Link href="/" style={{ color: "var(--muted)" }}>Forside</Link>
          <Link href="/hvorfor-altiv" style={{ color: "var(--muted)" }}>Hvorfor Altiv</Link>
          <Link href="/salgsoppfolging" style={{ color: "var(--muted)" }}>Salgsoppfølging</Link>
            <Link href="/salgsverktoy" style={{ color: "var(--muted)" }}>Salgsverktøy</Link>
          <Link href="/blogg" style={{ color: "var(--muted)" }}>Blogg</Link>
          <Link href="/vilkar" style={{ color: "var(--muted)" }}>Vilkår</Link>
          <Link href="/personvern" style={{ color: "var(--muted)" }}>Personvern</Link>
          <span style={{ color: "var(--muted)", opacity: 0.8 }}>
            <a href="https://stavesoftware.no" style={{ color: "var(--muted)" }}>
              {COMPANY_LEGAL_NAME}
            </a>{" "}
            · org.nr. {COMPANY_ORG_NR}
          </span>
          <a href="mailto:post@altiv.no" style={{ color: "var(--muted)", marginLeft: "auto" }}>post@altiv.no</a>
        </div>
      </footer>
    </div>
  );
}
