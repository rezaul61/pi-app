"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, ExternalLink, FileText, Link2, Plus, StickyNote, Trash2 } from "lucide-react";
import type { VaultItem } from "@/server/services/misc";
import { Button, Chip, EmptyState, Field, Input, Textarea } from "@/components/pi/primitives";
import { Modal } from "@/components/pi/modal";
import { useToast } from "@/components/pi/toast";
import { vaultAddAction, vaultRemoveAction } from "@/server/actions/engagement";
import { cn, timeAgo } from "@/lib/utils";

const KIND_ICON: Record<string, React.ElementType> = {
  note: StickyNote,
  link: Link2,
  post: Bookmark,
};

export function VaultManager({ items }: { items: VaultItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [kind, setKind] = useState<"note" | "link">("note");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).slice(0, 10);
  const filtered = items.filter(
    (i) => (filter === "all" || i.kind === filter) && (!tagFilter || i.tags.includes(tagFilter))
  );

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      const res = await vaultAddAction({
        kind,
        title,
        note,
        url: kind === "link" ? url : undefined,
        tags: tags.split(/[,\s]+/).filter(Boolean).slice(0, 5),
      });
      if (res.ok) {
        toast("Added to your Vault", "success");
        setAddOpen(false);
        setTitle(""); setNote(""); setUrl(""); setTags("");
        router.refresh();
      } else {
        toast(res.message ?? "Could not save", "error");
      }
    });
  };

  return (
    <div>
      {/* controls */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {["all", "note", "link", "post"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "press cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium capitalize",
              filter === f
                ? "border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_12%,transparent)] text-ink"
                : "border-line text-ink-2 hover:text-ink"
            )}
          >
            {f === "all" ? "Everything" : f === "post" ? "Saved posts" : `${f}s`}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-line" />
        {allTags.map((t) => (
          <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className="press cursor-pointer">
            <Chip active={tagFilter === t}>#{t}</Chip>
          </button>
        ))}
        <Button size="sm" className="ml-auto" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> New item
        </Button>
      </div>

      {/* grid of glass archive cards */}
      {filtered.length ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => {
            const Icon = KIND_ICON[item.kind] ?? FileText;
            return (
              <div key={item.id} className="anim-in-up group glass-2 hover-lift flex flex-col rounded-2xl p-4" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-s3 text-ink-2">
                    <Icon size={15} />
                  </span>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await vaultRemoveAction(item.id);
                        toast("Removed from Vault", "info");
                        router.refresh();
                      })
                    }
                    aria-label="Remove item"
                    className="press cursor-pointer rounded-lg p-1.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-s2 hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="mt-3 text-[13.5px] leading-snug font-semibold text-ink">{item.title}</p>
                {item.note ? <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-ink-2">{item.note}</p> : null}
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 truncate text-[12px] text-acc pi-link w-fit">
                    {item.url.replace(/^https?:\/\//, "").slice(0, 42)} <ExternalLink size={11} />
                  </a>
                ) : null}
                {item.postId ? (
                  <Link href={`/post/${item.postId}`} className="mt-2 text-[12px] font-medium text-acc pi-link w-fit">
                    View saved post →
                  </Link>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((t) => (
                      <Chip key={t}>#{t}</Chip>
                    ))}
                  </div>
                  <span className="text-[10.5px] text-ink-3 tnum">{timeAgo(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-2 rounded-2xl">
          <EmptyState
            title={items.length ? "Nothing matches these filters" : "Your knowledge library is empty."}
            body={items.length ? undefined : "Save useful posts, notes and links — PI keeps them organized with smart tags."}
            action={!items.length ? <Button onClick={() => setAddOpen(true)}>Save something useful</Button> : undefined}
          />
        </div>
      )}

      {/* add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add to PI Vault">
        <div className="space-y-3.5">
          <div className="glass-1 flex rounded-xl p-1">
            {(["note", "link"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "press flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-medium capitalize",
                  kind === k ? "seg-active text-ink" : "text-ink-2"
                )}
              >
                {k === "note" ? <StickyNote size={13} /> : <Link2 size={13} />} {k}
              </button>
            ))}
          </div>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this?" maxLength={90} autoFocus />
          </Field>
          {kind === "link" ? (
            <Field label="URL">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" type="url" />
            </Field>
          ) : null}
          <Field label="Note">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why it matters, key insight…" />
          </Field>
          <Field label="Tags" hint="space or comma separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ml, pedagogy, ideas" />
          </Field>
          <div className="flex justify-end pt-1">
            <Button onClick={submit} loading={pending} disabled={!title.trim()}>
              Save to Vault
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
