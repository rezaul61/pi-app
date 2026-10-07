import { cn } from "@/lib/utils";

export type PiOrbState =
  | "idle"
  | "loading"
  | "searching"
  | "analyzing"
  | "verifying"
  | "synchronizing"
  | "done"
  | "calm";

type Tone = "aurora" | "signal" | "calm";

type OrbCfg = {
  speed1: string;
  speed2: string;
  speed3: string;
  sphereGlow: string;
};

const ORB: Record<PiOrbState, OrbCfg> = {
  idle: {
    speed1: "12s", speed2: "15s", speed3: "10s",
    sphereGlow: "0 4px 16px rgba(79, 70, 229, 0.4)",
  },
  loading: {
    speed1: "4s", speed2: "5s", speed3: "3.5s",
    sphereGlow: "0 4px 20px rgba(79, 70, 229, 0.6)",
  },
  searching: {
    speed1: "3s", speed2: "4s", speed3: "2.5s",
    sphereGlow: "0 4px 24px rgba(34, 211, 238, 0.5)",
  },
  analyzing: {
    speed1: "5s", speed2: "6s", speed3: "4s",
    sphereGlow: "0 4px 20px rgba(167, 139, 250, 0.6)",
  },
  verifying: {
    speed1: "6s", speed2: "7s", speed3: "5s",
    sphereGlow: "0 4px 24px rgba(61, 218, 180, 0.6)",
  },
  synchronizing: {
    speed1: "4s", speed2: "4s", speed3: "4s",
    sphereGlow: "0 4px 16px rgba(99, 102, 241, 0.5)",
  },
  done: {
    speed1: "15s", speed2: "18s", speed3: "14s",
    sphereGlow: "0 4px 24px rgba(61, 218, 180, 0.6)",
  },
  calm: {
    speed1: "20s", speed2: "24s", speed3: "18s",
    sphereGlow: "0 4px 12px rgba(129, 140, 248, 0.3)",
  },
};

export function PiOrb({
  size = 72,
  label,
  tone = "aurora",
  state = "idle",
  className,
}: {
  size?: number;
  label?: string;
  tone?: Tone;
  state?: PiOrbState;
  className?: string;
}) {
  const cfg = ORB[state];
  const piSize = Math.round(size * 0.42);
  const sphereSize = Math.round(size * 0.55);
  
  const isSignal = tone === "signal" || state === "done" || state === "verifying";
  const sphereBg = isSignal 
    ? "radial-gradient(circle at 35% 25%, #3ddab4, #14b8a6 50%, #064e3b)" 
    : tone === "calm"
      ? "radial-gradient(circle at 35% 25%, #818cf8, #4f46e5 50%, #1e1b4b)"
      : "radial-gradient(circle at 35% 25%, #a78bfa, #4f46e5 60%, #312e81)";
  
  const glow = isSignal ? ORB.verifying.sphereGlow : tone === "calm" ? ORB.calm.sphereGlow : cfg.sphereGlow;
  
  // Orbit geometry — uses CSS vars so dark/light mode adapts automatically
  // Dark mode: white/violet gradient glow on orbits
  // Light mode: green/teal gradient glow on orbits
  const ringBorder = "1.2px solid var(--orb-ring-color, color-mix(in oklab, var(--c-acc-3) 50%, transparent))";
  const ringShadow = "0 0 8px var(--orb-ring-glow, color-mix(in oklab, var(--c-acc-3) 30%, transparent)), 0 0 16px var(--orb-ring-glow-outer, transparent)";
  const particleSizeW = Math.max(4, size * 0.09);
  const particleSizeH = Math.max(2, size * 0.045);
  const particleClass = "absolute top-0 left-1/2 rounded-full bg-[var(--orb-particle)] shadow-[0_0_8px_var(--orb-particle),0_0_14px_var(--orb-particle-outer)]";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size, perspective: size * 4 }}
      role={label ? "status" : undefined}
      aria-label={label}
    >
      {/* 3D Orbits Container */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        
        {/* Orbit 1 */}
        <div className="absolute inset-0" style={{ transform: "rotateX(70deg) rotateY(25deg)", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 rounded-full" style={{ border: ringBorder, boxShadow: ringShadow, animation: `pi-spin-z ${cfg.speed1} linear infinite` }}>
             <div className={particleClass} style={{ width: particleSizeW, height: particleSizeH, transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
        
        {/* Orbit 2 */}
        <div className="absolute inset-0" style={{ transform: "rotateX(70deg) rotateY(-40deg)", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 rounded-full" style={{ border: ringBorder, boxShadow: ringShadow, animation: `pi-spin-z-rev ${cfg.speed2} linear infinite` }}>
             <div className={particleClass} style={{ width: particleSizeW, height: particleSizeH, transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
        
        {/* Orbit 3 */}
        <div className="absolute inset-0" style={{ transform: "rotateX(70deg) rotateY(85deg)", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 rounded-full" style={{ border: ringBorder, boxShadow: ringShadow, animation: `pi-spin-z ${cfg.speed3} linear infinite` }}>
             <div className={particleClass} style={{ width: particleSizeW, height: particleSizeH, transform: "translate(-50%, -50%)" }} />
          </div>
        </div>

      </div>

      {/* Solid 3D Center Sphere */}
      <div 
        className="absolute rounded-full flex items-center justify-center overflow-hidden" 
        style={{ 
          width: sphereSize, 
          height: sphereSize,
          background: sphereBg,
          boxShadow: `inset -2px -4px 10px rgba(0,0,0,0.4), inset 2px 2px 8px rgba(255,255,255,0.3), ${glow}`
        }}
      >
        <span
          className="relative font-serif italic leading-none text-white select-none"
          style={{ fontSize: piSize, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          π
        </span>
      </div>

      {label ? (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-wide text-ink-3 whitespace-nowrap">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function PiMark({ size = 34, state = "idle", className }: { size?: number; state?: PiOrbState; className?: string }) {
  return <PiOrb size={size} state={state} className={className} />;
}

export function PiOrbInline({ label = "Loading", state = "loading" }: { label?: string; state?: PiOrbState }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm text-ink-2">
      <PiOrb size={26} state={state} />
      <span>{label}</span>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-ink-3 anim-fade"
            style={{ animation: `pi-fade 1s ease-in-out ${i * 0.18}s infinite alternate` }}
          />
        ))}
      </span>
    </span>
  );
}
