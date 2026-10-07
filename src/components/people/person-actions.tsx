"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/pi/primitives";
import { useToast } from "@/components/pi/toast";
import { connectAction, followAction, messageAction, respondAction } from "@/server/actions/people";
import { joinCommunityAction } from "@/server/actions/engagement";

export function ConnectButton({ targetId, initial }: { targetId: string; initial: "none" | "connected" | "incoming" | "outgoing" }) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  if (state === "connected")
    return (
      <Button variant="secondary" size="sm" disabled>
        <Check size={13} /> Connected
      </Button>
    );
  if (state === "outgoing")
    return (
      <Button variant="secondary" size="sm" disabled>
        Requested
      </Button>
    );
  if (state === "incoming")
    return (
      <Button size="sm" onClick={() => router.push("/network")}>
        Respond
      </Button>
    );

  return (
    <Button
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await connectAction(targetId);
          if (res.state === "outgoing") {
            setState("outgoing");
            toast("Connection request sent", "success");
          } else if (res.state === "connected") {
            setState("connected");
            toast("You are now connected", "success");
            router.refresh();
          }
        })
      }
    >
      <UserPlus size={13} /> Connect
    </Button>
  );
}

export function AcceptButtons({ requesterId }: { requesterId: string }) {
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  if (done)
    return (
      <span className="text-[12px] font-medium text-ink-3">
        {done === "accepted" ? "Connected ✓" : "Declined"}
      </span>
    );

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await respondAction(requesterId, true);
            if (res.ok) {
              setDone("accepted");
              toast("Connection accepted", "success");
            }
          })
        }
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondAction(requesterId, false);
            setDone("declined");
          })
        }
      >
        Decline
      </Button>
    </div>
  );
}

export function MessageButton({ targetId, label = "Message" }: { targetId: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={() => startTransition(async () => messageAction(targetId))}>
      <MessageCircle size={13} /> {label}
    </Button>
  );
}

export function FollowButton({ targetId, initial }: { targetId: string; initial: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={following ? "secondary" : "ghost"}
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await followAction(targetId);
          setFollowing(res.following);
        })
      }
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

export function JoinCommunityButton({ communityId, initial, slug }: { communityId: string; initial: boolean; slug: string }) {
  const [joined, setJoined] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <Button
      variant={joined ? "secondary" : "primary"}
      size="sm"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await joinCommunityAction(communityId);
          setJoined(res.joined);
          toast(res.joined ? "Community joined" : "Left community", res.joined ? "success" : "info");
          router.refresh();
        })
      }
      key={slug}
    >
      {joined ? <Check size={13} /> : null}
      {joined ? "Joined" : "Join"}
    </Button>
  );
}
