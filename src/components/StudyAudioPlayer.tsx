import React, { useState, useEffect, useRef, useMemo } from "react";
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
  X,
  Radio,
  BookOpen,
  SkipBack,
  SkipForward,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface StudyAudioPlayerProps {
  markdown: string;
  topicTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  onPlaybackChange?: (isPlaying: boolean, speed: number) => void;
  getAuthHeaders?: () => Promise<Record<string, string>>;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const StudyAudioPlayer: React.FC<StudyAudioPlayerProps> = ({
  markdown,
  topicTitle = "Untangled Study Note",
  isOpen,
  onClose,
  autoPlay = false,
  onPlaybackChange,
  getAuthHeaders,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.25);
  const [pitch, setPitch] = useState<number>(1.0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [readingMode, setReadingMode] = useState<"full" | "summary">("full");
  const [speechEngine, setSpeechEngine] = useState<"browser" | "gemini">("browser");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);

  // Gemini cloud audio state (optional secondary engine)
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [geminiAudioUrl, setGeminiAudioUrl] = useState<string | null>(null);
  const [geminiTime, setGeminiTime] = useState<number>(0);
  const [geminiDuration, setGeminiDuration] = useState<number>(0);
  const [selectedGeminiVoice, setSelectedGeminiVoice] = useState("Zephyr");

  // Web Speech API voices
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sentencesRef = useRef<string[]>([]);

  // Extract clean readable text from markdown
  const cleanMarkdownText = useMemo(() => {
    if (!markdown) return "";
    let clean = markdown
      .replace(/^---\s*[\s\S]*?---\s*/g, "") // YAML frontmatter
      .replace(/<[^>]*>/g, "") // HTML tags
      .replace(/```[\s\S]*?```/g, "") // Code blocks
      .replace(/`[^`]+`/g, "") // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links [text](url) -> text
      .replace(/^#{1,6}\s*(.+)$/gm, "$1. ") // Headings to complete sentences with period
      .replace(/^\s*[-*+]\s+/gm, "") // List bullets
      .replace(/^\s*\d+\.\s+/gm, "") // Numbered lists
      .replace(/(\*\*|__)(.*?)\1/g, "$2") // Bold
      .replace(/(\*|_)(.*?)\1/g, "$2") // Italic
      .replace(/~~(.*?)~~/g, "$1") // Strikethrough
      .replace(/[|*~_`#]/g, "") // Remaining symbols
      .replace(/\s+/g, " ")
      .trim();

    if (readingMode === "summary") {
      // Concise mode for quick commute / walk listening
      return clean.slice(0, 1400);
    }
    return clean;
  }, [markdown, readingMode]);

  // Split into sentence chunks for rock-solid continuous Web Speech API playback
  const sentences = useMemo(() => {
    if (!cleanMarkdownText) return [];
    const split = cleanMarkdownText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return split.length > 0 ? split : [cleanMarkdownText];
  }, [cleanMarkdownText]);

  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);

  // Load browser voices from Web Speech API
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setBrowserVoices(available);
          setSelectedVoiceURI((prev) => {
            if (prev && available.some((v) => v.voiceURI === prev)) {
              return prev;
            }
            // Prioritize English natural voices (e.g., Google US, Samantha, Daniel, Siri)
            const english = available.filter((v) => v.lang.startsWith("en"));
            const natural =
              english.find(
                (v) =>
                  v.name.includes("Natural") ||
                  v.name.includes("Google") ||
                  v.name.includes("Samantha") ||
                  v.name.includes("Daniel") ||
                  v.name.includes("Siri") ||
                  v.name.includes("Karen")
              ) ||
              english.find((v) => v.default) ||
              english[0] ||
              available.find((v) => v.default) ||
              available[0];
            return natural ? natural.voiceURI : "";
          });
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Web Speech API Playback Handler
  const playBrowserSpeech = (index: number, speedOverride?: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatusMessage("Web Speech API is not supported on this browser.");
      return;
    }

    const currentSentences = sentencesRef.current;
    if (!currentSentences || currentSentences.length === 0) {
      setStatusMessage("No text available to read aloud.");
      return;
    }

    if (index >= currentSentences.length || index < 0) {
      // Completed reading all notes
      setIsPlaying(false);
      setCurrentIndex(0);
      onPlaybackChange?.(false, playbackSpeed);
      return;
    }

    // Cancel any active utterance before starting the next
    window.speechSynthesis.cancel();

    setCurrentIndex(index);
    const chunk = currentSentences[index];
    const utterance = new SpeechSynthesisUtterance(chunk);
    const currentRate = speedOverride !== undefined ? speedOverride : playbackSpeed;
    utterance.rate = currentRate;
    utterance.pitch = pitch;

    if (selectedVoiceURI) {
      const match = browserVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onend = () => {
      if (index + 1 < sentencesRef.current.length) {
        playBrowserSpeech(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
        onPlaybackChange?.(false, currentRate);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("[WebSpeech] Utterance error:", e);
      }
      setIsPlaying(false);
      onPlaybackChange?.(false, currentRate);
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    onPlaybackChange?.(true, currentRate);
  };

  // Chrome keepalive: Chrome bug causes SpeechSynthesis to pause after ~15s
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && speechEngine === "browser") {
      timer = setInterval(() => {
        if (
          typeof window !== "undefined" &&
          "speechSynthesis" in window &&
          window.speechSynthesis.speaking
        ) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speechEngine]);

  // Stop all active playback (both browser Web Speech and Gemini audio)
  const stopAllPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentIndex(0);
    onPlaybackChange?.(false, playbackSpeed);
  };

  // Play / Pause Toggle
  const handleTogglePlay = () => {
    if (speechEngine === "browser") {
      if (isPlaying) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        onPlaybackChange?.(false, playbackSpeed);
      } else {
        playBrowserSpeech(currentIndex);
      }
    } else {
      // Gemini cloud engine
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        onPlaybackChange?.(false, playbackSpeed);
      } else if (audioRef.current && geminiAudioUrl) {
        audioRef.current.play();
        setIsPlaying(true);
        onPlaybackChange?.(true, playbackSpeed);
      } else {
        generateAndPlayGeminiAudio();
      }
    }
  };

  // Change playback speed dynamically without losing position
  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (speechEngine === "browser" && isPlaying) {
      playBrowserSpeech(currentIndex, newSpeed);
    } else if (speechEngine === "gemini" && audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    onPlaybackChange?.(isPlaying, newSpeed);
  };

  // Previous Sentence
  const handlePrevSentence = () => {
    if (speechEngine === "browser") {
      const prev = Math.max(0, currentIndex - 1);
      setCurrentIndex(prev);
      if (isPlaying) {
        playBrowserSpeech(prev);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  // Next Sentence
  const handleNextSentence = () => {
    if (speechEngine === "browser") {
      const next = Math.min(sentences.length - 1, currentIndex + 1);
      setCurrentIndex(next);
      if (isPlaying) {
        playBrowserSpeech(next);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.min(geminiDuration, audioRef.current.currentTime + 10);
    }
  };

  // Scrubber / Sentence Jump
  const handleSentenceScrubber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetIdx = parseInt(e.target.value, 10);
    setCurrentIndex(targetIdx);
    if (speechEngine === "browser" && isPlaying) {
      playBrowserSpeech(targetIdx);
    }
  };

  // Optional Gemini Cloud TTS Generator
  const generateAndPlayGeminiAudio = async () => {
    setIsLoadingGemini(true);
    setStatusMessage("Generating Gemini AI voice audio...");

    try {
      let authHeaders: Record<string, string> = { "X-Guest-Mode": "true" };
      if (getAuthHeaders) {
        try {
          const headers = await getAuthHeaders();
          authHeaders = { ...authHeaders, ...headers };
        } catch {
          // fallback
        }
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          text: cleanMarkdownText,
          voiceName: selectedGeminiVoice,
          mode: readingMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audio) {
        throw new Error(data.error || "Failed to generate AI speech.");
      }

      const byteCharacters = atob(data.audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || "audio/wav" });
      const newUrl = URL.createObjectURL(blob);

      if (geminiAudioUrl) {
        URL.revokeObjectURL(geminiAudioUrl);
      }
      setGeminiAudioUrl(newUrl);

      const audio = new Audio(newUrl);
      audio.playbackRate = playbackSpeed;
      audio.onloadedmetadata = () => setGeminiDuration(audio.duration || 0);
      audio.ontimeupdate = () => setGeminiTime(audio.currentTime || 0);
      audio.onended = () => {
        setIsPlaying(false);
        onPlaybackChange?.(false, playbackSpeed);
      };
      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
      onPlaybackChange?.(true, playbackSpeed);
      setStatusMessage(null);
    } catch (err: any) {
      console.warn("[TTS] Falling back to Web Speech API:", err.message);
      setStatusMessage("Switched to instant Web Speech API reader.");
      setTimeout(() => setStatusMessage(null), 3000);
      setSpeechEngine("browser");
      playBrowserSpeech(currentIndex);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  // AutoPlay when component is opened with autoPlay=true
  useEffect(() => {
    if (isOpen && autoPlay && sentences.length > 0) {
      const timer = setTimeout(() => {
        playBrowserSpeech(0);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPlay, markdown, readingMode]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopAllPlayback();
      if (geminiAudioUrl) {
        URL.revokeObjectURL(geminiAudioUrl);
      }
    };
  }, []);

  const selectedVoiceName = useMemo(() => {
    if (speechEngine === "browser") {
      const v = browserVoices.find((voice) => voice.voiceURI === selectedVoiceURI);
      return v ? v.name : "Device Voice";
    }
    return selectedGeminiVoice;
  }, [speechEngine, browserVoices, selectedVoiceURI, selectedGeminiVoice]);

  // English or current device voice options
  const englishVoices = useMemo(() => {
    return browserVoices.filter((v) => v.lang.startsWith("en") || v.default);
  }, [browserVoices]);

  if (!isOpen) return null;

  const currentSentenceText = sentences[currentIndex] || cleanMarkdownText.slice(0, 100);

  return (
    <div className="w-full mb-6">
      {/* MAIN STUDY AUDIO PLAYER CARD */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-black tracking-tight flex items-center gap-1.5">
                  <span>Audio Study Companion</span>
                  <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-300">
                    Web Speech API
                  </span>
                </h4>
                {speechEngine === "browser" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Instant On-Device Voice</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-black/60 font-medium">
                Listen to your untangled notes hands-free while walking, commuting, or studying.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                stopAllPlayback();
                onClose();
              }}
              className="p-1.5 text-black/50 hover:text-black hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
              title="Close audio companion"
              aria-label="Close"
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

        {/* Live Sentence Read-Along (Study Display) */}
        <div className="mb-3.5 p-3 sm:p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-900 font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-purple-600" />
              <span>
                Reading Sentence {currentIndex + 1} of {sentences.length || 1} (
                {Math.round(((currentIndex + 1) / (sentences.length || 1)) * 100)}%)
              </span>
            </span>
            <span className="text-[10px] font-mono text-purple-700/70">
              {playbackSpeed}x speed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black font-medium leading-relaxed italic bg-white/80 p-2.5 rounded-lg border border-purple-200/60 shadow-2xs">
            "{currentSentenceText}"
          </p>
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] border border-black/15 rounded-xl p-3 sm:p-4">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSentence}
              disabled={currentIndex === 0}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Previous sentence"
              aria-label="Previous sentence"
            >
              <SkipBack className="w-4 h-4 text-black/70" />
            </button>

            <button
              type="button"
              id="study-audio-play-toggle"
              onClick={handleTogglePlay}
              disabled={isLoadingGemini}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                isPlaying
                  ? "bg-amber-400 hover:bg-amber-500 text-black"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {isLoadingGemini ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Preparing...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : currentIndex > 0 ? (
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
              onClick={handleNextSentence}
              disabled={currentIndex >= sentences.length - 1}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Next sentence"
              aria-label="Next sentence"
            >
              <SkipForward className="w-4 h-4 text-black/70" />
            </button>

            <button
              type="button"
              onClick={stopAllPlayback}
              disabled={!isPlaying && currentIndex === 0}
              className="p-2 bg-white hover:bg-black/5 disabled:opacity-40 text-black border border-black/15 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Reset to start of notes"
              aria-label="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5 text-black/70" />
            </button>
          </div>

          {/* Sentence Scrubber & Progress */}
          <div className="flex-1 w-full sm:mx-3 flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-black/70 min-w-[36px] text-right">
              {currentIndex + 1}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(0, sentences.length - 1)}
              step={1}
              value={currentIndex}
              onChange={handleSentenceScrubber}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-black/10 rounded-full"
              title="Jump to sentence"
            />
            <span className="font-mono text-xs font-bold text-black/50 min-w-[36px]">
              {sentences.length}
            </span>
          </div>

          {/* Audio Equalizer Visualizer */}
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
                onClick={() => handleSpeedChange(spd)}
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
              className="flex items-center gap-1.5 bg-white hover:bg-black/5 text-black border border-black/15 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer max-w-[200px] truncate"
              title="Select speech voice"
            >
              <Radio className="w-3 h-3 text-purple-600 shrink-0" />
              <span className="truncate">
                Voice: <strong>{selectedVoiceName}</strong>
              </span>
              <ChevronDown className="w-3 h-3 text-black/50 shrink-0" />
            </button>

            {isVoicePickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border-2 border-black rounded-xl p-2 shadow-xl z-30 space-y-1 animate-fadeIn max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-black/10">
                  <span className="text-[10px] font-mono uppercase text-black/60 font-bold">
                    Browser Web Speech Voices
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 font-semibold">
                    {englishVoices.length || browserVoices.length} voices
                  </span>
                </div>

                {(englishVoices.length > 0 ? englishVoices : browserVoices).map((v) => (
                  <button
                    key={v.voiceURI}
                    type="button"
                    onClick={() => {
                      setSelectedVoiceURI(v.voiceURI);
                      setIsVoicePickerOpen(false);
                      if (isPlaying) {
                        playBrowserSpeech(currentIndex);
                      }
                    }}
                    className={`w-full text-left p-1.5 rounded-lg text-xs flex flex-col cursor-pointer transition-colors ${
                      selectedVoiceURI === v.voiceURI
                        ? "bg-purple-50 text-purple-950 font-bold border border-purple-300"
                        : "hover:bg-black/5 text-black"
                    }`}
                  >
                    <span className="truncate font-medium">{v.name}</span>
                    <span className="text-[10px] text-black/50 font-normal">
                      {v.lang} {v.default ? "• Default" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* FLOATING ON-THE-GO BOTTOM BAR (Visible when playing while scrolling down) */}
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
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-black truncate leading-tight">
                    {topicTitle}
                  </p>
                  <p className="text-[10px] font-mono text-black/60 truncate flex items-center gap-1.5">
                    <span>
                      Sentence {currentIndex + 1}/{sentences.length}
                    </span>
                    <span>•</span>
                    <span className="text-purple-700 font-bold">{playbackSpeed}x</span>
                  </p>
                </div>
              </div>

              {/* Quick Play/Pause & Skip */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevSentence}
                  disabled={currentIndex === 0}
                  className="p-1.5 hover:bg-black/5 disabled:opacity-30 rounded-lg text-black cursor-pointer"
                  title="Previous sentence"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer shadow-2xs active:scale-95"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextSentence}
                  disabled={currentIndex >= sentences.length - 1}
                  className="p-1.5 hover:bg-black/5 disabled:opacity-30 rounded-lg text-black cursor-pointer"
                  title="Next sentence"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={stopAllPlayback}
                  className="p-1.5 text-black/50 hover:text-black rounded-lg cursor-pointer"
                  title="Stop playback"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Read-along sentence preview */}
            <p className="text-[11px] text-black/75 truncate mt-1.5 italic bg-black/5 px-2 py-0.5 rounded">
              "{currentSentenceText}"
            </p>

            {/* Miniature scrubber bar */}
            <div className="w-full bg-black/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-200"
                style={{
                  width: `${
                    sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
