import React, { useRef } from "react";
import { History, RefreshCw, Sparkles, Mic, FileText, Utensils, ArrowDownRight } from "lucide-react";
import { motion } from "motion/react";

interface HeroSectionProps {
  historyCount: number;
  onOpenHistory: () => void;
  onReset: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  historyCount,
  onOpenHistory,
  onReset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full bg-[#FAF8F5] border-b border-black/10 pt-6 pb-12 px-4 sm:px-8 relative overflow-hidden">
      
      {/* Background Dotted Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
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
              className="group flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
              title="skrible home"
            >
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black font-sans lowercase hover:text-[#ec4899] transition-colors">
                skrible
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block animate-pulse" />
            </button>
            <span className="text-xs font-medium text-black/50 ml-2 hidden sm:inline-block">
              / student note & meal untangler
            </span>
          </div>

          {/* Clean minimal actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black bg-white hover:bg-black/5 border border-black/20 rounded-lg transition-all cursor-pointer"
              title="Clear all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>reset</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-[#ec4899] rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>saved vault ({historyCount})</span>
            </button>
          </div>
        </div>

        {/* Hero Section Copy */}
        <div className="max-w-2xl mb-10 pt-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ec4899]/10 text-[#ec4899] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>messy thoughts in → clean notes & recipes out</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-black lowercase leading-[1.1] mb-4">
            untangle your messy student life.
          </h1>

          <p className="text-base sm:text-lg text-black/70 leading-relaxed">
            turn chaotic 2-hour lecture audio, scribbled notes, and random dorm fridge leftovers into clean summaries, study decks, and $5 survival recipes.
          </p>
        </div>

        {/* SCATTERED DESK CANVAS / CORKBOARD ARTWORK */}
        <div 
          ref={containerRef}
          className="relative w-full min-h-0 md:min-h-[460px] bg-white/60 border border-black/10 rounded-2xl p-4 sm:p-8 backdrop-blur-xs shadow-xs overflow-hidden"
        >
          
          {/* Subtle background texture lines */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Doodles / Kaomoji Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-black/50 select-none mb-4 md:mb-0 relative z-20 pointer-events-none">
            <span>(⊃｡•́‿•̀｡)⊃ *zero AI fluff*</span>
            <span className="hidden lg:inline text-black/30">[click & drag cards anywhere inside grid ↘]</span>
            <span>(◕‿◕✿) ~ 3am lecture recording</span>
          </div>

          {/* CARDS CONTAINER */}
          <div className="grid grid-cols-1 md:block gap-4 relative z-10">

            {/* OBJECT 1: Voice Memo Phone Screen */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.04, zIndex: 40 }}
              whileDrag={{ scale: 1.08, zIndex: 50 }}
              className="relative md:absolute md:top-12 md:left-8 w-full md:w-64 bg-black text-white p-3.5 rounded-2xl shadow-md md:shadow-xl cursor-grab active:cursor-grabbing rotate-0 md:-rotate-3 select-none touch-none"
            >
              {/* Phone Speaker & Camera notch */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
              
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Mic className="w-3 h-3 text-[#ec4899]" /> VOICE MEMO
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
                    className={`w-1 rounded-full ${idx % 3 === 0 ? "bg-[#ec4899]" : "bg-white/80"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>skrible untangling...</span>
                <span className="text-[#ec4899] font-bold">88%</span>
              </div>
            </motion.div>

            {/* OBJECT 2: Realistic Yellow Sticky Note Sticker */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.04, zIndex: 40 }}
              whileDrag={{ scale: 1.08, zIndex: 50 }}
              className="relative md:absolute md:top-12 md:right-8 w-full md:w-72 bg-gradient-to-br from-[#FEF9C3] via-[#FFF08A] to-[#FDE047] text-black p-4 pt-5 rounded-b-xs rounded-t-sm shadow-[4px_10px_20px_-3px_rgba(0,0,0,0.15)] border border-yellow-300/90 cursor-grab active:cursor-grabbing rotate-0 md:rotate-4 overflow-hidden select-none touch-none"
            >
              {/* Translucent adhesive tape on top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#ec4899]/35 border-x border-y border-[#ec4899]/50 backdrop-blur-[1px] rotate-1 shadow-2xs pointer-events-none" />

              {/* Sticky note dog-ear corner fold */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-600/20 blur-[1px] [clip-path:polygon(0_100%,100%_0,100%_100%)] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#facc15] shadow-[-1px_-1px_3px_rgba(0,0,0,0.2)] [clip-path:polygon(0_100%,100%_0,100%_100%)] pointer-events-none" />

              {/* Sticky note header */}
              <div className="flex items-center justify-between border-b border-yellow-600/20 pb-1.5 mb-2.5">
                <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#ec4899]" /> CHEM LECTURE
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-800/70">OCT 14</span>
              </div>

              <div className="space-y-1.5 text-xs text-amber-950 font-medium leading-snug">
                <p className="font-semibold text-black">
                  • Glycolysis produces <mark className="bg-[#ec4899]/25 text-black px-1 py-0.5 rounded font-bold">2 ATP + 2 NADH</mark>
                </p>
                <p className="text-amber-900/80">
                  • Krebs Cycle occurs inside mitochondrial matrix
                </p>
                <p className="text-[#be185d] font-sans text-[11px] font-bold mt-1.5 flex items-center gap-1">
                  <span>→ Skrible generated 12 cram cards</span>
                </p>
              </div>
            </motion.div>

            {/* OBJECT 3: Crumpled Receipt */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.04, zIndex: 40 }}
              whileDrag={{ scale: 1.08, zIndex: 50 }}
              className="relative md:absolute md:bottom-10 md:left-12 w-full md:w-60 bg-white text-black p-3.5 rounded-xl md:rounded-sm shadow-md border border-dashed border-gray-300 cursor-grab active:cursor-grabbing rotate-0 md:-rotate-2 select-none touch-none"
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
                <span className="text-[10px] font-mono text-[#ec4899] font-bold">
                  RAMEN CARBONARA
                </span>
              </div>
            </motion.div>

            {/* OBJECT 5: Taped POS RONDA Meme Note */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.05, zIndex: 45 }}
              whileDrag={{ scale: 1.1, zIndex: 50 }}
              className="relative md:absolute md:top-6 md:left-1/2 md:-translate-x-1/2 w-full md:w-64 bg-white p-3 pt-5 rounded-sm shadow-xl border border-black/15 cursor-grab active:cursor-grabbing rotate-0 md:-rotate-2 select-none touch-none overflow-visible z-30"
            >
              {/* Realistic Scotch tape taped on top of the card */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-white/40 border-x border-y border-white/60 shadow-[0_2px_5px_rgba(0,0,0,0.15)] backdrop-blur-[2px] rotate-[-1deg] z-40 pointer-events-none flex items-center justify-center [clip-path:polygon(0_0,95%_2%,100%_100%,3%_98%)]">
                <div className="w-full h-[1px] bg-white/50" />
              </div>

              {/* Photo Frame Container */}
              <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-xs overflow-hidden border border-black/20 shadow-inner group">
                {/* Static Mascot Image Asset */}
                <img 
                  src="/assets/pentung-mascot.svg" 
                  alt="PENTUNG POS RONDA" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />

                {/* Live Badge */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded border border-white/20 flex items-center gap-1 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>3:15 AM NIGHT PATROL</span>
                </div>
              </div>

              {/* Photo Caption */}
              <div className="pt-2 text-center">
                <p className="text-[11px] font-mono font-bold text-black uppercase tracking-tight flex items-center justify-center gap-1">
                  <span>PENTUNG POS RONDA ★</span>
                </p>
                <p className="text-[10px] font-sans text-gray-500 italic mt-0.5">
                  stay awake for 8am exam
                </p>
              </div>
            </motion.div>

            {/* OBJECT 4: Fridge Sticky Note Polaroid */}
            <motion.div 
              drag
              dragConstraints={containerRef}
              dragElastic={0.05}
              whileHover={{ scale: 1.04, zIndex: 40 }}
              whileDrag={{ scale: 1.08, zIndex: 50 }}
              className="relative md:absolute md:bottom-10 md:right-12 w-full md:w-56 bg-white p-2.5 rounded-xl md:rounded shadow-md border border-black/10 cursor-grab active:cursor-grabbing rotate-0 md:rotate-5 select-none touch-none"
            >
              {/* Polaroid photo placeholder */}
              <div className="w-full h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded p-2 flex flex-col justify-between border border-amber-300/50">
                <div className="flex items-center justify-between text-[10px] font-semibold text-amber-900">
                  <span className="flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-[#ec4899]" /> FRIDGE SNAP
                  </span>
                  <span>11:45 PM</span>
                </div>
                <p className="text-xs font-bold text-amber-950 bg-white/80 p-1.5 rounded backdrop-blur-xs">
                  "half onion + 2 eggs + Sriracha?"
                </p>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] font-sans font-medium text-black/70">
                  cooked in <span className="text-[#ec4899] font-bold">8 mins</span> • 0 waste
                </p>
              </div>
            </motion.div>

          </div>

          {/* Bottom Callout Arrow pointing down to input */}
          <div className="mt-6 md:mt-0 relative md:absolute md:bottom-3 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center gap-1.5 bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md z-30 w-fit mx-auto pointer-events-none">
            <span>paste notes, audio, or fridge photos below</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#ec4899] animate-bounce" />
          </div>

        </div>

      </div>
    </div>
  );
};

