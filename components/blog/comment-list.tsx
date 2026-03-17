interface CommentItem {
  id: string;
  authorName?: string | null;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  comments: CommentItem[];
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <section aria-labelledby="comments-title" className="mt-8 rounded-xl border p-4">
      <h3 id="comments-title" className="text-lg font-semibold">
        评论区
      </h3>
      {comments.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">暂无评论，欢迎成为第一个留言的人。</p> : null}
      <div className="mt-3 space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-md border p-3">
            <p className="text-sm font-medium">{comment.authorName || "匿名用户"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6">{comment.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
