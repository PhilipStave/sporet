import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "Blogg — CRM, salgsoppfølging og pipeline for norske bedrifter",
  description:
    "Korte, praktiske artikler om CRM, salgspipeline og kundeoppfølging for små og mellomstore bedrifter i Norge. Skrevet av folk som bygger Altiv.",
  alternates: { canonical: "/blogg" },
};

export default function BlogIndex() {
  return (
    <ArticleLayout
      meta={{
        slug: "blogg",
        kicker: "Blogg",
        title: "Praktisk om CRM og salgsoppfølging",
        description: metadata.description as string,
        datePublished: "2026-08-19",
      }}
    >
      <p style={s.lead}>
        Korte artikler for deg som driver eller jobber i en liten eller mellomstor
        bedrift og vil ha bedre oversikt over salget — uten å lese en lærebok først.
      </p>

      <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blogg/${post.slug}`}
            style={{
              display: "block",
              overflow: "hidden",
              padding: "22px 24px",
              border: "1px solid var(--divider)",
              borderRadius: "var(--r-lg-land)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.imageAlt}
              style={{ width: "calc(100% + 48px)", margin: "-22px -24px 14px", display: "block" }}
            />
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
              {new Date(post.datePublished).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {post.readMinutes} min lesing
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, margin: "0 0 8px", lineHeight: 1.2 }}>
              {post.title}
            </h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--muted)" }}>{post.description}</p>
          </Link>
        ))}
      </div>
    </ArticleLayout>
  );
}
