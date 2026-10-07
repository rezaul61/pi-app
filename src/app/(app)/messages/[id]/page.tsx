import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/server/session";
import { getThread, listConversations } from "@/server/services/messages";
import { ConversationList } from "@/components/messages/conversation-list";
import { ThreadPane } from "@/components/messages/thread";
import { Card } from "@/components/pi/primitives";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = (await getViewer())!;
  const thread = await getThread(viewer, id);
  if (!thread) notFound();
  const conversations = await listConversations(viewer);

  const pane = (
    <ThreadPane
      conversationId={id}
      messages={thread.messages}
      other={thread.other}
      insight={thread.insight}
      importantMessages={thread.importantMessages}
      meta={thread.meta}
      viewer={{ name: viewer.name, accent: viewer.accent, avatarUrl: viewer.avatarUrl }}
    />
  );

  return (
    <>
      {/* mobile: full-screen thread */}
      <div className="anim-in-up md:hidden">
        <div className="mb-2">
          <Link href="/messages" className="press inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
        <div className="glass-2 flex flex-col overflow-hidden rounded-2xl" style={{ height: "calc(100dvh - 6.5rem)" }}>{pane}</div>
      </div>

      {/* desktop: two-pane */}
      <div className="anim-in-up hidden gap-5 md:grid md:h-[calc(100dvh-9rem)] md:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="overflow-hidden md:h-full">
          <ConversationList conversations={conversations} activeId={id} />
        </Card>
        <Card className="flex flex-col overflow-hidden md:h-full">{pane}</Card>
      </div>
    </>
  );
}
