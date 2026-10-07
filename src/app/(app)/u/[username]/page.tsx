import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, LinkIcon, MapPin, Pencil } from "lucide-react";
import { getViewer } from "@/server/session";
import { getProfile, recordProfileView } from "@/server/services/people";
import { listFeed } from "@/server/services/feed";
import { Avatar } from "@/components/pi/avatar";
import { RoleBadge } from "@/components/pi/badge";
import { Button, Card, Chip, EmptyState, Stat } from "@/components/pi/primitives";
import { PostCard } from "@/components/post/post-card";
import { ConnectButton, FollowButton, MessageButton } from "@/components/people/person-actions";
import { ProfileMenu } from "@/components/people/profile-menu";
import { accentGradient, fmtDate, roleLabel } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const viewer = (await getViewer())!;
  const profile = await getProfile(viewer, decodeURIComponent(username));
  if (!profile) notFound();
  
  if (viewer.id !== profile.id) {
    await recordProfileView(viewer.id, profile.id);
  }

  const posts = await listFeed(viewer, { authorId: profile.id, limit: 20 });
  const isSelf = profile.relation === "self";

  return (
    <div className="anim-in-up">
      {/* ================= identity card ================= */}
      <Card className="overflow-hidden">
        {/* cover */}
        <div className="relative h-36 overflow-hidden sm:h-44">
          {profile.isVerified ? null : null}
          {viewer.coverUrl && isSelf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewer.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: accentGradient(profile.accent) }} />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(6,8,15,.45))]" />
          {/* subtle coordinate motif */}
          <div className="absolute inset-0 opacity-25" aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,.5) 1px, transparent 1.6px)",
              backgroundSize: "26px 26px",
              maskImage: "linear-gradient(115deg, transparent 40%, black 90%)",
            }}
          />
        </div>

        <div className="relative px-5 pb-5 sm:px-7">
          <div className="flex items-end justify-between gap-4">
            <div className="-mt-11 sm:-mt-13">
              <span className="block rounded-[34%] ring-4 ring-[color-mix(in_oklab,var(--c-bg)_88%,transparent)] w-fit">
                <Avatar
                  name={profile.name}
                  accent={profile.accent}
                  avatarUrl={profile.avatarUrl}
                  roles={profile.roles}
                  size={96}
                  badgeSize={34}
                />
              </span>
            </div>
            <div className="flex items-center gap-2 pt-3">
              {isSelf ? (
                <Link href="/settings">
                  <Button variant="secondary" size="sm">
                    <Pencil size={13} /> Edit profile
                  </Button>
                </Link>
              ) : (
                <>
                  <ConnectButton targetId={profile.id} initial={profile.relation === "self" ? "none" : profile.relation} />
                  <MessageButton targetId={profile.id} />
                  <FollowButton targetId={profile.id} initial={profile.isFollowing} />
                  <ProfileMenu targetId={profile.id} username={profile.username} />
                </>
              )}
            </div>
          </div>

          <div className="mt-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="track-heading text-[21px] font-semibold text-ink">{profile.name}</h1>
              <RoleBadge roles={profile.roles} size={24} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-ink-2">
                {profile.roles.map(roleLabel).join(" · ") || "Member"}
              </span>
              <span className="text-[12.5px] text-ink-3">@{profile.username}</span>
            </div>
            {profile.headline ? <p className="mt-2.5 text-[14px] text-ink">{profile.headline}</p> : null}
            {profile.bio ? <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">{profile.bio}</p> : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-3">
              {profile.institution ? (
                <span className="flex items-center gap-1.5"><Building2 size={12.5} /> {profile.institution}</span>
              ) : null}
              {profile.location ? (
                <span className="flex items-center gap-1.5"><MapPin size={12.5} /> {profile.location}</span>
              ) : null}
              {profile.website ? (
                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-acc pi-link">
                  <LinkIcon size={12.5} /> {profile.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
              <span className="flex items-center gap-1.5"><CalendarDays size={12.5} /> Joined {fmtDate(profile.joinedAt)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3 border-t border-line pt-4">
              <Stat value={profile.postCount} label="Posts" />
              <Stat value={profile.connectionCount} label="Connections" />
              <Stat value={profile.followerCount} label="Followers" />
              <Stat value={profile.viewCount} label="Orbit Views" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3 mb-2">At a glance</p>
                <div className="glass-1 rounded-xl p-3.5 border-l-2 border-acc/40">
                  <p className="text-[13.5px] leading-relaxed text-ink-2">
                    {profile.name} is a verified <b>{profile.roles.join(" & ")}</b> active in <b>{profile.location}</b>. 
                    {profile.institution && ` Currently contributing to ${profile.institution}.`}
                  </p>
                </div>
              </div>

              {profile.interests.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((i) => (
                    <Chip key={i}>{i}</Chip>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* ================= activity ================= */}
      <h2 className="track-heading mt-7 mb-4 text-[16px] font-semibold text-ink">
        {isSelf ? "Your activity" : `Activity`}
      </h2>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <div key={post.id} className="anim-in-up" style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
            <PostCard post={post} viewerId={viewer.id} />
          </div>
        ))}
        {!posts.length ? (
          <Card>
            <EmptyState
              compact
              title={isSelf ? "You haven't published yet" : "Nothing published yet"}
              body={isSelf ? "Share your first research update, project or idea." : undefined}
            />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
