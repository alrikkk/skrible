import React, { useState, useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { PresetBar } from "./components/PresetBar";
import { InputPanel } from "./components/InputPanel";
import { OutputView } from "./components/OutputView";
import { FlashcardModal } from "./components/FlashcardModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { RouteMode, FileAttachment, UntangleHistoryItem, Flashcard, PresetSample } from "./types";
import { Zap, Brain, Utensils, Sparkles, BookOpen } from "lucide-react";

export default function App() {
  const [route, setRoute] = useState<RouteMode>("auto");
  const [promptText, setPromptText] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [audioAttachment, setAudioAttachment] = useState<FileAttachment | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [outputMarkdown, setOutputMarkdown] = useState<string>("");
  const [routeDetected, setRouteDetected] = useState<"notes" | "chef">("notes");

  // History & Storage
  const [history, setHistory] = useState<UntangleHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState<boolean>(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("skrible_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updatedHistory: UntangleHistoryItem[]) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem("skrible_history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  };

  // Load Preset
  const handleSelectPreset = (preset: PresetSample) => {
    setRoute(preset.route);
    setPromptText(preset.prompt);
    setBudget(preset.budget || "");
    setFiles(preset.files || []);
    setAudioAttachment(null);
    setOutputMarkdown("");
    setIsSaved(false);
  };

  // Submit Untangle
  const handleUntangle = async () => {
    setIsLoading(true);
    setOutputMarkdown("");
    setIsSaved(false);

    try {
      const payload = {
        prompt: promptText,
        route,
        budget,
        files: files.map((f) => ({ data: f.data, mimeType: f.mimeType })),
        audio: audioAttachment
          ? { data: audioAttachment.data, mimeType: audioAttachment.mimeType }
          : null,
      };

      const response = await fetch("/api/untangle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process untangle request.");
      }

      setOutputMarkdown(data.result);
      setRouteDetected(data.routeDetected || (route === "chef" ? "chef" : "notes"));
    } catch (error: any) {
      alert(error.message || "An error occurred while communicating with Skrible AI.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save to history vault
  const handleSaveToHistory = (markdown: string, routeDet: "notes" | "chef", tags?: string[]) => {
    if (!markdown) return;

    // Extract title from markdown
    const firstLine = markdown.split("\n")[0] || "";
    const cleanTitle = firstLine.replace(/^[#\s]+/, "").trim() || (routeDet === "chef" ? "Dorm Chef Recipe" : "Untangled Note");

    const itemTags = tags && tags.length > 0 ? tags : [routeDet === "chef" ? "Recipe" : "Study Note"];

    const newItem: UntangleHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: cleanTitle,
      inputPrompt: promptText,
      inputType: files.length > 0 ? "image" : audioAttachment ? "audio" : "text",
      routeDetected: routeDet,
      outputMarkdown: markdown,
      budget,
      tags: itemTags,
    };

    const updated = [newItem, ...history];
    saveHistoryToStorage(updated);
    setIsSaved(true);
  };

  // Generate Flashcards
  const handleGenerateFlashcards = async (markdownNote: string) => {
    try {
      setIsLoadingFlashcards(true);
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdownNote }),
      });
      const data = await res.json();

      if (data.flashcards) {
        setFlashcards(data.flashcards);
        setIsFlashcardsOpen(true);
      }
    } catch (e) {
      alert("Failed to generate flashcards.");
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  // Reset inputs
  const handleReset = () => {
    setPromptText("");
    setBudget("");
    setFiles([]);
    setAudioAttachment(null);
    setOutputMarkdown("");
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black font-sans selection:bg-[#ec4899] selection:text-white pb-16">
      
      {/* Hero Section */}
      <HeroSection
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Preset Selector */}
        <PresetBar onSelectPreset={handleSelectPreset} />

        {/* Input Panel */}
        <InputPanel
          route={route}
          setRoute={setRoute}
          promptText={promptText}
          setPromptText={setPromptText}
          budget={budget}
          setBudget={setBudget}
          files={files}
          setFiles={setFiles}
          audioAttachment={audioAttachment}
          setAudioAttachment={setAudioAttachment}
          onSubmit={handleUntangle}
          isLoading={isLoading}
        />

        {/* Output Section */}
        {outputMarkdown && (
          <OutputView
            markdown={outputMarkdown}
            routeDetected={routeDetected}
            onGenerateFlashcards={handleGenerateFlashcards}
            onSaveToHistory={handleSaveToHistory}
            isSaved={isSaved}
            onNewUntangle={handleReset}
          />
        )}

      </main>

      {/* Footer Notice */}
      <footer className="w-full py-8 text-center mt-12 border-t border-gray-200">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 select-none">
          This is not Ai Slop
        </p>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistory={(item) => {
          setOutputMarkdown(item.outputMarkdown);
          setRouteDetected(item.routeDetected);
          setPromptText(item.inputPrompt);
          if (item.budget) setBudget(item.budget);
          setIsSaved(true);
        }}
        onDeleteHistory={(id) => {
          const updated = history.filter((h) => h.id !== id);
          saveHistoryToStorage(updated);
        }}
        onClearAll={() => {
          if (confirm("Clear all saved untangled notes and recipes?")) {
            saveHistoryToStorage([]);
          }
        }}
      />

      {/* Flashcard Modal */}
      {isFlashcardsOpen && (
        <FlashcardModal
          flashcards={flashcards}
          onClose={() => setIsFlashcardsOpen(false)}
        />
      )}

      {/* Flashcard Loading Overlay */}
      {isLoadingFlashcards && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FF90E8] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 font-black text-black text-lg uppercase">
            <div className="w-6 h-6 border-4 border-black border-t-transparent animate-spin" />
            <span>GENERATING STUDY CRAM FLASHCARDS...</span>
          </div>
        </div>
      )}

    </div>
  );
}
