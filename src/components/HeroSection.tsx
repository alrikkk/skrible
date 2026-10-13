import React, { useRef } from "react";
import { History, RefreshCw, Sparkles, Mic, FileText, Utensils, ArrowRight, User, LogOut, Paintbrush } from "lucide-react";
import { motion } from "motion/react";
import { ScribbleLogo } from "./ScribbleLogo";
import { ThemeToggle } from "./ThemeToggle";
import { PRESET_SAMPLES } from "../data/presets";
import { PresetSample } from "../types";

interface HeroSectionProps {
  historyCount: number;
  onOpenHistory: () => void;
  onReset: () => void;
  onStart: () => void;
  onLogin?: () => void;
  currentUser?: { name: string; email?: string; avatar?: string; provider?: string } | null;
  onSignOut?: () => void;
  onSelectPreset?: (preset: PresetSample) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onReplayIntro?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  historyCount,
  onOpenHistory,
  onReset,
  onStart,
  onLogin,
  currentUser,
  onSignOut,
  onSelectPreset,
  isDark = false,
  onToggleTheme,
  onReplayIntro,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full bg-[#FAF8F5] border-b border-black/10 pt-6 pb-12 px-4 sm:px-8 relative overflow-hidden">
      
      {/* Background Dotted Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none hero-dots"
        style={{
          backgroundImage: "radial-gradient(#000000 0.75px, transparent 0.75px)",
          backgroundSize: "20px 20px"
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between pb-8 mb-6 border-b border-black/10">
          
          {/* Lowercase Wordmark "skrible" */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onReset}
              className="group flex items-center gap-2 text-left cursor-pointer focus:outline-none"
              title="skrible home"
            >
              <ScribbleLogo className="h-12 sm:h-14 w-auto text-black dark:text-white group-hover:scale-105 transition-transform" />
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black dark:text-white font-sans lowercase hover:text-[#ec4899] dark:hover:text-[#ec4899] transition-colors">
                skrible
              </span>
            </button>
            <span className="text-xs font-medium text-black/50 ml-2 hidden sm:inline-block">
              / student note & meal untangler
            </span>
          </div>

          {/* Clean minimal actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

            {/* Replay Opening Paint Animation */}
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black dark:text-white bg-white dark:bg-[#2a2a2a] hover:bg-pink-50 dark:hover:bg-pink-950/30 border border-black/20 dark:border-white/20 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95 hover:border-pink-500"
                title="Replay opening paint animation"
              >
                <Paintbrush className="w-3.5 h-3.5 text-[#FF90E8]" />
                <span className="hidden sm:inline">paint intro</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black bg-white hover:bg-black/5 border border-black/20 rounded-lg transition-all cursor-pointer active:scale-95"
              title="Clear all inputs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">reset</span>
            </button>

            {/* Saved Vault Button with count */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black dark:text-white bg-white dark:bg-[#2a2a2a] hover:bg-black/5 dark:hover:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95 hover:border-amber-500"
              title="Open saved vault items"
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>vault ({historyCount})</span>
            </button>

            {/* User Profile or Sign In Button */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#2a2a2a] hover:bg-stone-100 dark:hover:bg-[#333333] border border-black/15 dark:border-white/20 rounded-lg text-xs font-medium shadow-2xs cursor-pointer transition-all active:scale-95 text-black dark:text-white"
                  title="User Account Options"
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-mono font-semibold max-w-[100px] truncate">{currentUser.name}</span>
                </button>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="p-1.5 bg-white dark:bg-[#2a2a2a] hover:bg-red-50 text-black/50 hover:text-red-600 border border-black/15 dark:border-white/20 rounded-lg transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin || onStart}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-indigo-600 rounded-lg transition-all shadow-sm cursor-pointer active:scale-95"
                title="Sign In to account"
              >
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Section Copy */}
        <div className="max-w-2xl mb-10 pt-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-black leading-[1.1] mb-4">
            Untangle lectures, notes, and dorm meals.
          </h1>

          <p className="text-base sm:text-lg text-black/70 leading-relaxed mb-6 font-normal">
            Turn long lecture recordings, whiteboard notes, and leftover groceries into structured study guides, flashcard decks, and budget-friendly recipes.
          </p>

          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-semibold text-sm rounded-lg transition-all shadow-sm cursor-pointer group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* SCATTERED DESK CANVAS / CORKBOARD ARTWORK */}
        <div 
          ref={containerRef}
          className="relative w-full min-h-0 md:min-h-[460px] bg-white/60 border border-black/10 rounded-2xl p-4 sm:p-8 backdrop-blur-xs shadow-xs overflow-hidden"
        >
          
          {/* Subtle background texture lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Grid Hint Bar */}
          <div className="flex items-center justify-end text-xs text-black/40 select-none mb-4 md:mb-0 relative z-20 pointer-events-none">
            <span className="hidden lg:inline text-black/35 font-normal">Interactive preview · Click and drag to arrange cards</span>
          </div>

          {/* CARDS CONTAINER */}
          <div className="grid grid-cols-1 md:block gap-4 relative z-10">

            {/* OBJECT 1: Voice Memo Phone Screen (Zone 1: Top Left) */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.02, zIndex: 40 }}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className="relative md:absolute md:top-8 md:left-6 w-full md:w-60 bg-black text-white p-3.5 rounded-xl shadow-md cursor-grab active:cursor-grabbing select-none touch-none transform-gpu will-change-transform border border-white/10"
            >
              {/* Phone Speaker & Camera notch */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
              
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Mic className="w-3 h-3 text-cyan-400" /> VOICE MEMO
                </span>
                <span className="font-mono text-[10px]">01:24:12</span>
              </div>

              <p className="text-xs font-semibold text-white truncate mb-2">
                Bio_101_Cell_Respiration_Prof.mp3
              </p>

              {/* Audio Waveform Bars */}
              <div className="flex items-end justify-between h-8 gap-1 bg-white/10 p-1.5 rounded-lg mb-2">
                {[40, 75, 30, 90, 60, 100, 45, 80, 25, 95, 70, 50, 85, 40, 65].map((h, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1 rounded-full ${idx % 3 === 0 ? "bg-cyan-400" : "bg-white/80"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                <span>skrible untangling...</span>
                <span className="text-cyan-400 font-bold">88%</span>
              </div>

              {onSelectPreset && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = PRESET_SAMPLES.find((item) => item.id === "econ-voice-note");
                    if (p) onSelectPreset(p);
                  }}
                  className="mt-2 w-full py-1.5 px-2 bg-cyan-500/20 hover:bg-cyan-600 text-white font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                >
                  <span>try voice memo scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>

            {/* OBJECT 5: Triple T Dorm Mascot Polaroid (Zone 2: Top Center) */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.02, zIndex: 45 }}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className="relative md:absolute md:top-6 md:left-1/2 md:-translate-x-1/2 w-full md:w-52 bg-white p-2.5 pt-3 rounded-xl shadow-md border border-black/10 cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden z-30"
            >
              {/* Photo Frame Container */}
              <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-lg overflow-hidden border border-black/10 shadow-inner group">
                {/* Static Mascot Image Asset */}
                <img 
                  src="/assets/images.jpeg" 
                  alt="Triple T Dorm Mascot" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Photo Caption */}
              <div className="pt-2 text-center">
                <p className="text-xs font-mono font-bold text-black tracking-tight">
                  Triple T
                </p>
                <p className="text-[10px] font-sans text-gray-500 italic mt-0.5">
                  Dorm Mascot
                </p>
              </div>
            </motion.div>

            {/* OBJECT 2: Clean Yellow Study Note (Zone 3: Top Right) */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.02, zIndex: 40 }}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className="relative md:absolute md:top-8 md:right-6 w-full md:w-64 bg-[#FEF9C3] text-black p-4 rounded-xl shadow-md border border-yellow-300/80 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              {/* Sticky note header */}
              <div className="flex items-center justify-between border-b border-yellow-600/20 pb-1.5 mb-2.5">
                <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-700" /> CHEM LECTURE
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-800/70">OCT 14</span>
              </div>

              <div className="space-y-1.5 text-xs text-amber-950 font-medium leading-snug">
                <p className="font-semibold text-black">
                  • Glycolysis produces <mark className="bg-emerald-200/60 text-emerald-950 px-1 py-0.5 rounded font-bold">2 ATP + 2 NADH</mark>
                </p>
                <p className="text-amber-900/80">
                  • Krebs Cycle occurs inside mitochondrial matrix
                </p>
                <p className="text-emerald-800 font-sans text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <span>→ Skrible generated 12 cram cards</span>
                </p>
              </div>

              {onSelectPreset && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = PRESET_SAMPLES.find((item) => item.id === "ochem-whiteboard");
                    if (p) onSelectPreset(p);
                  }}
                  className="mt-3 w-full py-1.5 px-2 bg-emerald-700/15 hover:bg-emerald-700 hover:text-white text-emerald-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                >
                  <span>try o-chem scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>

            {/* OBJECT 3: Crumpled Receipt (Zone 4: Bottom Left) */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.02, zIndex: 40 }}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className="relative md:absolute md:bottom-12 md:left-8 w-full md:w-56 bg-white text-black p-3.5 rounded-xl shadow-md border border-neutral-200 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              <div className="text-center border-b border-dashed border-gray-300 pb-2 mb-2">
                <p className="text-[10px] font-mono font-bold text-gray-700 tracking-widest uppercase">
                  CAMPUS GROCERY RECEIPT
                </p>
                <p className="text-[9px] font-mono text-gray-400">3 ITEMS • $4.50 TOTAL</p>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-gray-600 mb-2">
                <div className="flex justify-between">
                  <span>1x EGGS (6-PACK)</span>
                  <span>$1.80</span>
                </div>
                <div className="flex justify-between">
                  <span>2x INSTANT RAMEN</span>
                  <span>$1.20</span>
                </div>
                <div className="flex justify-between">
                  <span>1x CHEDDAR SLICE</span>
                  <span>$1.50</span>
                </div>
              </div>

              {/* Stamp */}
              <div className="mt-2 pt-1.5 border-t border-dashed border-gray-300 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded">
                  DORM CHEF
                </span>
                <span className="text-[10px] font-mono text-teal-700 font-bold">
                  RAMEN CARBONARA
                </span>
              </div>

              {onSelectPreset && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = PRESET_SAMPLES.find((item) => item.id === "target-receipt");
                    if (p) onSelectPreset(p);
                  }}
                  className="mt-2.5 w-full py-1.5 px-2 bg-teal-700/10 hover:bg-teal-700 hover:text-white text-teal-950 font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                >
                  <span>try receipt scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>

            {/* OBJECT 4: Fridge Snap (Zone 5: Bottom Right) */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.02, zIndex: 40 }}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              className="relative md:absolute md:bottom-12 md:right-8 w-full md:w-56 bg-white p-2.5 rounded-xl shadow-md border border-black/10 cursor-grab active:cursor-grabbing select-none touch-none"
            >
              {/* Polaroid photo placeholder */}
              <div className="w-full h-24 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-2 flex flex-col justify-between border border-amber-200/50">
                <div className="flex items-center justify-between text-[10px] font-semibold text-amber-900">
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-orange-600" /> FRIDGE SNAP
                  </span>
                  <span>11:45 PM</span>
                </div>
                <p className="text-xs font-bold text-amber-950 bg-white/90 p-1.5 rounded">
                  "half onion + 2 eggs + Sriracha?"
                </p>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] font-sans font-medium text-black/70">
                  cooked in <span className="text-orange-600 font-bold">8 mins</span> • 0 waste
                </p>
              </div>

              {onSelectPreset && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = PRESET_SAMPLES.find((item) => item.id === "fridge-dorm-chef");
                    if (p) onSelectPreset(p);
                  }}
                  className="mt-2 w-full py-1.5 px-2 bg-orange-600/15 hover:bg-orange-600 hover:text-white text-orange-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                >
                  <span>try fridge scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>

          </div>

        </div>

      </div>
    </div>
  );
};

