import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Download,
  Headphones,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  Minimize2,
  Radio,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface StudyAudioPlayerProps {
  markdown: string;
  topicTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  getAuthHeaders?: () => Promise<Record<string, string>>;
}

const AI_VOICES = [
  { id: "Zephyr", name: "Zephyr", description: "Direct & focused (Default)" },
  { id: "Aoede", name: "Aoede", description: "Academic & measured narrator" },
  { id: "Puck", name: "Puck", description: "Energetic & lively tutor" },
  { id: "Fenrir", name: "Fenrir", description: "Deep & steady cadence" },
  { id: "Kore", name: "Kore", description: "Calm & soothing pace" },
];

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const StudyAudioPlayer: React.FC<StudyAudioPlayerProps> = ({
  markdown,
  topicTitle = "Untangled Study Note",
  isOpen,
  onClose,
  getAuthHeaders,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [readingMode, setReadingMode] = useState<"full" | "summary">("full");
  const [isDockMinimized, setIsDockMinimized] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);
  const [speechEngine, setSpeechEngine] = useState<"gemini" | "browser">("gemini");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Audio element reference for Gemini audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Web Speech synthesis utterance reference
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);

  // Extract clean plain text from markdown
  const getReadableText = (text: string, mode: "full" | "summary"): string => {
    if (!text) return "";
    let clean = text
      .replace(/^---\s*[\s\S]*?---\s*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/^#{1,6}\s*(.+)$/gm, "$1. ")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/[|*~_`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (mode === "summary") {
      // Pick first ~1400 chars for concise commute listening
      return clean.slice(0, 1400);
    }
    return clean.slice(0, 3500);
  };

  // Stop all active playback
  const stopAllPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Cleanup when closed or unmounted
  useEffect(() => {
    return () => {
      stopAllPlayback();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Update playback speed on active element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && isPlaying && speechEngine === "browser") {
      // If Web Speech is playing, restart current chunk with new rate
      window.speechSynthesis.cancel();
      playBrowserSpeech(currentChunkIndexRef.current);
    }
  }, [playbackSpeed]);

  // Handle Gemini AI TTS Generation & Playback
  const generateAndPlayGeminiAudio = async () => {
    setIsLoading(true);
    setStatusMessage("Generating clear voice narration...");

    try {
      const cleanText = getReadableText(markdown, readingMode);
      if (!cleanText) {
        throw new Error("Note content is empty.");
      }

      let authHeaders: Record<string, string> = { "X-Guest-Mode": "true" };
      if (getAuthHeaders) {
        try {
          const headers = await getAuthHeaders();
          authHeaders = { ...authHeaders, ...headers };
        } catch {
          // fallback to guest header
        }
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          text: cleanText,
          voiceName: selectedVoice,
          mode: readingMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audio) {
        throw new Error(data.error || "Failed to generate speech.");
      }

      // Convert base64 audio to Blob URL
      const byteCharacters = atob(data.audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || "audio/wav" });
      const newUrl = URL.createObjectURL(blob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(newUrl);

      // Initialize audio element
      const audio = new Audio(newUrl);
      audio.playbackRate = playbackSpeed;
      audio.muted = isMuted;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime || 0);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        console.warn("[TTS] Native audio element error, falling back to Web Speech API.");
        playWithBrowserSpeechFallback();
      };

      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
      setSpeechEngine("gemini");
      setStatusMessage(null);
    } catch (err: any) {
      console.warn("[TTS] AI speech generation issue, using browser speech engine:", err.message);
      setStatusMessage("Using device voice synthesizer fallback...");
      setTimeout(() => setStatusMessage(null), 3000);
      playWithBrowserSpeechFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Browser Web Speech API fallback
  const playWithBrowserSpeechFallback = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatusMessage("Speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setSpeechEngine("browser");

    const cleanText = getReadableText(markdown, readingMode);
    // Split into comfortable sentence chunks for reliability across mobile Safari & Chrome
    const sentences = cleanText.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanText];
    textChunksRef.current = sentences;
    currentChunkIndexRef.current = 0;

    // Estimate duration: average 140 words per minute at 1.0x
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.round((wordCount / 140) * 60);
    setDuration(estimatedDuration);

    playBrowserSpeech(0);
  };

  const playBrowserSpeech = (index: number) => {
    if (index >= textChunksRef.current.length) {
      setIsPlaying(false);
      setCurrentTime(duration);
      return;
    }

    const chunk = textChunksRef.current[index];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = playbackSpeed;

    // Try finding an English natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onend = () => {
      currentChunkIndexRef.current = index + 1;
      playBrowserSpeech(index + 1);
    };

    utterance.onerror = (e) => {
      console.error("[WebSpeech] Error:", e);
      setIsPlaying(false);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      if (speechEngine === "gemini" && audioRef.current) {
        audioRef.current.pause();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
    } else {
      if (speechEngine === "gemini" && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      } else if (speechEngine === "browser" && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        // First start or restart
        generateAndPlayGeminiAudio();
      }
    }
  };

  // Skip -10s / +10s
  const handleSeekRelative = (seconds: number) => {
    if (audioRef.current && speechEngine === "gemini") {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    } else if (speechEngine === "browser") {
      // Seek chunk
      const delta = seconds > 0 ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(textChunksRef.current.length - 1, currentChunkIndexRef.current + delta));
      currentChunkIndexRef.current = nextIdx;
      window.speechSynthesis.cancel();
      playBrowserSpeech(nextIdx);
    }
  };

  // Scrubber change
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current && speechEngine === "gemini") {
      audioRef.current.currentTime = newTime;
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Download audio file (.wav)
  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_audio_note.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full mb-6">
      {/* EXPANDED DESKTOP / INLINE AUDIO SUITE */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-black tracking-tight flex items-center gap-1.5">
                  <span>Audio Study Companion</span>
                  <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-300">
                    Listen on the go
                  </span>
                </h4>
                {speechEngine === "gemini" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>Gemini AI Voice ({selectedVoice})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-black/60 font-medium">
                Listen to your notes hands-free while walking, commuting, or relaxing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {audioUrl && (
              <button
                type="button"
                onClick={handleDownloadAudio}
                className="p-1.5 bg-white hover:bg-black/5 text-black border border-black/20 hover:border-black rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Download spoken audio note (.wav)"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
              title="Close audio companion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mb-3 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium rounded-xl flex items-center gap-2 animate-fadeIn">
            <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Player Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5] border border-black/15 rounded-xl p-3 sm:p-4">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSeekRelative(-10)}
              disabled={!isPlaying && currentTime === 0}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Rewind 10 seconds"
            >
              <Rewind className="w-4 h-4 text-black/70" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                isPlaying
                  ? "bg-amber-400 hover:bg-amber-500 text-black"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Preparing Voice...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : currentTime > 0 ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Listen Now</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSeekRelative(10)}
              disabled={!isPlaying && currentTime === 0}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Skip forward 10 seconds"
            >
              <FastForward className="w-4 h-4 text-black/70" />
            </button>

            <button
              type="button"
              onClick={stopAllPlayback}
              disabled={!isPlaying && currentTime === 0}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Stop and reset to start"
            >
              <RotateCcw className="w-3.5 h-3.5 text-black/70" />
            </button>
          </div>

          {/* Scrubber & Time */}
          <div className="flex-1 w-full sm:mx-3 flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-black/70 min-w-[40px] text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleScrubberChange}
              disabled={!audioRef.current && speechEngine !== "gemini"}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-black/10 rounded-full"
            />
            <span className="font-mono text-xs font-bold text-black/50 min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Sound / Equalizer visualizer */}
          <div className="flex items-center gap-1 px-2 shrink-0">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-full bg-purple-600 transition-all duration-200 ${
                  isPlaying
                    ? bar % 2 === 0
                      ? "h-4 animate-pulse"
                      : "h-6 animate-bounce"
                    : "h-2 opacity-30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Listening Options: Mode & Speeds & Voice Selection */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-black/10 text-xs">
          {/* Mode: Full Note vs Commute Summary */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-black/15 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => {
                if (readingMode !== "full") {
                  stopAllPlayback();
                  setReadingMode("full");
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                readingMode === "full"
                  ? "bg-black text-white shadow-2xs font-bold"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Full Study Note</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (readingMode !== "summary") {
                  stopAllPlayback();
                  setReadingMode("summary");
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                readingMode === "summary"
                  ? "bg-black text-white shadow-2xs font-bold"
                  : "text-black/70 hover:text-black hover:bg-black/5"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Commute Summary (~1.5 min)</span>
            </button>
          </div>

          {/* Playback Speed Multipliers */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-black/60 uppercase font-mono mr-1">
              Speed:
            </span>
            {SPEED_OPTIONS.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  playbackSpeed === spd
                    ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                    : "bg-white text-black/70 border-black/15 hover:border-black"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Voice Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsVoicePickerOpen(!isVoicePickerOpen)}
              className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Radio className="w-3 h-3 text-purple-600" />
              <span>Voice: <strong>{selectedVoice}</strong></span>
              <ChevronDown className="w-3 h-3 text-black/50" />
            </button>

            {isVoicePickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border-2 border-black rounded-xl p-1.5 shadow-lg z-30 space-y-1 animate-fadeIn">
                <span className="text-[10px] font-mono uppercase text-black/50 px-2 py-1 block font-bold border-b border-black/10">
                  Select Narration Persona
                </span>
                {AI_VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoice(v.id);
                      setIsVoicePickerOpen(false);
                      if (isPlaying) {
                        stopAllPlayback();
                        setTimeout(() => generateAndPlayGeminiAudio(), 100);
                      }
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex flex-col cursor-pointer transition-colors ${
                      selectedVoice === v.id
                        ? "bg-purple-50 text-purple-950 font-bold border border-purple-300"
                        : "hover:bg-black/5 text-black"
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] text-black/60 font-normal">
                      {v.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* FLOATING ON-THE-GO BOTTOM BAR (Visible when playing and scrolling) */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white border-2 border-black rounded-2xl p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-sans"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Headphones className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-black truncate leading-tight">
                    {topicTitle}
                  </p>
                  <p className="text-[10px] font-mono text-black/60 flex items-center gap-1.5">
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    <span>•</span>
                    <span className="text-purple-700 font-bold">{playbackSpeed}x</span>
                  </p>
                </div>
              </div>

              {/* Quick Play/Pause & Speed */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSeekRelative(-10)}
                  className="p-1.5 hover:bg-black/5 rounded-lg text-black cursor-pointer"
                  title="Rewind 10s"
                >
                  <Rewind className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer shadow-2xs active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSeekRelative(10)}
                  className="p-1.5 hover:bg-black/5 rounded-lg text-black cursor-pointer"
                  title="Forward 10s"
                >
                  <FastForward className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={stopAllPlayback}
                  className="p-1.5 text-black/50 hover:text-black rounded-lg cursor-pointer"
                  title="Stop"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Miniature scrubber */}
            <div className="w-full bg-black/10 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-200"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
