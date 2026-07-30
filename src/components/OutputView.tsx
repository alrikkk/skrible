import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { ShoppingChecklist } from "./ShoppingChecklist";
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Headphones,
  Layers,
  Bookmark,
  Share2,
  Download,
  Sparkles,
  Zap,
  RotateCcw
} from "lucide-react";

interface OutputViewProps {
  markdown: string;
  routeDetected: "notes" | "chef";
  onGenerateFlashcards: (markdown: string) => void;
  onSaveToHistory: (markdown: string, routeDetected: "notes" | "chef") => void;
  isSaved: boolean;
  onNewUntangle: () => void;
}

export const OutputView: React.FC<OutputViewProps> = ({
  markdown,
  routeDetected,
  onGenerateFlashcards,
  onSaveToHistory,
  isSaved,
  onNewUntangle,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Clean speech synthesis on unmount or when markdown changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [markdown]);

  // Web Speech API Read Aloud
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (isSpeaking || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown tags for smooth natural narration
    const cleanText = markdown
      .replace(/#{1,6}\s+/g, '') // strip headers
      .replace(/[*_~`]/g, '') // strip emphasis & code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip link tags
      .replace(/>\s+/g, '') // strip blockquotes
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // clear previous queue
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Markdown
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Web Share API for Social Sharing
  const handleShare = async () => {
    const title = routeDetected === "chef" ? "Skrible Dorm Chef Recipe" : "Skrible Untangled Notes";
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: markdown,
          url: window.location.href,
        });
      } catch (err) {
        // User aborted share or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n\n${markdown}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        alert("Sharing not supported on this browser.");
      }
    }
  };

  // Play Gemini TTS Audio
  const handleTTS = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: markdown }),
      });
      const data = await res.json();

      if (data.audio) {
        const audioSrc = `data:audio/wav;base64,${data.audio}`;
        const audio = new Audio(audioSrc);
        setAudioElement(audio);

        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      alert("Failed to generate audio readout.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Extract ingredients list if route is chef
  const extractIngredients = (text: string): string[] => {
    if (!text.includes("INGREDIENTS USED")) return [];
    const lines = text.split("\n");
    const ingredients: string[] = [];
    let inIngredients = false;

    for (const line of lines) {
      if (line.includes("INGREDIENTS USED")) {
        inIngredients = true;
        continue;
      }
      if (inIngredients && line.startsWith("## ")) {
        break;
      }
      if (inIngredients && (line.trim().startsWith("- ") || line.trim().startsWith("* "))) {
        const item = line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
        if (item) ingredients.push(item);
      }
    }
    return ingredients;
  };

  const ingredientsList = routeDetected === "chef" ? extractIngredients(markdown) : [];

  return (
    <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 font-sans">
      
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-4 border-black pb-4 mb-6">
        
        <div className="flex items-center gap-2">
          <span
            className={`font-black text-xs px-3 py-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider ${
              routeDetected === "chef"
                ? "bg-[#B5FFD9] text-black"
                : "bg-[#FF90E8] text-black"
            }`}
          >
            {routeDetected === "chef" ? "🍳 DORM CHEF OUTPUT" : "🧠 UNTANGLED NOTES"}
          </span>
          <span className="text-xs font-black text-black uppercase">
            STRICT ZERO-FLUFF DATA
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          <button
            onClick={handleReadAloud}
            className={`flex items-center gap-1.5 border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
              isSpeaking
                ? "bg-[#FF4500] text-white animate-pulse"
                : "bg-[#FFE600] hover:bg-yellow-300 text-black"
            }`}
            title="Read aloud using Web Speech API"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 stroke-[3]" /> : <Headphones className="w-4 h-4 stroke-[3]" />}
            {isSpeaking ? "STOP READING" : "READ ALOUD"}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-[#FFF4E0] hover:bg-amber-200 text-black border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Share with friends"
          >
            <Share2 className="w-4 h-4 stroke-[3]" />
            {shared ? "COPIED TO SHARE!" : "SHARE"}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white hover:bg-amber-100 text-black border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-green-600 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[3]" />}
            {copied ? "COPIED!" : "COPY RAW MD"}
          </button>

          <button
            onClick={handleTTS}
            disabled={isLoadingAudio}
            className="flex items-center gap-1.5 bg-[#00F5FF] hover:bg-[#00d8e6] text-black border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            {isLoadingAudio ? (
              <div className="w-4 h-4 border-3 border-black border-t-transparent animate-spin" />
            ) : isPlayingAudio ? (
              <VolumeX className="w-4 h-4 stroke-[3]" />
            ) : (
              <Volume2 className="w-4 h-4 stroke-[3]" />
            )}
            {isPlayingAudio ? "STOP AUDIO" : "LISTEN AUDIO"}
          </button>

          {routeDetected === "notes" && (
            <button
              onClick={() => onGenerateFlashcards(markdown)}
              className="flex items-center gap-1.5 bg-[#FF90E8] hover:bg-pink-300 text-black border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 stroke-[3]" /> FLASHCARDS
            </button>
          )}

          <button
            onClick={() => onSaveToHistory(markdown, routeDetected)}
            disabled={isSaved}
            className={`flex items-center gap-1.5 border-3 border-black px-3.5 py-1.5 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${
              isSaved
                ? "bg-gray-200 text-gray-600 cursor-default"
                : "bg-[#B5FFD9] hover:bg-[#8effbf] text-black active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
            }`}
          >
            <Bookmark className="w-4 h-4 stroke-[3]" />
            {isSaved ? "SAVED TO VAULT ✓" : "SAVE TO VAULT"}
          </button>

        </div>
      </div>

      {/* RAW MARKDOWN DISPLAY BOX WITH NEO-BRUTALISM STYLING */}
      <div className="prose max-w-none text-black">
        <Markdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl sm:text-4xl font-black text-black uppercase bg-[#FF90E8] border-4 border-black p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] my-4 leading-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-black bg-black text-white inline-block px-3 py-1 mt-6 mb-3 uppercase tracking-tight">
                {children}
              </h2>
            ),
            ul: ({ children }) => (
              <ul className="space-y-3 my-4 pl-0 list-none">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="flex items-start gap-3 bg-[#FFF4E0] border-3 border-black p-3.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold text-base text-black">
                <span className="inline-block w-3 h-3 bg-black mt-1.5 shrink-0" />
                <div className="flex-1">{children}</div>
              </li>
            ),
            ol: ({ children }) => (
              <ol className="space-y-3 my-4 pl-0 list-none">{children}</ol>
            ),
            p: ({ children }) => (
              <p className="text-base font-bold leading-relaxed my-3 text-black">
                {children}
              </p>
            ),
            strong: ({ children }) => (
              <strong className="font-black text-black bg-[#00F5FF] px-1.5 py-0.5 border border-black text-xs uppercase">
                {children}
              </strong>
            ),
          }}
        >
          {markdown}
        </Markdown>
      </div>

      {/* DORM CHEF SHOPPING CHECKLIST */}
      {routeDetected === "chef" && ingredientsList.length > 0 && (
        <ShoppingChecklist ingredients={ingredientsList} />
      )}

      {/* NEW UNTANGLE FOOTER */}
      <div className="mt-8 pt-4 border-t-4 border-black flex justify-end">
        <button
          onClick={onNewUntangle}
          className="bg-black text-white hover:bg-gray-800 border-4 border-black px-6 py-3 font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4 stroke-[3]" /> UNTANGLE SOMETHING ELSE
        </button>
      </div>

    </div>
  );
};
