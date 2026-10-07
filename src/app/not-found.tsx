import Link from "next/link";
import { PiOrb } from "@/components/pi/orb";
import { Button } from "@/components/pi/primitives";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="pi-ambient" aria-hidden />
      <PiOrb size={88} state="calm" tone="calm" />
      <h1 className="track-heading mt-8 text-[22px] font-semibold text-ink">This coordinate doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
        The page you&apos;re looking for moved, was removed, or never made it into this orbit.
      </p>
      <Link href="/home" className="mt-6">
        <Button>Back to your network</Button>
      </Link>
    </div>
  );
}
