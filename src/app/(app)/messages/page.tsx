import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/server/session";
import { listConversations } from "@/server/services/messages";
import { ConversationList } from "@/components/messages/conversation-list";
import { Card, EmptyState } from "@/components/pi/primitives";
import { PiOrb } from "@/components/pi/orb";

export default async function MessagesPage() {
  const viewer = (await getViewer())!;
  const conversations = await listConversations(viewer);

  return (
    <div className="anim-in-up">
      {/* Back button — mobile */}
      <div className="mb-3 md:hidden">
        <Link href="/home" className="press inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </div>

      <div className="grid gap-5 h-[calc(100dvh-7rem)] md:h-[calc(100dvh-9rem)] md:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="overflow-hidden h-full">
          <ConversationList conversations={conversations} />
        </Card>
        <Card className="hidden overflow-hidden md:flex md:h-full md:flex-col md:items-center md:justify-center">
          <div className="max-w-md px-8 text-center">
            <PiOrb size={86} state="synchronizing" />
            <h2 className="track-heading mt-8 text-[22px] font-semibold text-ink">A conversation workspace</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Open a thread to read, search, and mark important messages.
            </p>
          </div>
        </Card>
        {!conversations.length ? (
          <div className="md:col-span-2">
            <Card>
              <EmptyState
                compact
                title="No conversations yet"
                body="Start from a profile, connect, then move the relationship forward with a useful message."
              />
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
