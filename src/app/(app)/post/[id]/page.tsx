import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getViewer } from "@/server/session";
import { getComments, getPost } from "@/server/services/feed";
import { PostCard } from "@/components/post/post-card";
import { CommentList } from "./comment-list";
import { CommentForm } from "@/components/post/comments";
import { Card, SectionTitle } from "@/components/pi/primitives";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = (await getViewer())!;
  const post = await getPost(viewer, id);
  if (!post) notFound();
  const comments = await getComments(viewer, post.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/home" className="press mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
        <ChevronLeft size={15} /> Back to feed
      </Link>

      <PostCard post={post} viewerId={viewer.id} detail />

      <Card className="mt-5 p-5">
        <SectionTitle hint={`${comments.length}`}>Discussion</SectionTitle>
        <CommentForm postId={post.id} />
        <CommentList comments={comments} postId={post.id} />
      </Card>
    </div>
  );
}
