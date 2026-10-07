import { BackHome } from "@/components/pi/back-home";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { currentToken, getViewer } from "@/server/session";
import { listBlocked } from "@/server/services/people";
import { AppearancePanel, PrivacyPanel, ProfilePanel, SecurityPanel } from "@/components/settings/panels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const SECTIONS = [
  { key: "profile", label: "Profile" },
  { key: "appearance", label: "Appearance" },
  { key: "security", label: "Security" },
  { key: "privacy", label: "Privacy" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section = "profile" } = await searchParams;
  const viewer = (await getViewer())!;
  const token = await currentToken();

  const sessionRows =
    section === "security"
      ? await db
          .select({ token: sessions.token, userAgent: sessions.userAgent, createdAt: sessions.createdAt })
          .from(sessions)
          .where(eq(sessions.userId, viewer.id))
          .orderBy(desc(sessions.createdAt))
          .limit(8)
          .then((rows) =>
            rows
              .filter(() => true)
              .map((r) => ({
                token: r.token,
                userAgent: r.userAgent,
                createdAt: r.createdAt.toISOString(),
                current: r.token === token,
              }))
          )
      : [];

  const blocked = section === "privacy" ? await listBlocked(viewer) : [];

  return (
    <div className="anim-in-up mx-auto max-w-3xl">
      <BackHome compact />
      <header className="mb-5">
        <h1 className="track-heading text-[22px] font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-[13px] text-ink-2">Your identity, your environment, your control.</p>
      </header>

      <div className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={`/settings?section=${s.key}`}
            className={cn(
              "relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              section === s.key ? "text-ink" : "text-ink-3 hover:text-ink"
            )}
          >
            {s.label}
            {section === s.key ? (
              <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[linear-gradient(90deg,var(--c-acc),var(--c-acc-3))]" />
            ) : null}
          </Link>
        ))}
      </div>

      {section === "profile" ? (
        <ProfilePanel
          viewer={{
            name: viewer.name,
            username: viewer.username,
            headline: viewer.headline,
            bio: viewer.bio,
            location: viewer.location,
            institution: viewer.institution,
            website: viewer.website,
            accent: viewer.accent,
            avatarUrl: viewer.avatarUrl,
            coverUrl: viewer.coverUrl,
          }}
        />
      ) : null}
      {section === "appearance" ? <AppearancePanel theme={viewer.theme} fx={viewer.fx} /> : null}
      {section === "security" ? <SecurityPanel sessions={sessionRows} /> : null}
      {section === "privacy" ? <PrivacyPanel blocked={blocked} oppAlerts={viewer.oppAlerts} /> : null}
    </div>
  );
}
