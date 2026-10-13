import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface ScribbleLogoProps {
  className?: string;
  interactive?: boolean;
  showAccent?: boolean;
  showSparkle?: boolean;
}

export const ScribbleLogo: React.FC<ScribbleLogoProps> = ({
  className = "h-10 w-auto text-black dark:text-white",
  interactive = true,
  showAccent = true,
  showSparkle = true,
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const accentPathRef = useRef<SVGPathElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDrawn, setIsDrawn] = useState(false);

  // Smooth drawing on mount
  useEffect(() => {
    const mainPath = pathRef.current;
    const accentPath = accentPathRef.current;
    if (!mainPath) return;

    try {
      const measured = Math.ceil(mainPath.getTotalLength());
      const length = measured > 100 ? measured + 20 : 5200;
      mainPath.style.strokeDasharray = `${length}px`;
      mainPath.style.strokeDashoffset = `${length}px`;

      if (accentPath) {
        accentPath.style.strokeDasharray = `${length}px`;
        accentPath.style.strokeDashoffset = `${length}px`;
      }

      const frame = requestAnimationFrame(() => {
        mainPath.style.transition = "stroke-dashoffset 1.35s cubic-bezier(0.25, 1, 0.5, 1)";
        mainPath.style.strokeDashoffset = "0px";

        if (accentPath) {
          accentPath.style.transition = "stroke-dashoffset 1.35s cubic-bezier(0.25, 1, 0.5, 1) 0.08s";
          accentPath.style.strokeDashoffset = "0px";
        }
      });

      const timer = setTimeout(() => {
        setIsDrawn(true);
        if (mainPath) {
          mainPath.style.strokeDasharray = "none";
          mainPath.style.strokeDashoffset = "0px";
        }
        if (accentPath) {
          accentPath.style.strokeDasharray = "none";
          accentPath.style.strokeDashoffset = "0px";
        }
      }, 1450);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        if (mainPath) {
          mainPath.style.strokeDasharray = "none";
          mainPath.style.strokeDashoffset = "0px";
        }
      };
    } catch {
      setIsDrawn(true);
      if (mainPath) {
        mainPath.style.strokeDasharray = "none";
        mainPath.style.strokeDashoffset = "0px";
      }
    }
  }, []);

  const scribbleData =
    "M 260 80 C 290 40, 360 40, 390 70 C 430 45, 500 70, 510 120 C 550 145, 560 210, 530 250 C 560 290, 530 350, 480 360 C 450 400, 380 400, 340 370 C 300 400, 230 380, 210 330 C 170 320, 150 250, 180 200 C 150 150, 190 90, 260 80 Z M 240 180 Q 320 110, 420 160 Q 480 200, 440 260 Q 380 320, 280 280 Q 210 240, 260 160 Q 320 120, 450 180 Q 500 230, 430 290 Q 330 330, 240 250 Q 190 190, 290 130 Q 380 100, 460 150 Q 510 210, 420 280 Q 310 320, 230 220 Q 200 150, 310 140 Q 410 130, 470 200 Q 480 270, 390 300 Q 280 300, 220 200 Q 200 130, 330 110 Q 440 110, 480 180 Q 470 250, 360 290 Q 260 290, 230 190 Q 230 130, 360 130 Q 460 140, 450 220 Q 420 280, 310 280 Q 240 260, 260 190 Q 290 150, 400 160 Q 460 170, 430 240 Q 380 290, 280 270 Q 220 230, 280 170 Q 350 130, 430 170 Q 470 210, 410 260 Q 330 290, 260 240 Q 230 200, 320 160 Q 410 150, 450 210 Q 450 260, 370 280 Q 280 270, 250 210 Q 250 160, 360 150 Q 440 170, 410 230 Q 360 270, 290 250 Q 240 220, 300 180 Q 380 160, 420 210 Q 420 250, 340 260";

  return (
    <motion.span
      className={`inline-flex items-center justify-center shrink-0 relative select-none ${className}`}
      onHoverStart={() => interactive && setIsHovered(true)}
      onHoverEnd={() => interactive && setIsHovered(false)}
      whileHover={interactive ? { scale: 1.08, rotate: -2 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 720 520"
        className="h-full w-auto max-h-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="scribbleAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF90E8" />
            <stop offset="60%" stopColor="#FFE600" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>

          {/* Filter for subtle hand-drawn texture depth */}
          <radialGradient id="scribbleBackGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE600" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#FF90E8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Backing Glow on Hover */}
        <motion.circle
          cx="350"
          cy="230"
          r="190"
          fill="url(#scribbleBackGlow)"
          animate={{
            scale: isHovered ? 1.15 : 1,
            opacity: isHovered ? 1 : 0.6,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Layer 1: Vibrant Highlighter Stroke Offset Underlay */}
        {showAccent && (
          <path
            ref={accentPathRef}
            stroke="url(#scribbleAccentGrad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(4, 5)"
            opacity={isHovered ? 0.95 : 0.75}
            d={scribbleData}
          />
        )}

        {/* Layer 2: Main Bold Ink Line */}
        <path
          ref={pathRef}
          stroke="currentColor"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
          d={scribbleData}
        />

        {/* Layer 3: Thought Bubble Trailing Dots */}
        <g className="thought-dots">
          {/* Dot 1 */}
          <motion.circle
            cx="230"
            cy="390"
            r="20"
            fill="#FFE600"
            stroke="currentColor"
            strokeWidth="8"
            animate={{
              scale: isHovered ? [1, 1.25, 1] : 1,
            }}
            transition={{ duration: 0.4, delay: 0.05 }}
          />
          {/* Dot 2 */}
          <motion.circle
            cx="180"
            cy="430"
            r="15"
            fill="#FF90E8"
            stroke="currentColor"
            strokeWidth="7"
            animate={{
              scale: isHovered ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.4, delay: 0.12 }}
          />
          {/* Dot 3 */}
          <motion.circle
            cx="135"
            cy="460"
            r="11"
            fill="#00F5FF"
            stroke="currentColor"
            strokeWidth="6"
            animate={{
              scale: isHovered ? [1, 1.35, 1] : 1,
            }}
            transition={{ duration: 0.4, delay: 0.18 }}
          />
        </g>

        {/* Layer 4: Playful Doodle Sparkles ✦ */}
        {showSparkle && (
          <g>
            {/* Top-Right Big Sparkle ✦ */}
            <motion.path
              d="M 580 90 Q 580 120 610 120 Q 580 120 580 150 Q 580 120 550 120 Q 580 120 580 90 Z"
              fill="#FFE600"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinejoin="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isDrawn ? (isHovered ? 1.35 : 1) : 0,
                opacity: isDrawn ? 1 : 0,
                rotate: isHovered ? 45 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: isDrawn ? 0 : 0.6,
              }}
              style={{ transformOrigin: "580px 120px" }}
            />

            {/* Top-Left Mini Sparkle ✦ */}
            <motion.path
              d="M 170 85 Q 170 100 185 100 Q 170 100 170 115 Q 170 100 155 100 Q 170 100 170 85 Z"
              fill="#FF90E8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isDrawn ? (isHovered ? 1.25 : 0.85) : 0,
                opacity: isDrawn ? 0.9 : 0,
                rotate: isHovered ? -30 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: isDrawn ? 0 : 0.75,
              }}
              style={{ transformOrigin: "170px 100px" }}
            />
          </g>
        )}
      </svg>
    </motion.span>
  );
};
