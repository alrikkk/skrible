import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Bell,
  BellOff,
  X,
  Flame,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ActiveTimerInfo {
  stepNumber?: number;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
  label: string;
  stepSnippet: string;
}

interface RecipeStepTimerProps {
  stepNumber?: number;
  stepText: string;
  onTimerChange?: (info: ActiveTimerInfo | null) => void;
}

// Sound chime generator using browser Web Audio API
export function playKitchenTimerDing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const playNote = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    };

    // Pleasant microwave/oven bell chime sequence: C6 -> E6 -> G6
    playNote(1046.5, now, 0.25);
    playNote(1318.51, now + 0.16, 0.25);
    playNote(1567.98, now + 0.32, 0.45);

    // Double-ring
    playNote(1046.5, now + 0.65, 0.25);
    playNote(1318.51, now + 0.81, 0.25);
    playNote(1567.98, now + 0.97, 0.55);
  } catch (err) {
    console.warn("Could not play kitchen timer chime:", err);
  }
}

// Parser for cooking time mentions in text
export function parseCookingTimeFromText(text: string): { seconds: number; label: string } | null {
  if (!text) return null;

  // 1. Range matches: e.g. "3-4 minutes", "3 to 5 mins", "1-2 min"
  const rangeMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(minute|min|mins|minutes|second|sec|secs|seconds|hour|hr|hrs|hours)\b/i
  );
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]);
    const maxVal = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3].toLowerCase();

    let seconds = 0;
    if (unit.startsWith("h")) seconds = minVal * 3600;
    else if (unit.startsWith("s")) seconds = minVal;
    else seconds = minVal * 60;

    const unitShort = unit.startsWith("h") ? "hr" : unit.startsWith("s") ? "s" : "m";
    return {
      seconds: Math.max(5, Math.round(seconds)),
      label: `${rangeMatch[1]}-${rangeMatch[2]} ${unitShort}`,
    };
  }

  // 2. Single matches: e.g. "2 minutes", "90 seconds", "1.5 mins", "5 min"
  const singleMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(minute|min|mins|minutes|second|sec|secs|seconds|hour|hr|hrs|hours)\b/i
  );
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    const unit = singleMatch[2].toLowerCase();

    let seconds = 0;
    if (unit.startsWith("h")) seconds = val * 3600;
    else if (unit.startsWith("s")) seconds = val;
    else seconds = val * 60;

    const unitShort = unit.startsWith("h") ? "hr" : unit.startsWith("s") ? "s" : "m";
    return {
      seconds: Math.max(5, Math.round(seconds)),
      label: `${singleMatch[1]} ${unitShort}`,
    };
  }

  // 3. Shorthand matches: e.g. "for 2m", "in 30s", "cook 5min"
  const shorthandMatch = text.match(/\b(\d+)\s*(m|s|min|sec)\b/i);
  if (shorthandMatch) {
    const val = parseInt(shorthandMatch[1], 10);
    const unit = shorthandMatch[2].toLowerCase();
    const isSec = unit === "s" || unit === "sec";
    return {
      seconds: Math.max(5, isSec ? val : val * 60),
      label: isSec ? `${val}s` : `${val}m`,
    };
  }

  return null;
}

export function formatTimeDisplay(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const RecipeStepTimer: React.FC<RecipeStepTimerProps> = ({
  stepNumber,
  stepText,
  onTimerChange,
}) => {
  const detected = parseCookingTimeFromText(stepText);
  const defaultSeconds = detected ? detected.seconds : 120; // Default to 2 minutes if no explicit time in text
  const defaultLabel = detected ? detected.label : "2m";

  const [isOpen, setIsOpen] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of timer status changes
  useEffect(() => {
    if (onTimerChange) {
      if (isOpen && (isRunning || isFinished || secondsLeft !== totalSeconds)) {
        onTimerChange({
          stepNumber,
          secondsLeft,
          totalSeconds,
          isRunning,
          isFinished,
          label: defaultLabel,
          stepSnippet: stepText.slice(0, 55) + (stepText.length > 55 ? "..." : ""),
        });
      } else if (!isOpen) {
        onTimerChange(null);
      }
    }
  }, [isOpen, isRunning, secondsLeft, totalSeconds, isFinished, stepNumber, defaultLabel, stepText, onTimerChange]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            if (soundEnabled) {
              playKitchenTimerDing();
            }
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try {
                navigator.vibrate([200, 100, 200, 100, 300]);
              } catch {
                // Ignore vibration errors if blocked
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, secondsLeft, soundEnabled]);

  const handleStartTimer = () => {
    setIsOpen(true);
    setIsFinished(false);
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
    }
    setIsRunning(true);
  };

  const handleTogglePause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsLeft(totalSeconds);
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    setSecondsLeft((prev) => {
      const next = Math.max(5, prev + deltaSeconds);
      if (next > totalSeconds) {
        setTotalSeconds(next);
      }
      return next;
    });
    if (isFinished) {
      setIsFinished(false);
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    setIsOpen(false);
    setIsFinished(false);
    setSecondsLeft(totalSeconds);
    if (onTimerChange) {
      onTimerChange(null);
    }
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  // Closed compact button state
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleStartTimer}
        className="inline-flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/20 hover:border-[#ec4899] px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] select-none shrink-0"
        title={`Start ${defaultLabel} countdown timer for this step`}
      >
        <Timer className="w-3.5 h-3.5 text-[#ec4899]" />
        <span>{detected ? `${detected.label} timer` : "Start timer"}</span>
      </button>
    );
  }

  // Expanded active timer control card
  return (
    <div className="w-full mt-2.5 bg-white border-2 border-black/15 rounded-xl p-3 shadow-xs select-none">
      {/* Top Header: Monospace Clock + Status + Quick Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Main big timer display */}
          <div
            className={`font-mono text-xl sm:text-2xl font-black tracking-tight px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${
              isFinished
                ? "bg-emerald-500 text-white border-emerald-600 animate-pulse"
                : isRunning
                ? "bg-black text-white border-black"
                : "bg-[#FAF8F5] text-black border-black/20"
            }`}
          >
            <Timer className={`w-4 h-4 ${isRunning ? "text-[#ec4899] animate-spin" : ""}`} />
            <span>{formatTimeDisplay(secondsLeft)}</span>
          </div>

          {/* Status badge */}
          {isFinished ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Check className="w-3 h-3" /> Ding! Done
            </span>
          ) : isRunning ? (
            <span className="text-[11px] font-bold text-[#ec4899] bg-[#ec4899]/10 border border-[#ec4899]/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#ec4899]" /> Cooking...
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-black/60 bg-black/5 border border-black/10 px-2 py-0.5 rounded-md">
              Paused
            </span>
          )}
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-1.5">
          {/* Play / Pause button */}
          {!isFinished && (
            <button
              type="button"
              onClick={handleTogglePause}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                isRunning
                  ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
              }`}
              title={isRunning ? "Pause timer" : "Resume timer"}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Resume</span>
                </>
              )}
            </button>
          )}

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 border border-black/10 text-xs transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/30"
                : "bg-black/5 text-black/40 border-black/10"
            }`}
            title={soundEnabled ? "Sound alert enabled" : "Sound alert muted"}
          >
            {soundEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>

          {/* Test Chime button if finished */}
          {isFinished && (
            <button
              type="button"
              onClick={playKitchenTimerDing}
              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-xs cursor-pointer"
              title="Play chime sound again"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-black/40 hover:text-rose-600 transition-colors cursor-pointer"
            title="Close timer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden my-2 border border-black/5">
        <div
          className={`h-full transition-all duration-300 ${
            isFinished ? "bg-emerald-500" : isRunning ? "bg-[#ec4899]" : "bg-black/40"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Quick Adjustment Buttons Row */}
      <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-black/70 flex-wrap pt-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-black/40 font-medium mr-0.5">Adjust:</span>
          <button
            type="button"
            onClick={() => handleAdjustTime(-30)}
            className="px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black border border-black/10 cursor-pointer"
            title="Subtract 30 seconds"
          >
            -30s
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(30)}
            className="px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black border border-black/10 cursor-pointer"
            title="Add 30 seconds"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(60)}
            className="px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black border border-black/10 cursor-pointer"
            title="Add 1 minute"
          >
            +1m
          </button>
          <button
            type="button"
            onClick={() => handleAdjustTime(120)}
            className="px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-black border border-black/10 cursor-pointer"
            title="Add 2 minutes"
          >
            +2m
          </button>
        </div>

        {/* Step Context note */}
        {stepNumber && (
          <span className="text-[10px] text-black/40 font-medium">
            Step {stepNumber} Timer
          </span>
        )}
      </div>
    </div>
  );
};

export interface ActiveTimerDockProps {
  activeTimer: ActiveTimerInfo | null;
  onScrollToStep?: (stepNumber?: number) => void;
  onDismiss?: () => void;
}

export const ActiveTimerDock: React.FC<ActiveTimerDockProps> = ({
  activeTimer,
  onScrollToStep,
  onDismiss,
}) => {
  if (!activeTimer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 bg-black text-white border-2 border-[#ec4899] rounded-2xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-sm"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            activeTimer.isFinished
              ? "bg-emerald-500 text-white animate-bounce"
              : activeTimer.isRunning
              ? "bg-[#ec4899] text-white"
              : "bg-white/20 text-white"
          }`}
        >
          <Timer className={`w-5 h-5 ${activeTimer.isRunning ? "animate-spin" : ""}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white truncate">
              {activeTimer.stepNumber ? `Step ${activeTimer.stepNumber}` : "Cooking Step"}
            </span>
            <span
              className={`text-xs font-mono font-black ${
                activeTimer.isFinished ? "text-emerald-400" : "text-[#ec4899]"
              }`}
            >
              {formatTimeDisplay(activeTimer.secondsLeft)}
            </span>
            {activeTimer.isFinished && (
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/40">
                Done!
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/65 truncate">{activeTimer.stepSnippet}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onScrollToStep && activeTimer.stepNumber && (
            <button
              type="button"
              onClick={() => onScrollToStep(activeTimer.stepNumber)}
              className="text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Jump to this step"
            >
              View
            </button>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Hide dock"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

