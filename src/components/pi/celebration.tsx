"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Trophy } from "lucide-react";
import { PiOrb } from "./orb";

export function Celebration({ 
  onComplete, 
  title = "Congratulations!", 
  subtitle = "Your milestone has been shared with the network." 
}: { 
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Background Dim */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] anim-fade" />
      
      {/* Radiant Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full opacity-40 blur-[100px]"
        style={{ background: 'radial-gradient(circle, var(--c-acc), var(--c-acc-3), transparent)' }} />

      {/* Floating Particles (Simulated with CSS) */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute size-1 rounded-full bg-white anim-in"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            boxShadow: '0 0 10px white',
            animation: `pi-float ${3 + Math.random() * 5}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Main Content Card */}
      <div className="anim-in-up glass-4 p-10 rounded-[40px] flex flex-col items-center text-center max-w-sm border-2 border-acc/30 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        <div className="relative mb-6">
          <PiOrb size={120} state="verifying" />
          <div className="absolute -top-2 -right-2 bg-acc rounded-full p-2 text-white shadow-lg anim-scale-in">
            <Trophy size={24} />
          </div>
        </div>
        
        <h2 className="track-heading text-[28px] font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="text-acc" size={24} />
          {title}
          <Sparkles className="text-acc" size={24} />
        </h2>
        <p className="text-[15px] text-white/80 leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-8 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="size-1.5 rounded-full bg-signal anim-fade" 
              style={{ animationDelay: `${i * 0.1}s`, animationIterationCount: 'infinite' }} />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
