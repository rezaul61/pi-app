import { PiOrb } from "@/components/pi/orb";

export default function AppLoading() {
  return (
    <div className="flex min-h-[52dvh] flex-col items-center justify-center gap-8">
      <PiOrb size={84} state="loading" />
      <p className="text-[12px] font-medium tracking-[0.22em] text-ink-3 uppercase">Loading</p>
    </div>
  );
}
