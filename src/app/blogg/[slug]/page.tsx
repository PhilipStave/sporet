import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout, articleStyles as s } from "@/components/ArticleLayout";
import { CONTENT_POSTS } from "@/lib/blog-content";
import { isPublished } from "@/lib/blog";

// Scheduled posts render here. Re-rendered hourly so a post goes live on its own date
// without anyone deploying anything.
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return CONTENT_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = CONTENT_POSTS.find((p) => p.slug === slug);
  if (!post || !isPublished(post.datePublished)) return { title: "Ikke funnet" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blogg/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = CONTENT_POSTS.find((p) => p.slug === slug);
  if (!post || !isPublished(post.datePublished)) notFound();

  return (
    <ArticleLayout
      meta={{
        slug: `blogg/${post.slug}`,
        kicker: post.kicker,
        title: post.title,
        description: post.description,
        datePublished: post.datePublished,
        image: post.image,
        imageAlt: post.imageAlt,
      }}
      related={post.related}
    >
      <p style={s.lead}>{post.lead}</p>

      {post.sections.map((sec) => (
        <section key={sec.h2}>
          <h2 style={s.h2}>{sec.h2}</h2>
          {sec.paras?.map((t, i) => (
            <p key={i} style={s.p}>
              {t}
            </p>
          ))}
          {sec.bullets && (
            <ul style={s.ul}>
              {sec.bullets.map((b, i) => (
                <li key={i} style={s.li}>
                  {b.strong && <strong>{b.strong}</strong>} {b.text}
                </li>
              ))}
            </ul>
          )}
          {sec.parasAfter?.map((t, i) => (
            <p key={i} style={s.p}>
              {t}
            </p>
          ))}
        </section>
      ))}
    </ArticleLayout>
  );
}
