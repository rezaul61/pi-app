"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, Globe2, Plus, Users2, X, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/pi/modal";
import { Celebration } from "@/components/pi/celebration";
import { Button, Chip, Field, Input, Textarea } from "@/components/pi/primitives";
import { useToast } from "@/components/pi/toast";
import { createPostAction } from "@/server/actions/posts";
import { cn } from "@/lib/utils";

const KIND_META: Record<string, { label: string; placeholder: string; title?: string; celebrate?: boolean }> = {
  post: { label: "Post", placeholder: "Share an idea, a question, a finding…" },
  achievement: { label: "Achievement", placeholder: "What is your success? Give some details...", title: "Achievement title", celebrate: true },
  publication: { label: "Publication", placeholder: "What did you publish? Briefly explain the findings...", title: "Publication title", celebrate: true },
  job: { label: "New Job", placeholder: "Tell us about your new role...", title: "New position", celebrate: true },
  article: { label: "Article", placeholder: "Write your article…", title: "Article title" },
  research: { label: "Research Update", placeholder: "What did you discover? Methods, data, next steps…", title: "Study or project name (optional)" },
  project: { label: "Project", placeholder: "What are you building? Who would you love to collaborate with?", title: "Project name" },
  event: { label: "Event", placeholder: "Describe the event — agenda, speakers, who should attend…", title: "Event title" },
  poll: { label: "Poll", placeholder: "Ask the network a question…" },
};

export function ComposerModal({
  open,
  onClose,
  kind: initialKind,
  communityId,
}: {
  open: boolean;
  onClose: () => void;
  kind: string;
  communityId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "network">("public");
  const [tags, setTags] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [eventAt, setEventAt] = useState("");
  const [eventLoc, setEventLoc] = useState("");
  const [eventOnline, setEventOnline] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = KIND_META[kind] ?? KIND_META.post;
  const needsTitle = kind === "article" || kind === "event" || kind === "project";

  const reset = () => {
    setTitle(""); setContent(""); setTags(""); setPollOptions(["", ""]);
    setEventAt(""); setEventLoc(""); setError(null);
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await createPostAction({
      kind,
      title,
      content,
      visibility,
      tags: tags.split(/[,\s]+/).filter(Boolean),
      communityId,
      mediaUrl: mediaUrls[0],
      meta: mediaUrls.length > 0 ? { mediaUrls } : undefined,
      pollOptions: kind === "poll" ? pollOptions : undefined,
      event: kind === "event" ? { startsAt: eventAt, location: eventLoc, online: eventOnline } : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message ?? "Could not publish.");
      return;
    }
    if (meta.celebrate) {
      setCelebrating(true);
    } else {
      toast(
        kind === "poll" ? "Poll published" : kind === "event" ? "Event announced" : "Published to your network",
        "success"
      );
      reset();
      onClose();
    }
    router.refresh();
  };

  return (
    <>
    {celebrating && (
      <Celebration 
        title={kind === "job" ? "New Milestone!" : "Achievement Shared!"}
        subtitle={kind === "job" ? "Your network is cheering for your new role." : "Your milestone has been shared with the community."}
        onComplete={() => {
          setCelebrating(false);
          reset();
          onClose();
        }}
      />
    )}
    <Modal open={open} onClose={onClose} title={`Create — ${meta.label}`} wide>
      {/* kind switcher */}
      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-0.5">
        {Object.entries(KIND_META).map(([k, m]) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              "press cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium whitespace-nowrap",
              k === kind
                ? "border-[color-mix(in_oklab,var(--c-acc)_50%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_14%,transparent)] text-ink"
                : "border-line text-ink-2 hover:text-ink"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {needsTitle || kind === "research" ? (
          <Field label={meta.title ?? KIND_META.article.title!}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A precise, honest title" maxLength={140} />
          </Field>
        ) : null}

        <Field label={kind === "poll" ? "Question" : "Content"}>
          <Textarea
            autoFocus
            rows={kind === "post" || kind === "poll" ? 4 : 7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={meta.placeholder}
          />
        </Field>

        {kind === "poll" ? (
          <Field label="Options" hint={`${pollOptions.length}/5`}>
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => setPollOptions((o) => o.map((x, xi) => (xi === i ? e.target.value : x)))}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                  />
                  {pollOptions.length > 2 ? (
                    <button
                      onClick={() => setPollOptions((o) => o.filter((_, xi) => xi !== i))}
                      className="press cursor-pointer rounded-lg p-2 text-ink-3 hover:bg-s2 hover:text-ink"
                      aria-label="Remove option"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
              {pollOptions.length < 5 ? (
                <Button variant="ghost" size="sm" onClick={() => setPollOptions((o) => [...o, ""])}>
                  <Plus size={14} /> Add option
                </Button>
              ) : null}
            </div>
          </Field>
        ) : null}

        {kind === "event" ? (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Date & time">
              <Input type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={eventLoc} onChange={(e) => setEventLoc(e.target.value)} placeholder="City or platform" />
            </Field>
            <button
              onClick={() => setEventOnline((v) => !v)}
              className={cn(
                "press flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium sm:col-span-2",
                eventOnline ? "border-[color-mix(in_oklab,var(--c-acc)_45%,transparent)] bg-[color-mix(in_oklab,var(--c-acc)_10%,transparent)] text-ink" : "border-line text-ink-2"
              )}
            >
              {eventOnline ? <Globe2 size={15} /> : <CalendarDays size={15} />}
              {eventOnline ? "Online event" : "In-person event"}
            </button>
          </div>
        ) : null}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Topics" hint="space or comma separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="astrobiology, ml, pedagogy" />
          </Field>
          <Field label="Visibility">
            <div className="glass-1 flex rounded-xl p-1">
              {(
                [
                  { v: "public", label: "Everyone", icon: Globe2 },
                  { v: "network", label: "My network", icon: Users2 },
                ] as const
              ).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "press flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-medium",
                    visibility === v ? "seg-active text-ink" : "text-ink-2"
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {error ? (
          <p className="anim-shake rounded-xl border border-[color-mix(in_oklab,var(--c-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--c-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-line mt-4">
          <div className="flex gap-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || busy || mediaUrls.length >= 6}
              title="Add photo, video, or PDF"
              className="press flex items-center gap-1.5 justify-center h-9 px-3 rounded-xl bg-s1 text-[12px] font-medium text-ink-2 hover:bg-s2 hover:text-ink cursor-pointer"
            >
              <ImageIcon size={15} /> Media / PDF
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,application/pdf" 
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                setUploading(true);
                try {
                  const newUrls = [...mediaUrls];
                  for (let i = 0; i < files.length; i++) {
                    if (newUrls.length >= 6) break;
                    const fd = new FormData();
                    fd.set("file", files[i]);
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (data.url) newUrls.push(data.url);
                    else toast(data.error ?? "Upload failed", "error");
                  }
                  setMediaUrls(newUrls);
                } catch {
                  toast("Upload failed", "error");
                }
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          </div>
          <Button onClick={submit} loading={busy || uploading} size="lg">
            Publish
          </Button>
        </div>

        {mediaUrls.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 no-scrollbar">
            {mediaUrls.map((url, idx) => (
              <div key={url} className={cn("relative shrink-0 overflow-hidden border border-line rounded-xl", url.endsWith(".pdf") ? "w-36 h-14" : "size-16")}>
                {url.endsWith(".pdf") ? (
                  <div className="flex h-full items-center gap-2 px-2 bg-s2">
                    <FileText size={18} className="text-acc shrink-0" />
                    <span className="text-[10.5px] font-medium text-ink truncate">PDF</span>
                  </div>
                ) : url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => setMediaUrls(urls => urls.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
    </>
  );
}
