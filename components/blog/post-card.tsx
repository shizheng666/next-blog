import Link from "next/link";

interface PostCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  tags: { id: string; name: string; slug: string }[];
}

export function PostCard(props: PostCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <h2 className="text-xl font-semibold">
        <Link
          href={`/blog/${props.slug}`}
          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {props.title}
        </Link>
      </h2>
      {props.publishedAt ? <p className="mt-2 text-sm text-muted-foreground">发布于 {new Date(props.publishedAt).toLocaleDateString()}</p> : null}
      {props.excerpt ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{props.excerpt}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {props.tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="rounded-full border px-2 py-1 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </article>
  );
}
