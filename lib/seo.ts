import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const defaultOgImage = "/opengraph-image";

export const siteConfig = {
  name: "Customer Blog",
  description: "一个现代化、性能优先、SEO 友好的个人博客系统。",
  siteUrl,
  defaultOgImage,
  author: "Customer Blog"
};

function createAbsoluteUrl(pathname = "/") {
  return new URL(pathname, siteConfig.siteUrl).toString();
}

function buildSharedImages() {
  return [
    {
      url: createAbsoluteUrl(siteConfig.defaultOgImage),
      width: 1200,
      height: 630,
      alt: siteConfig.name
    }
  ];
}

export function buildBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    keywords: ["Next.js", "MDX", "博客", "SEO", "Prisma", "React"],
    alternates: {
      canonical: siteConfig.siteUrl,
      types: {
        "application/rss+xml": `${siteConfig.siteUrl}/api/rss`
      }
    },
    icons: {
      shortcut: "/favicon.ico"
    },
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.siteUrl,
      siteName: siteConfig.name,
      locale: "zh_CN",
      type: "website",
      images: buildSharedImages()
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.name,
      description: siteConfig.description,
      images: [createAbsoluteUrl(siteConfig.defaultOgImage)]
    }
  };
}

export function buildPostJsonLd(input: {
  title: string;
  description: string;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  slug: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedAt || undefined,
    dateModified: input.modifiedAt || input.publishedAt || undefined,
    mainEntityOfPage: `${siteConfig.siteUrl}/blog/${input.slug}`,
    author: {
      "@type": "Organization",
      name: siteConfig.author
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.author
    },
    keywords: input.tags?.join(", "),
    image: createAbsoluteUrl(siteConfig.defaultOgImage)
  };
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  pathname: string;
  keywords?: string[];
  openGraphType?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const url = createAbsoluteUrl(input.pathname);

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: url
    },
    robots: input.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: input.openGraphType || "website",
      images: buildSharedImages()
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [createAbsoluteUrl(siteConfig.defaultOgImage)]
    }
  };
}
