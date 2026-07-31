import React, { useState, useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { PresetBar } from "./components/PresetBar";
import { InputPanel } from "./components/InputPanel";
import { OutputView } from "./components/OutputView";
import { FlashcardModal } from "./components/FlashcardModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { LoginScreen, UserProfile } from "./components/LoginScreen";
import { RouteMode, FileAttachment, UntangleHistoryItem, Flashcard, PresetSample } from "./types";
import { Zap, Brain, Utensils, Sparkles, BookOpen, ArrowLeft, RefreshCw, History, Home, ArrowRight, User, LogOut } from "lucide-react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "login" | "workspace">("home");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
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

  // Load history and user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("skrible_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
      const savedUser = localStorage.getItem("skrible_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("skrible_user", JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user to localStorage", e);
    }
    setCurrentPage("workspace");
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("skrible_user");
    } catch (e) {
      console.error("Failed to remove user from localStorage", e);
    }
    setCurrentPage("login");
  };

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
    setCurrentPage("workspace");
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
      
      {currentPage === "home" ? (
        /* Landing Page View with Hero & Lets Start Button */
        <div>
          <HeroSection
            historyCount={history.length}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onReset={handleReset}
            onStart={() => setCurrentPage("login")}
          />
        </div>
      ) : currentPage === "login" ? (
        /* Login Screen View */
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => setCurrentPage("home")}
        />
      ) : (
        /* Workspace Webpage View */
        <div>
          {/* Header Navigation for Workspace Page */}
          <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-black/10 py-4 px-4 sm:px-8">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage("home")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black hover:text-[#ec4899] bg-white border border-black/20 rounded-lg shadow-2xs hover:border-[#ec4899] transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </button>

                <div className="h-4 w-px bg-black/15 hidden sm:block" />

                <button
                  onClick={() => setCurrentPage("home")}
                  className="flex items-center gap-2 text-xl font-extrabold text-black font-sans lowercase hover:text-[#ec4899] transition-colors cursor-pointer"
                >
                  <img 
                    src="/assets/scribble.webp" 
                    alt="skrible logo" 
                    className="h-7 w-auto object-contain shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <span>skrible</span>
                </button>
                <span className="text-xs font-mono text-black/50 hidden md:inline">
                  / untangler tool
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Profile Badge */}
                {currentUser ? (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-black/15 rounded-lg text-xs font-medium shadow-2xs">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#ec4899] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline font-mono font-semibold max-w-[110px] truncate">{currentUser.name}</span>
                    <button
                      onClick={handleSignOut}
                      className="text-black/50 hover:text-black p-0.5 rounded transition-colors cursor-pointer ml-0.5"
                      title="Sign Out / Switch Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentPage("login")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-stone-100 border border-black/20 rounded-lg cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:text-black bg-white hover:bg-black/5 border border-black/20 rounded-lg transition-all cursor-pointer"
                  title="Clear all inputs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">reset</span>
                </button>

                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-black hover:bg-[#ec4899] rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>saved vault ({history.length})</span>
                </button>
              </div>
            </div>
          </header>

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
        </div>
      )}

      {/* Footer Notice */}
      <footer className="w-full py-8 text-center mt-12 border-t border-gray-200 flex flex-col items-center gap-2">
        {currentPage === "workspace" && (
          <button
            onClick={() => setCurrentPage("home")}
            className="text-xs font-medium text-black/60 hover:text-[#ec4899] underline underline-offset-4 cursor-pointer mb-1"
          >
            ← Return to Landing Page
          </button>
        )}
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
          setCurrentPage("workspace");
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
