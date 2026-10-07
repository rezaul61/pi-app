import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getViewer } from "@/server/session";
import { verifyCsrf } from "@/server/csrf";

/* ============================================================
   PI Storage — local bucket.
   Integration point: swap this handler's body for S3 / Supabase
   Storage while keeping the URL contract (`/uploads/...`).
   ============================================================ */

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/webm": "webm",
  "application/pdf": "pdf",
};
const MAX = 20 * 1024 * 1024;

function hasSignature(bytes: Uint8Array, type: string) {
  const starts = (...signature: number[]) => signature.every((b, i) => bytes[i] === b);
  if (type === "image/png") return starts(0x89, 0x50, 0x4e, 0x47);
  if (type === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (type === "video/mp4") return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
  if (type === "video/webm") return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (type === "audio/webm") return starts(0x1a, 0x45, 0xdf, 0xa3);
  if (type === "audio/mpeg") return starts(0x49, 0x44, 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  return false;
}

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const purpose = form.get("purpose");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported media format." }, { status: 415 });
  const limit = purpose === "profile" ? 4 * 1024 * 1024 : MAX;
  if (file.size > limit) return NextResponse.json({ error: "Media too large." }, { status: 413 });
  if (purpose === "profile" && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Profile media must be an image." }, { status: 415 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasSignature(bytes, file.type)) {
    return NextResponse.json({ error: "The file contents do not match its format." }, { status: 415 });
  }

  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(bytes));

  return NextResponse.json({ url: `/uploads/${name}` });
}
