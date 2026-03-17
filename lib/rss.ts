import { siteConfig } from "@/lib/seo";

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
}

export function buildRssXml(items: RssItem[]): string {
  const itemXml = items
    .map((item) => {
      return `<item>
  <title><![CDATA[${item.title}]]></title>
  <link>${item.link}</link>
  <description><![CDATA[${item.description}]]></description>
  <pubDate>${item.pubDate || new Date().toUTCString()}</pubDate>
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${siteConfig.name}</title>
  <link>${siteConfig.siteUrl}</link>
  <description>${siteConfig.description}</description>
  ${itemXml}
</channel>
</rss>`;
}
