"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Compass,
  FileText,
  FlaskConical,
  Home,
  ListTodo,
  LogOut,
  MessageCircle,
  Moon,
  PenLine,
  Plus,
  Rocket,
  CalendarDays,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  Users,
  Vault,
  Waypoints,
} from "lucide-react";
import { Avatar } from "@/components/pi/avatar";
import { PiMark, PiOrb } from "@/components/pi/orb";
import { ToastProvider, useToast } from "@/components/pi/toast";
import { CommandPalette } from "@/components/pi/command";
import { ComposerModal } from "@/components/post/composer";
import { updatePrefsAction } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

export type ShellViewer = {
  name: string;
  username: string;
  accent: string;
  avatarUrl: string | null;
  roles: string[];
  isVerified: boolean;
  theme: string;
  fx: string;
};

type Counts = { notifications: number; messages: number; requests: number };

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/insights", label: "PI Insight", icon: Sparkles },
  { href: "/network", label: "Network", icon: Waypoints },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/opportunities", label: "Careers", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: DynamicCalendarIcon },
  { href: "/vault", label: "PI Vault", icon: Vault },
];

const CREATE_ITEMS = [
  { kind: "post", label: "Post", desc: "Share an idea or update", icon: PenLine },
  { kind: "article", label: "Article", desc: "Long-form writing", icon: FileText },
  { kind: "research", label: "Research Update", desc: "Methods, data, findings", icon: FlaskConical },
  { kind: "project", label: "Project", desc: "Show or recruit", icon: Rocket },
  { kind: "event", label: "Event", desc: "Gather your network", icon: CalendarDays },
  { kind: "poll", label: "Poll", desc: "Ask the network", icon: ListTodo },
];

function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true
  );
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="anim-scale-in absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6366f1)] px-1 text-[9.5px] font-bold text-white tnum shadow-[0_2px_8px_-2px_rgba(139,92,246,.7)]">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function DynamicCalendarIcon({ size = 20, active = false }: { size?: number; active?: boolean }) {
  const day = new Date().getDate();
  const stroke = active ? "var(--c-ink)" : "var(--c-ink-3)";
  const sw = active ? 2.0 : 1.6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Calendar frame */}
      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
      {/* Top bar (flap) */}
      <line x1="3" y1="9" x2="21" y2="9" />
      {/* Binding rings */}
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      {/* Date number — rendered as SVG text so it sits cleanly inside */}
      <text
        x="12"
        y="20"
        textAnchor="middle"
        fontSize={size * 0.42}
        fontWeight="700"
        fill={stroke}
        stroke="none"
        fontFamily="inherit"
      >
        {day}
      </text>
    </svg>
  );
}

function ShellInner({ viewer, counts, children }: { viewer: ShellViewer; counts: Counts; children: React.ReactNode }) {
  const pathname = usePathname();
  const toast = useToast();
  const online = useOnline();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [composer, setComposer] = useState<string | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setUserMenu(false);
    setCreateOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const toggleTheme = async () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    await updatePrefsAction(next, undefined);
    toast(next === "light" ? "Pearl environment" : "Midnight environment", "info");
  };

  return (
    <div className="min-h-dvh">
      {/* ambient atmosphere */}
      <div className="pi-ambient" aria-hidden>
        <div className="anim-ambient absolute inset-0" style={{ background: "radial-gradient(40% 30% at 30% 20%, var(--amb-1), transparent 70%)" }} />
      </div>
      <div className="pi-noise" aria-hidden />

      {/* offline state */}
      {!online ? (
        <div className="sticky top-0 z-[70] flex items-center justify-center gap-2 bg-[color-mix(in_oklab,var(--c-warn)_14%,transparent)] px-4 py-1.5 text-xs font-medium text-warn backdrop-blur">
          You&apos;re offline — cached content stays readable; actions will resume when you reconnect.
        </div>
      ) : null}

      {/* ============ desktop rail ============ */}
      <nav className="fixed top-0 bottom-0 left-0 z-50 hidden w-[74px] flex-col items-center border-r border-line bg-[color-mix(in_oklab,var(--c-bg)_72%,transparent)] py-4 backdrop-blur-xl md:flex" aria-label="Primary">
        <Link href="/home" aria-label="PI home" className="press mb-5 rounded-[28px] ring-1 ring-[color-mix(in_oklab,var(--c-acc)_22%,transparent)] shadow-[0_0_30px_rgba(139,92,246,0.16)]">
          <PiOrb size={56} state="idle" />
        </Link>

        <div className="flex flex-1 flex-col items-center gap-1.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                "press relative flex size-11 items-center justify-center rounded-xl transition-colors",
                isActive(href) ? "glass-3 text-ink" : "text-ink-3 hover:bg-s2 hover:text-ink"
              )}
            >
              {label === "Calendar" ? (
                <DynamicCalendarIcon size={19} active={isActive(href)} />
              ) : (
                <Icon size={19} strokeWidth={isActive(href) ? 2.1 : 1.8} />
              )}
              {href === "/network" && counts.requests > 0 ? <Badge count={counts.requests} /> : null}
              {isActive(href) ? (
                <span className="absolute top-1/2 -left-[17px] h-5 w-[3px] -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,var(--c-acc),var(--c-acc-3))]" />
              ) : null}
            </Link>
          ))}

          {/* Create — the central interaction */}
          <button
            onClick={() => setCreateOpen((o) => !o)}
            aria-label="Create"
            className={cn(
              "press mt-3 flex size-11 cursor-pointer items-center justify-center rounded-2xl text-white transition-transform",
              "[background:linear-gradient(135deg,#7c5cf0,#6258e8_55%,#3d9be9)] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_24px_-6px_rgba(109,92,240,.55)]",
              createOpen && "rotate-45"
            )}
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Link href="/settings" aria-label="Settings" title="Settings"
            className={cn("press flex size-11 items-center justify-center rounded-xl", isActive("/settings") ? "glass-3 text-ink" : "text-ink-3 hover:bg-s2 hover:text-ink")}>
            <Settings size={19} strokeWidth={1.8} />
          </Link>
          <Link href={`/u/${viewer.username}`} aria-label="Your profile" className="press">
            <Avatar name={viewer.name} accent={viewer.accent} avatarUrl={viewer.avatarUrl} roles={viewer.roles} size={38} />
          </Link>
        </div>
      </nav>

      {/* ============ topbar ============ */}
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--c-bg)_66%,transparent)] backdrop-blur-xl md:pl-[74px]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/home" className="press flex items-center gap-2 md:hidden" aria-label="PI home">
            <PiOrb size={32} state="idle" />
          </Link>

          <button
            onClick={() => setPaletteOpen(true)}
            className="glass-1 press flex h-9 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-[color-mix(in_oklab,var(--c-acc)_20%,transparent)] px-3.5 text-left text-[13px] text-ink-3 hover:bg-s2 md:max-w-[250px]"
          >
            <Search size={15} />
            <span className="flex-1">Search PI…</span>
            <kbd className="hidden rounded-md border border-line bg-s1 px-1.5 py-0.5 text-[10px] font-medium sm:block">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Link href="/messages" aria-label="Messages" className={cn("press relative flex size-10 items-center justify-center rounded-xl", isActive("/messages") ? "text-ink" : "text-ink-2 hover:bg-s2 hover:text-ink")}>
              <MessageCircle size={19} strokeWidth={1.8} />
              <Badge count={counts.messages} />
            </Link>
            <Link href="/notifications" aria-label="Notifications" className={cn("press relative flex size-10 items-center justify-center rounded-xl", isActive("/notifications") ? "text-ink" : "text-ink-2 hover:bg-s2 hover:text-ink")}>
              <Bell size={19} strokeWidth={1.8} />
              <Badge count={counts.notifications} />
            </Link>
            <Link href="/calendar" aria-label="Calendar" className={cn("press relative flex size-10 items-center justify-center rounded-xl", isActive("/calendar") ? "text-ink" : "text-ink-2 hover:bg-s2 hover:text-ink")}>
              <DynamicCalendarIcon size={19} active={isActive("/calendar")} />
            </Link>
            <Link href="/vault" aria-label="PI Vault" className={cn("press relative flex size-10 items-center justify-center rounded-xl", isActive("/vault") ? "text-ink" : "text-ink-2 hover:bg-s2 hover:text-ink")}>
              <Vault size={18} strokeWidth={1.8} />
            </Link>

            <div className="relative">
              <button onClick={() => setUserMenu((o) => !o)} aria-label="Account" className="press ml-0.5 cursor-pointer rounded-full">
                <Avatar name={viewer.name} accent={viewer.accent} avatarUrl={viewer.avatarUrl} roles={viewer.roles} size={34} badgeSize={15} />
              </button>
              {userMenu ? createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9998] bg-[color-mix(in_oklab,var(--c-bg)_38%,transparent)] backdrop-blur-[7px]"
                    style={{ cursor: "default" }}
                    onClick={() => setUserMenu(false)}
                  />
                  <div
                    className="anim-scale-in glass-4 fixed right-4 top-16 z-[9999] w-60 overflow-hidden rounded-2xl p-1.5 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 pt-2.5 pb-2">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{viewer.name}</p>
                      <p className="truncate text-[11.5px] text-ink-3">@{viewer.username}</p>
                    </div>
                    <div className="aurora-line mb-1.5 opacity-60" />
                    <Link href={`/u/${viewer.username}`} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-s2 hover:text-ink">
                      <User size={15} /> Profile
                    </Link>
                    <Link href="/settings" className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-s2 hover:text-ink">
                      <Settings size={15} /> Settings
                    </Link>
                    <button onClick={toggleTheme} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-s2 hover:text-ink">
                      {viewer.theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
                      {viewer.theme === "light" ? "Midnight mode" : "Pearl mode"}
                    </button>
                    <div className="aurora-line mt-1.5 mb-1 opacity-60" />
                    <form action="/api/auth/logout" method="post">
                      <button type="submit" className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-danger hover:bg-[color-mix(in_oklab,var(--c-danger)_10%,transparent)]">
                        <LogOut size={15} /> Sign out
                      </button>
                    </form>
                  </div>
                </>,
                document.body
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* ============ content ============ */}
      <main className={cn("relative mx-auto w-full max-w-6xl px-4 pt-6 md:pl-[calc(74px+1.5rem)] md:pr-6 md:pb-12", isActive("/messages") ? "pb-2" : "pb-28")}>
        {children}
      </main>

      {/* ============ mobile bottom nav — 5 fixed tabs, hidden on messages ============ */}
      <nav className={cn("fixed right-0 bottom-0 left-0 z-50 border-t border-line bg-[color-mix(in_oklab,var(--c-bg)_82%,transparent)] backdrop-blur-xl md:hidden", isActive("/messages") && "hidden")} aria-label="Mobile">
        <div className="mx-auto flex h-14 max-w-md items-center justify-around px-1">
          {[
            { href: "/home", icon: Home, label: "Home" },
            { href: "/insights", icon: Sparkles, label: "Insights" },
            { href: "/network", icon: Waypoints, label: "Network", badge: counts.requests },
            { href: "/opportunities", icon: Compass, label: "Careers" },
            { href: "/communities", icon: Users, label: "Groups" },
          ].map(({ href, icon: Icon, label, badge }) => (
            <Link key={href} href={href} aria-label={label}
              className={cn("press relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1", isActive(href) ? "text-ink" : "text-ink-3")}>
              <Icon size={19} strokeWidth={isActive(href) ? 2.1 : 1.7} />
              <span className="text-[9px] font-medium">{label}</span>
              {badge ? <Badge count={badge} /> : null}
            </Link>
          ))}
        </div>
      </nav>

      {/* ============ radial create menu ============ */}
      {createOpen ? (
        <>
          <div className="anim-fade fixed inset-0 z-[60] bg-[color-mix(in_oklab,var(--c-bg)_35%,transparent)] backdrop-blur-[5px] cursor-default" onClick={() => setCreateOpen(false)} />
          <div className="anim-scale-in glass-4 fixed bottom-24 left-1/2 z-[61] w-[min(92vw,380px)] -translate-x-1/2 rounded-3xl p-2.5 md:bottom-auto md:top-1/2 md:left-[calc(50%+37px)] md:-translate-y-1/2">
            <p className="px-3 pt-2 pb-1.5 text-[10.5px] font-semibold tracking-[0.16em] text-ink-3 uppercase">Create</p>
            <div className="grid grid-cols-2 gap-1">
              {CREATE_ITEMS.map(({ kind, label, desc, icon: Icon }, i) => (
                <button
                  key={kind}
                  onClick={() => {
                    setCreateOpen(false);
                    setComposer(kind);
                  }}
                  className="anim-in press flex cursor-pointer items-start gap-3 rounded-2xl p-3 text-left hover:bg-s2"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-s3 text-ink">
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">{label}</span>
                    <span className="block text-[11px] text-ink-3">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {composer ? <ComposerModal open onClose={() => setComposer(null)} kind={composer} /> : null}
    </div>
  );
}

export function AppShell(props: { viewer: ShellViewer; counts: Counts; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner {...props} />
    </ToastProvider>
  );
}
