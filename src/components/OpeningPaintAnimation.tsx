import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Paintbrush } from "lucide-react";

interface OpeningPaintAnimationProps {
  onComplete: () => void;
  isDark?: boolean;
}

// Ultra-smooth easing curves
const easeOutQuart = [0.25, 1, 0.5, 1] as const;
const easeInOutCubic = [0.65, 0, 0.35, 1] as const;
const easeSmoothSpring = { type: "spring", stiffness: 160, damping: 22 };

export const OpeningPaintAnimation: React.FC<OpeningPaintAnimationProps> = ({
  onComplete,
  isDark = false,
}) => {
  const [phase, setPhase] = useState<"paint-in" | "showcase" | "wipe-out">("paint-in");
  const [isSkipping, setIsSkipping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scribblePathRef = useRef<SVGPathElement>(null);

  // Background and paint palettes
  const palette = isDark
    ? {
        bg: "#0F0F12",
        paintYellow: "#FFE600",
        paintPink: "#FF90E8",
        paintCyan: "#00F5FF",
        paperCard: "#18181F",
        ink: "#FFFFFF",
        inkSecondary: "rgba(255, 255, 255, 0.7)",
        appBg: "#1a1a1a",
      }
    : {
        bg: "#FFF7EB",
        paintYellow: "#FFE600",
        paintPink: "#FF90E8",
        paintCyan: "#00F5FF",
        paperCard: "#FFFFFF",
        ink: "#000000",
        inkSecondary: "rgba(0, 0, 0, 0.7)",
        appBg: "#FAF8F5",
      };

  // Skip handler with smooth exit
  const handleSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setTimeout(() => {
      onComplete();
    }, 220);
  };

  // Keyboard shortcut listener (Escape, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Coordinated timeline for perfectly seamless flow
  useEffect(() => {
    // 0ms - 550ms: Paint ribbons glide smoothly across screen
    // 550ms - 1950ms: Showcase brand logo, scribble drawing & text
    // 1950ms - 2650ms: Smooth organic paint wave sweeps across and seamlessly hands over to app
    const showcaseTimer = setTimeout(() => {
      setPhase("showcase");
    }, 550);

    const wipeTimer = setTimeout(() => {
      setPhase("wipe-out");
    }, 1950);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2650);

    return () => {
      clearTimeout(showcaseTimer);
      clearTimeout(wipeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Measure scribble logo path length for buttery smooth SVG line draw
  useEffect(() => {
    const path = scribblePathRef.current;
    if (!path) return;
    try {
      const length = Math.ceil(path.getTotalLength());
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      // Trigger smooth transition
      requestAnimationFrame(() => {
        path.style.transition = "stroke-dashoffset 1.25s cubic-bezier(0.25, 1, 0.5, 1) 0.3s";
        path.style.strokeDashoffset = "0";
      });
    } catch {
      // Fallback
      path.style.strokeDasharray = "5000";
      path.style.strokeDashoffset = "0";
    }
  }, []);

  // Dynamic canvas paint splatter particles (lightweight & 60fps locked)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for silky frame rates
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    interface Splatter {
      x: number;
      y: number;
      currentR: number;
      targetR: number;
      color: string;
      alpha: number;
      drips: { angle: number; length: number; width: number }[];
    }

    const splatters: Splatter[] = [];
    const colors = [palette.paintYellow, palette.paintPink, palette.paintCyan, palette.ink];
    const centerX = width / 2;
    const centerY = height / 2;

    // Organic splatter clusters radiating from center
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 70 + Math.random() * (Math.min(width, height) * 0.32);
      const dripsCount = Math.floor(Math.random() * 3) + 1;
      const drips = [];
      for (let d = 0; d < dripsCount; d++) {
        drips.push({
          angle: angle + (Math.random() - 0.5) * 0.6,
          length: 8 + Math.random() * 18,
          width: 1.5 + Math.random() * 2,
        });
      }

      splatters.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        currentR: 0,
        targetR: 3 + Math.random() * 9,
        color: colors[i % colors.length],
        alpha: 0.85,
        drips,
      });
    }

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      // Bloom splatters smoothly after paint stroke begins (300ms)
      if (elapsed > 280) {
        const progress = Math.min(1, (elapsed - 280) / 600);
        // Smooth ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        for (const s of splatters) {
          s.currentR = s.targetR * ease;
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;

          // Main drop
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.currentR, 0, Math.PI * 2);
          ctx.fill();

          // Drips
          for (const drip of s.drips) {
            ctx.beginPath();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = drip.width * ease;
            ctx.lineCap = "round";
            ctx.moveTo(s.x, s.y);
            const dx = Math.cos(drip.angle) * drip.length * ease;
            const dy = Math.sin(drip.angle) * drip.length * ease;
            ctx.lineTo(s.x + dx, s.y + dy);
            ctx.stroke();

            // End droplet
            ctx.beginPath();
            ctx.arc(s.x + dx, s.y + dy, (drip.width * ease) / 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [palette]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Opening Paint Animation"
      onClick={handleSkip}
      className={`fixed inset-0 z-99999 flex items-center justify-center overflow-hidden cursor-pointer select-none transition-opacity duration-200 ${
        isSkipping ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundColor: palette.bg,
        willChange: "opacity, transform",
        transform: "translate3d(0, 0, 0)",
      }}
    >
      {/* BACKGROUND SVG PAINT RIBBONS (Hardware-Accelerated Vectors) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <defs>
          {/* Smooth Paint Gradients */}
          <linearGradient id="smoothYellowGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFE600" />
            <stop offset="65%" stopColor="#FFDE21" />
            <stop offset="100%" stopColor="#FFC700" />
          </linearGradient>

          <linearGradient id="smoothPinkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF5CB8" />
            <stop offset="50%" stopColor="#FF90E8" />
            <stop offset="100%" stopColor="#FFB3F0" />
          </linearGradient>

          <linearGradient id="smoothCyanGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>
        </defs>

        {/* Paint Ribbon 1: Top-Left to Right Wide Yellow Brush Swash */}
        <motion.path
          d="M -100,-40 C 200,40 500,20 800,-10 C 950,-25 1100,30 1350,10 L 1350,260 C 1100,290 850,230 600,270 C 350,310 100,240 -100,220 Z"
          fill="url(#smoothYellowGrad)"
          initial={{ x: -300, opacity: 0, scaleY: 0.8 }}
          animate={{
            x: 0,
            opacity: 0.96,
            scaleY: 1,
            transition: { duration: 0.75, ease: easeOutQuart },
          }}
        />

        {/* Paint Ribbon 2: Bottom-Right to Left Hot Pink Roller Stripe */}
        <motion.path
          d="M -100,580 C 200,540 500,620 800,590 C 1000,570 1150,640 1350,610 L 1350,850 L -100,850 Z"
          fill="url(#smoothPinkGrad)"
          initial={{ x: 300, opacity: 0, scaleY: 0.8 }}
          animate={{
            x: 0,
            opacity: 0.92,
            scaleY: 1,
            transition: { duration: 0.8, delay: 0.08, ease: easeOutQuart },
          }}
        />

        {/* Paint Ribbon 3: Vibrant Center Cyan Slash */}
        <motion.path
          d="M -100,380 C 250,330 650,420 950,370 C 1100,350 1250,400 1350,380 L 1350,460 C 1150,480 850,430 550,490 C 250,540 50,470 -100,450 Z"
          fill="url(#smoothCyanGrad)"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: 1,
            opacity: 0.38,
            transition: { duration: 0.65, delay: 0.16, ease: easeOutQuart },
          }}
        />

        {/* Central Canvas Paper Card Backdrop (Organic curved painter's pad) */}
        <motion.path
          d="M 320,240 C 420,210 780,200 880,240 C 980,290 980,520 890,570 C 790,620 410,620 310,570 C 210,520 220,290 320,240 Z"
          fill={palette.paperCard}
          stroke={palette.ink}
          strokeWidth="5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            transition: { duration: 0.55, delay: 0.22, ease: easeOutQuart },
          }}
        />
      </svg>

      {/* Lightweight Canvas Paint Droplets */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* CENTER BRAND SHOWCASE: Scribble Logo + Smooth Scribble Text */}
      <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto pointer-events-none">
        {/* Animated Scribble Logo Container */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 15 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: 0.28, ease: easeOutQuart },
          }}
          className="relative mb-2 flex items-center justify-center"
        >
          {/* Neon Paint Aura behind Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.55, 0.75, 0.55],
              transition: {
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="absolute -inset-5 rounded-full filter blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${palette.paintPink} 0%, ${palette.paintYellow} 55%, transparent 100%)`,
            }}
          />

          {/* SVG Scribble Logo Drawing Path */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 900 650"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer decorative soft paint circle */}
              <circle
                cx="350"
                cy="230"
                r="210"
                fill={palette.paintYellow}
                opacity={0.3}
              />

              {/* Scribble Path with ultra-smooth native CSS stroke-dashoffset drawing */}
              <path
                ref={scribblePathRef}
                stroke={palette.ink}
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  willChange: "stroke-dashoffset",
                }}
                d="M 260 80 C 290 40, 360 40, 390 70 C 430 45, 500 70, 510 120 C 550 145, 560 210, 530 250 C 560 290, 530 350, 480 360 C 450 400, 380 400, 340 370 C 300 400, 230 380, 210 330 C 170 320, 150 250, 180 200 C 150 150, 190 90, 260 80 Z M 240 180 Q 320 110, 420 160 Q 480 200, 440 260 Q 380 320, 280 280 Q 210 240, 260 160 Q 320 120, 450 180 Q 500 230, 430 290 Q 330 330, 240 250 Q 190 190, 290 130 Q 380 100, 460 150 Q 510 210, 420 280 Q 310 320, 230 220 Q 200 150, 310 140 Q 410 130, 470 200 Q 480 270, 390 300 Q 280 300, 220 200 Q 200 130, 330 110 Q 440 110, 480 180 Q 470 250, 360 290 Q 260 290, 230 190 Q 230 130, 360 130 Q 460 140, 450 220 Q 420 280, 310 280 Q 240 260, 260 190 Q 290 150, 400 160 Q 460 170, 430 240 Q 380 290, 280 270 Q 220 230, 280 170 Q 350 130, 430 170 Q 470 210, 410 260 Q 330 290, 260 240 Q 230 200, 320 160 Q 410 150, 450 210 Q 450 260, 370 280 Q 280 270, 250 210 Q 250 160, 360 150 Q 440 170, 410 230 Q 360 270, 290 250 Q 240 220, 300 180 Q 380 160, 420 210 Q 420 250, 340 260 M 230 390 A 24 24 0 1 1 230 389.9 M 180 430 A 18 18 0 1 1 180 429.9 M 135 460 A 13 13 0 1 1 135 459.9"
              />
            </svg>
          </div>
        </motion.div>

        {/* "skrible" Text with Cross-Hatch Texture & Highlighter Swash */}
        <motion.div
          initial={{ y: 16, opacity: 0, scale: 0.94 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.45, delay: 0.45, ease: easeOutQuart },
          }}
          className="relative inline-block"
        >
          {/* Highlighter Brush Swash under the word - smooth horizontal expansion */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: 1,
              transition: { duration: 0.45, delay: 0.6, ease: easeOutQuart },
            }}
            style={{ originX: 0 }}
            className="absolute left-[-5%] right-[-5%] bottom-[12%] h-[42%] -rotate-2 rounded-sm -z-10 bg-gradient-to-r from-[#FFE600] to-[#FF90E8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          />

          {/* SVG Text with Scribble Texture */}
          <div className="relative px-3 py-1">
            <svg
              viewBox="0 0 340 70"
              className="w-56 sm:w-68 md:w-80 h-auto overflow-visible"
              aria-label="skrible"
            >
              <defs>
                <clipPath id="smoothIntroTextClip">
                  <text
                    x="170"
                    y="52"
                    textAnchor="middle"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                    fontSize="58"
                    fontWeight="900"
                    letterSpacing="-1.5px"
                  >
                    skrible
                  </text>
                </clipPath>
                <pattern
                  id="smoothPenScribble"
                  width="14"
                  height="14"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(35)"
                >
                  <line
                    x1="0"
                    y1="3"
                    x2="14"
                    y2="3"
                    stroke={palette.ink}
                    strokeWidth="1.6"
                    opacity="0.55"
                    strokeDasharray="2 3 4 2"
                  />
                  <line
                    x1="0"
                    y1="10"
                    x2="14"
                    y2="10"
                    stroke="#FF90E8"
                    strokeWidth="1.4"
                    opacity="0.65"
                    strokeDasharray="3 2 2 3"
                  />
                </pattern>
              </defs>

              {/* Bold shadow border */}
              <text
                x="173"
                y="55"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                fontSize="58"
                fontWeight="900"
                letterSpacing="-1.5px"
                fill="#000000"
              >
                skrible
              </text>

              {/* Main Text Outline */}
              <text
                x="170"
                y="52"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                fontSize="58"
                fontWeight="900"
                letterSpacing="-1.5px"
                fill={isDark ? "#121212" : "#ffffff"}
                stroke="#000000"
                strokeWidth="4"
                strokeLinejoin="round"
              >
                skrible
              </text>

              {/* Scribble texture fill clipped into text */}
              <rect
                x="0"
                y="0"
                width="340"
                height="70"
                fill="url(#smoothPenScribble)"
                clipPath="url(#smoothIntroTextClip)"
              />
            </svg>
          </div>
        </motion.div>

        {/* Subtitle / Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, delay: 0.8, ease: easeOutQuart },
          }}
          className="mt-3 flex items-center justify-center"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-wider rounded-md border-2 border-black bg-white dark:bg-[#25252b] text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Paintbrush className="w-3.5 h-3.5 text-[#FF90E8]" />
            student note & meal untangler
          </span>
        </motion.div>

        {/* Quick Micro Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.35, delay: 0.95 },
          }}
          className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold text-black/70 dark:text-white/70"
        >
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20">
            📝 Lecture Notes
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20">
            🍳 Dorm Recipes
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20">
            🔊 Web Speech Audio
          </span>
        </motion.div>
      </div>

      {/* ULTRA-SMOOTH PAINT-OVER WIPE OUT (Wave Curtain Reveal) */}
      <AnimatePresence>
        {phase === "wipe-out" && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            {/* Wave 1: Sunny Yellow Leading Edge */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "-10%" }}
              transition={{ duration: 0.65, ease: easeInOutCubic }}
              className="absolute inset-x-0 bottom-0 h-[120%] bg-[#FFE600] z-31"
              style={{
                borderTop: "6px solid #000000",
                transform: "translate3d(0, 0, 0)",
              }}
            />

            {/* Wave 2: Hot Pink Follower */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "-10%" }}
              transition={{ duration: 0.65, delay: 0.08, ease: easeInOutCubic }}
              className="absolute inset-x-0 bottom-0 h-[120%] bg-[#FF90E8] z-32"
              style={{
                borderTop: "6px solid #000000",
                transform: "translate3d(0, 0, 0)",
              }}
            />

            {/* Wave 3: App Canvas Color Final Curtain - Seamless reveal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.65, delay: 0.16, ease: easeInOutCubic }}
              className="absolute inset-0 z-33"
              style={{
                backgroundColor: palette.appBg,
                borderTop: "6px solid #000000",
                transform: "translate3d(0, 0, 0)",
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Skip Button in Top Right */}
      <div className="absolute top-5 right-5 z-40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/80 hover:bg-black text-white dark:bg-white/90 dark:text-black dark:hover:bg-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Skip intro animation (Esc)"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Subtle Bottom Hint */}
      <div className="absolute bottom-4 inset-x-0 text-center z-40 pointer-events-none">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full">
          Click anywhere or press Esc to skip
        </span>
      </div>
    </div>
  );
};
