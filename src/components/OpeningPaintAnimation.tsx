import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Paintbrush, Sparkles } from "lucide-react";

interface OpeningPaintAnimationProps {
  onComplete: () => void;
  isDark?: boolean;
}

// Fluid easing curves
const easeOutQuart = [0.25, 1, 0.5, 1] as const;
const easeInOutCubic = [0.65, 0, 0.35, 1] as const;

export const OpeningPaintAnimation: React.FC<OpeningPaintAnimationProps> = ({
  onComplete,
  isDark = false,
}) => {
  const [phase, setPhase] = useState<"paint-in" | "showcase" | "wipe-out">("paint-in");
  const [isSkipping, setIsSkipping] = useState(false);
  const [isLogoDrawn, setIsLogoDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scribblePathRef = useRef<SVGPathElement>(null);
  const accentPathRef = useRef<SVGPathElement>(null);
  const contourPathRef = useRef<SVGPathElement>(null);
  const penGroupRef = useRef<SVGGElement>(null);

  // Keep latest onComplete reference
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Color palette for light & dark themes
  const palette = useMemo(
    () =>
      isDark
        ? {
            bg: "#0D0D11",
            paintYellow: "#FFE600",
            paintPink: "#FF90E8",
            paintCyan: "#00F5FF",
            paperCard: "#18181F",
            ink: "#FFFFFF",
            inkSecondary: "rgba(255, 255, 255, 0.7)",
            appBg: "#121212",
          }
        : {
            bg: "#FFF9F0",
            paintYellow: "#FFE600",
            paintPink: "#FF90E8",
            paintCyan: "#00F5FF",
            paperCard: "#FFFFFF",
            ink: "#000000",
            inkSecondary: "rgba(0, 0, 0, 0.7)",
            appBg: "#FAF8F5",
          },
    [isDark]
  );

  // Safe skip handler with immediate exit
  const handleSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 60);
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

  // Coordinated timeline for paint entrance, showcase, wipe-out, and handoff
  useEffect(() => {
    let completed = false;
    const triggerComplete = () => {
      if (!completed) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    const showcaseTimer = setTimeout(() => {
      setPhase("showcase");
    }, 350);

    const wipeTimer = setTimeout(() => {
      setPhase("wipe-out");
    }, 2300);

    const completeTimer = setTimeout(() => {
      triggerComplete();
    }, 3000);

    const safetyDeadline = setTimeout(() => {
      triggerComplete();
    }, 3600);

    return () => {
      clearTimeout(showcaseTimer);
      clearTimeout(wipeTimer);
      clearTimeout(completeTimer);
      clearTimeout(safetyDeadline);
    };
  }, []);

  // Pen drawing animation that synchronizes all three logo paths (ink, neon, contour)
  useEffect(() => {
    const mainPath = scribblePathRef.current;
    const accentPath = accentPathRef.current;
    const contourPath = contourPathRef.current;
    const penGroup = penGroupRef.current;
    if (!mainPath) return;

    let animId: number;
    let totalLength = 5000;

    try {
      totalLength = Math.ceil(mainPath.getTotalLength());
    } catch {
      totalLength = 5000;
    }

    // Set initial stroke offsets so paths start completely hidden
    mainPath.style.strokeDasharray = `${totalLength}px`;
    mainPath.style.strokeDashoffset = `${totalLength}px`;

    if (accentPath) {
      accentPath.style.strokeDasharray = `${totalLength}px`;
      accentPath.style.strokeDashoffset = `${totalLength}px`;
    }

    if (contourPath) {
      contourPath.style.strokeDasharray = `${totalLength}px`;
      contourPath.style.strokeDashoffset = `${totalLength}px`;
    }

    if (penGroup) {
      penGroup.style.opacity = "0";
    }

    const drawDuration = 920; // ms to sketch full emblem
    const startDelay = 280; // ms before drawing starts
    const startTime = performance.now() + startDelay;

    const tick = (now: number) => {
      if (now < startTime) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;
      const linearProgress = Math.min(1, Math.max(0, elapsed / drawDuration));

      // Ease out quartic for natural, confident hand sketch motion
      const t = linearProgress - 1;
      const ease = 1 - t * t * t * t;

      const currentDistance = totalLength * ease;
      const offset = Math.max(0, totalLength - currentDistance);

      mainPath.style.strokeDashoffset = `${offset}px`;

      if (contourPath) {
        contourPath.style.strokeDashoffset = `${offset}px`;
      }

      if (accentPath) {
        const accentOffset = Math.max(0, totalLength - Math.max(0, currentDistance - 25));
        accentPath.style.strokeDashoffset = `${accentOffset}px`;
      }

      // Track pencil tip to current coordinate
      if (penGroup && mainPath.getPointAtLength) {
        try {
          penGroup.style.opacity = linearProgress < 1 ? "1" : "0";
          const pt = mainPath.getPointAtLength(currentDistance);
          const nextPt = mainPath.getPointAtLength(Math.min(totalLength, currentDistance + 8));
          const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI);

          penGroup.setAttribute(
            "transform",
            `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${angle.toFixed(1)})`
          );
        } catch {
          // Fallback if point calculation is unsupported
        }
      }

      if (linearProgress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        // Drawing finished: reveal burst sparkles and thought bubbles
        mainPath.style.strokeDashoffset = "0px";
        if (accentPath) accentPath.style.strokeDashoffset = "0px";
        if (contourPath) contourPath.style.strokeDashoffset = "0px";
        if (penGroup) penGroup.style.opacity = "0";
        setIsLogoDrawn(true);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      try {
        if (mainPath) mainPath.style.strokeDashoffset = "0px";
        if (accentPath) accentPath.style.strokeDashoffset = "0px";
        if (contourPath) contourPath.style.strokeDashoffset = "0px";
      } catch {}
    };
  }, []);

  // Dynamic canvas paint splatters & droplets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    const colors = [palette.paintYellow, palette.paintPink, palette.paintCyan, "#000000"];
    const centerX = width / 2;
    const centerY = height / 2;

    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const dist = 75 + Math.random() * (Math.min(width, height) * 0.34);
      const dripsCount = Math.floor(Math.random() * 3) + 1;
      const drips = [];
      for (let d = 0; d < dripsCount; d++) {
        drips.push({
          angle: angle + (Math.random() - 0.5) * 0.6,
          length: 8 + Math.random() * 20,
          width: 1.5 + Math.random() * 2.5,
        });
      }

      splatters.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        currentR: 0,
        targetR: 3.5 + Math.random() * 9,
        color: colors[i % colors.length],
        alpha: 0.9,
        drips,
      });
    }

    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, width, height);

      if (elapsed > 250) {
        const progress = Math.min(1, (elapsed - 250) / 600);
        const ease = 1 - Math.pow(1 - progress, 3);

        for (const s of splatters) {
          s.currentR = s.targetR * ease;
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.alpha;

          // Main splatter droplet
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.currentR, 0, Math.PI * 2);
          ctx.fill();

          // Drip trails
          if (progress > 0.4) {
            const dripProg = (progress - 0.4) / 0.6;
            for (const d of s.drips) {
              const dripLen = d.length * dripProg;
              const dx = s.x + Math.cos(d.angle) * (s.currentR + dripLen);
              const dy = s.y + Math.sin(d.angle) * (s.currentR + dripLen);

              ctx.beginPath();
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(dx, dy);
              ctx.strokeStyle = s.color;
              ctx.lineWidth = d.width;
              ctx.lineCap = "round";
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [palette]);

  // Letters of the wordmark "skrible" with handcrafted playful tilts
  const brandLetters = [
    { char: "s", rot: -3 },
    { char: "k", rot: 2.5 },
    { char: "r", rot: -1.5 },
    { char: "i", rot: 3, hasStarTittle: true },
    { char: "b", rot: -2 },
    { char: "l", rot: 2 },
    { char: "e", rot: -1.5 },
  ];

  const scribbleData =
    "M 260 80 C 290 40, 360 40, 390 70 C 430 45, 500 70, 510 120 C 550 145, 560 210, 530 250 C 560 290, 530 350, 480 360 C 450 400, 380 400, 340 370 C 300 400, 230 380, 210 330 C 170 320, 150 250, 180 200 C 150 150, 190 90, 260 80 Z M 240 180 Q 320 110, 420 160 Q 480 200, 440 260 Q 380 320, 280 280 Q 210 240, 260 160 Q 320 120, 450 180 Q 500 230, 430 290 Q 330 330, 240 250 Q 190 190, 290 130 Q 380 100, 460 150 Q 510 210, 420 280 Q 310 320, 230 220 Q 200 150, 310 140 Q 410 130, 470 200 Q 480 270, 390 300 Q 280 300, 220 200 Q 200 130, 330 110 Q 440 110, 480 180 Q 470 250, 360 290 Q 260 290, 230 190 Q 230 130, 360 130 Q 460 140, 450 220 Q 420 280, 310 280 Q 240 260, 260 190 Q 290 150, 400 160 Q 460 170, 430 240 Q 380 290, 280 270 Q 220 230, 280 170 Q 350 130, 430 170 Q 470 210, 410 260 Q 330 290, 260 240 Q 230 200, 320 160 Q 410 150, 450 210 Q 450 260, 370 280 Q 280 270, 250 210 Q 250 160, 360 150 Q 440 170, 410 230 Q 360 270, 290 250 Q 240 220, 300 180 Q 380 160, 420 210 Q 420 250, 340 260";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Opening Paint Animation"
      onClick={handleSkip}
      initial={{ opacity: 0 }}
      animate={{ opacity: isSkipping ? 0 : 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      style={{
        backgroundColor: palette.bg,
        willChange: "opacity, transform",
        transform: "translate3d(0, 0, 0)",
      }}
    >
      {/* BACKGROUND SWEEPING PAINT BRUSH STROKES */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <defs>
          <linearGradient id="paintYellowGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFE600" />
            <stop offset="65%" stopColor="#FFDE21" />
            <stop offset="100%" stopColor="#FFC700" />
          </linearGradient>

          <linearGradient id="paintPinkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF5CB8" />
            <stop offset="50%" stopColor="#FF90E8" />
            <stop offset="100%" stopColor="#FFB3F0" />
          </linearGradient>

          <linearGradient id="paintCyanGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>
        </defs>

        {/* Paint Stroke 1: Top-Left to Right Wide Yellow Swash */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.95 }}
          transition={{ duration: 0.7, ease: easeOutQuart }}
          d="M -60 160 C 250 80, 600 230, 1260 70"
          fill="none"
          stroke="url(#paintYellowGrad)"
          strokeWidth="120"
          strokeLinecap="round"
        />

        {/* Paint Stroke 1 Outline */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.7 }}
          transition={{ duration: 0.72, ease: easeOutQuart }}
          d="M -60 160 C 250 80, 600 230, 1260 70"
          fill="none"
          stroke="#000000"
          strokeWidth="124"
          strokeLinecap="round"
          style={{ zIndex: -1 }}
        />

        {/* Paint Stroke 2: Bottom-Right to Center Hot Pink Roller Swash */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.92 }}
          transition={{ duration: 0.7, delay: 0.12, ease: easeOutQuart }}
          d="M 1260 630 C 900 690, 500 510, -90 670"
          fill="none"
          stroke="url(#paintPinkGrad)"
          strokeWidth="135"
          strokeLinecap="round"
        />

        {/* Paint Stroke 3: Diagonal Electric Cyan Splash */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 0.65, delay: 0.2, ease: easeOutQuart }}
          d="M 140 -60 C 350 340, 750 440, 1060 860"
          fill="none"
          stroke="url(#paintCyanGrad)"
          strokeWidth="50"
          strokeLinecap="round"
        />

        {/* Paint Stroke 4: Bottom-Left Golden Arc */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 0.65, delay: 0.28, ease: easeOutQuart }}
          d="M -40 760 C 200 650, 400 780, 700 720"
          fill="none"
          stroke="url(#paintYellowGrad)"
          strokeWidth="60"
          strokeLinecap="round"
        />
      </svg>

      {/* CANVAS DYNAMIC PAINT SPLATTERS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* CENTER SHOWCASE CONTAINER */}
      <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto pointer-events-none">
        
        {/* Animated Scribble Logo Container with Elastic Finish */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 16 }}
          animate={{
            scale: isLogoDrawn ? [1, 1.15, 0.96, 1.02, 1] : 1,
            rotate: isLogoDrawn ? [0, -3.5, 3.5, -1, 0] : 0,
            opacity: 1,
            y: 0,
          }}
          transition={
            isLogoDrawn
              ? { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }
              : { duration: 0.45, delay: 0.15, ease: easeOutQuart }
          }
          className="relative mb-2 flex items-center justify-center"
        >
          {/* Neon Paint Aura behind Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{
              scale: isLogoDrawn ? [1.1, 1.25, 1.1] : [0.95, 1.08, 0.95],
              opacity: isLogoDrawn ? [0.75, 0.95, 0.75] : [0.45, 0.65, 0.45],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-6 rounded-full filter blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${palette.paintPink} 0%, ${palette.paintYellow} 50%, ${palette.paintCyan} 80%, transparent 100%)`,
            }}
          />

          {/* SVG Scribble Logo Drawing Path & Live Marker */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 p-2 flex items-center justify-center">
            <svg
              viewBox="0 0 740 540"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF90E8" />
                  <stop offset="50%" stopColor="#FFE600" />
                  <stop offset="100%" stopColor="#00F5FF" />
                </linearGradient>
              </defs>

              {/* Outer decorative paint blotch circle */}
              <circle
                cx="350"
                cy="230"
                r="195"
                fill={palette.paintYellow}
                opacity={0.35}
              />

              {/* Layer 1: Vibrant Neon Highlighter Offset Underlay */}
              <path
                ref={accentPathRef}
                stroke="url(#logoAccentGrad)"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(4, 5)"
                opacity={0.88}
                d={scribbleData}
              />

              {/* Layer 1.5: Comic Black Ink Contour Underlay (Draws along with pen) */}
              <path
                ref={contourPathRef}
                stroke="#000000"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.92}
                d={scribbleData}
              />

              {/* Layer 2: Main Bold Ink Line */}
              <path
                ref={scribblePathRef}
                stroke={palette.ink}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  willChange: "stroke-dashoffset",
                }}
                d={scribbleData}
              />

              {/* Layer 3: Thought Bubble Trailing Dots */}
              <g className="intro-thought-dots">
                {/* Dot 1 */}
                <motion.circle
                  cx="230"
                  cy="390"
                  r="20"
                  fill="#FFE600"
                  stroke={palette.ink}
                  strokeWidth="8"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isLogoDrawn ? 1 : 0,
                    opacity: isLogoDrawn ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.05 }}
                  style={{ transformOrigin: "230px 390px" }}
                />
                {/* Dot 2 */}
                <motion.circle
                  cx="180"
                  cy="430"
                  r="15"
                  fill="#FF90E8"
                  stroke={palette.ink}
                  strokeWidth="7"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isLogoDrawn ? 1 : 0,
                    opacity: isLogoDrawn ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.12 }}
                  style={{ transformOrigin: "180px 430px" }}
                />
                {/* Dot 3 */}
                <motion.circle
                  cx="135"
                  cy="460"
                  r="11"
                  fill="#00F5FF"
                  stroke={palette.ink}
                  strokeWidth="6"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isLogoDrawn ? 1 : 0,
                    opacity: isLogoDrawn ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.2 }}
                  style={{ transformOrigin: "135px 460px" }}
                />
              </g>

              {/* LIVE MARKER NIB FOLLOWING PATH */}
              <g
                ref={penGroupRef}
                style={{
                  opacity: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.15s ease",
                }}
              >
                <g transform="translate(0, 0) rotate(-45)">
                  {/* Glowing Ink Bead at Nib Point */}
                  <circle cx="0" cy="0" r="7" fill="#FFE600" />
                  <circle cx="0" cy="0" r="3" fill="#000000" />
                  
                  {/* Nib cone */}
                  <polygon points="0,0 -8,-20 8,-20" fill="#18181B" />
                  <polygon points="0,0 -3,-10 3,-10" fill="#FFE600" />
                  
                  {/* Metal ferrule ring */}
                  <rect x="-8" y="-28" width="16" height="8" fill="#F4F4F5" stroke="#000000" strokeWidth="2" rx="1.5" />
                  
                  {/* Marker Barrel */}
                  <rect x="-8" y="-72" width="16" height="44" fill="#FF90E8" stroke="#000000" strokeWidth="2" rx="3" />
                  
                  {/* Barrel Accent Stripe */}
                  <rect x="-3" y="-68" width="6" height="36" fill="#FFE600" rx="1.5" />
                  
                  {/* Pen Top Cap */}
                  <path d="M -8 -72 Q 0 -82 8 -72 Z" fill="#00F5FF" stroke="#000000" strokeWidth="2" />
                </g>
              </g>

              {/* BURSTING DOODLE SPARKLES WHEN DRAWING FINISHES */}
              <AnimatePresence>
                {isLogoDrawn && (
                  <g className="burst-sparkles">
                    {/* Sparkle 1: Top-Right Sunny Yellow */}
                    <motion.path
                      d="M 590 90 Q 590 120 620 120 Q 590 120 590 150 Q 590 120 560 120 Q 590 120 590 90 Z"
                      fill="#FFE600"
                      stroke="#000000"
                      strokeWidth="5"
                      strokeLinejoin="round"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 380, damping: 14 }}
                      style={{ transformOrigin: "590px 120px" }}
                    />

                    {/* Sparkle 2: Top-Left Hot Pink */}
                    <motion.path
                      d="M 150 70 Q 150 95 175 95 Q 150 95 150 120 Q 150 95 125 95 Q 150 95 150 70 Z"
                      fill="#FF90E8"
                      stroke="#000000"
                      strokeWidth="5"
                      strokeLinejoin="round"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: -35 }}
                      transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.08 }}
                      style={{ transformOrigin: "150px 95px" }}
                    />

                    {/* Sparkle 3: Middle-Right Electric Cyan */}
                    <motion.path
                      d="M 610 270 Q 610 290 630 290 Q 610 290 610 310 Q 610 290 590 290 Q 610 290 610 270 Z"
                      fill="#00F5FF"
                      stroke="#000000"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 60 }}
                      transition={{ type: "spring", stiffness: 380, damping: 14, delay: 0.14 }}
                      style={{ transformOrigin: "610px 290px" }}
                    />

                    {/* Sparkle 4: Apex Mini Star */}
                    <motion.polygon
                      points="370,15 374,27 386,27 377,35 380,47 370,39 360,47 363,35 354,27 366,27"
                      fill="#FFE600"
                      stroke="#000000"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.18 }}
                      style={{ transformOrigin: "370px 30px" }}
                    />

                    {/* Sparkle 5: Bottom Thought Trail Sparkle */}
                    <motion.path
                      d="M 285 450 Q 285 465 300 465 Q 285 465 285 480 Q 285 465 270 465 Q 285 465 285 450 Z"
                      fill="#FF90E8"
                      stroke="#000000"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15, delay: 0.22 }}
                      style={{ transformOrigin: "285px 465px" }}
                    />
                  </g>
                )}
              </AnimatePresence>
            </svg>
          </div>
        </motion.div>

        {/* "skrible" TYPOGRAPHIC WORDMARK WITH BOUNCY LETTERS & SHIMMER HIGHLIGHTER */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { duration: 0.45, delay: 0.38, ease: easeOutQuart },
          }}
          className="relative inline-block mt-1"
        >
          {/* Highlighter Brush Swash under the wordmark */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: 1,
              transition: { duration: 0.5, delay: 0.52, ease: easeOutQuart },
            }}
            style={{ transformOrigin: "left center" }}
            className="absolute left-[-4%] right-[-4%] bottom-[12%] h-[46%] -rotate-1 rounded-sm -z-10 bg-gradient-to-r from-[#FFE600] via-[#FF90E8] to-[#00F5FF] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Shimmer glossy light pass across highlighter */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.1, delay: 0.85, ease: "easeInOut" }}
              className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
            />
          </motion.div>

          {/* Staggered Animated Letters for "skrible" */}
          <div className="relative px-3 py-1 flex items-baseline justify-center gap-0.5">
            {brandLetters.map((item, idx) => (
              <motion.span
                key={idx}
                initial={{ y: 22, opacity: 0, scale: 0.75, rotate: item.rot * 3 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: item.rot,
                  transition: {
                    type: "spring",
                    stiffness: 340,
                    damping: 18,
                    delay: 0.44 + idx * 0.05,
                  },
                }}
                className="relative inline-block font-black text-5xl sm:text-6xl md:text-7xl tracking-tighter text-black select-none"
                style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow:
                    isDark
                      ? "2px 2px 0px #FFFFFF, -1px -1px 0px #FFFFFF, 1px -1px 0px #FFFFFF, -1px 1px 0px #FFFFFF"
                      : "2px 2px 0px #FFFFFF, 4px 4px 0px rgba(0,0,0,0.8)",
                  color: isDark ? "#121214" : "#000000",
                }}
              >
                {item.char}

                {/* Star Tittle for the letter 'i' */}
                {item.hasStarTittle && (
                  <motion.span
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 15 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                      delay: 0.78,
                    }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm text-[#FFE600] drop-shadow-[0_1px_1px_rgba(0,0,0,1)] select-none pointer-events-none"
                  >
                    ★
                  </motion.span>
                )}
              </motion.span>
            ))}
          </div>

          {/* Hand-Drawn Underline Loop Accent */}
          <motion.svg
            viewBox="0 0 240 24"
            className="w-48 sm:w-60 h-4 mx-auto -mt-1 overflow-visible"
            fill="none"
          >
            <motion.path
              d="M 5 12 Q 70 20, 130 11 Q 190 2, 235 15"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: 1,
                transition: { duration: 0.45, delay: 0.75, ease: easeOutQuart },
              }}
            />
          </motion.svg>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-wider rounded-md border-2 border-black bg-white dark:bg-[#25252b] text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Paintbrush className="w-3.5 h-3.5 text-[#FF90E8]" />
            student note & meal untangler
          </span>
        </motion.div>

        {/* Quick Micro Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.35, delay: 0.92 },
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
            🧠 Smart Auto-Tagging
          </span>
        </motion.div>
      </div>

      {/* PAINT-OVER WIPE OUT TRANSITION */}
      <AnimatePresence>
        {phase === "wipe-out" && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            {/* Wave 1: Sunny Yellow Leading Edge */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "-10%" }}
              transition={{ duration: 0.7, ease: easeInOutCubic }}
              className="absolute inset-x-0 bottom-0 h-[120%] bg-[#FFE600]"
              style={{
                zIndex: 31,
                borderTop: "6px solid #000000",
                boxShadow: "0 -8px 0px rgba(0, 0, 0, 0.4)",
                transform: "translate3d(0, 0, 0)",
              }}
            />

            {/* Wave 2: Hot Pink Follower */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "-10%" }}
              transition={{ duration: 0.7, delay: 0.08, ease: easeInOutCubic }}
              className="absolute inset-x-0 bottom-0 h-[120%] bg-[#FF90E8]"
              style={{
                zIndex: 32,
                borderTop: "6px solid #000000",
                boxShadow: "0 -8px 0px rgba(0, 0, 0, 0.3)",
                transform: "translate3d(0, 0, 0)",
              }}
            />

            {/* Wave 3: App Canvas Color Final Curtain */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.7, delay: 0.16, ease: easeInOutCubic }}
              className="absolute inset-0"
              style={{
                zIndex: 33,
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
    </motion.div>
  );
};
