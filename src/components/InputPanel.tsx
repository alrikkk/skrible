import React, { useState, useRef } from "react";
import { RouteMode, FileAttachment } from "../types";
import {
  Brain,
  Utensils,
  Zap,
  FileText,
  Camera,
  Mic,
  MicOff,
  Radio,
  Upload,
  X,
  DollarSign,
  Play,
  Square,
  Sparkles,
  Paperclip,
  Trash2,
  FlaskConical,
  Receipt
} from "lucide-react";

interface InputPanelProps {
  route: RouteMode;
  setRoute: (route: RouteMode) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  budget: string;
  setBudget: (budget: string) => void;
  files: FileAttachment[];
  setFiles: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
  audioAttachment: FileAttachment | null;
  setAudioAttachment: (audio: FileAttachment | null) => void;
  onSubmit: (overrideRoute?: "notes" | "chef") => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  route,
  setRoute,
  promptText,
  setPromptText,
  budget,
  setBudget,
  files,
  setFiles,
  audioAttachment,
  setAudioAttachment,
  onSubmit,
  isLoading,
}) => {
  const [noteTab, setNoteTab] = useState<"text" | "photo" | "audio">("text");
  const [chefTab, setChefTab] = useState<"text" | "photo" | "audio">("text");

  // Audio recording & Speech-to-Text dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const basePromptRef = useRef<string>("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chefImageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Drag-and-drop state & counters
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);
  const [isDraggingChef, setIsDraggingChef] = useState(false);
  const notesDragCounter = useRef(0);
  const chefDragCounter = useRef(0);

  // Unified file processor for inputs and drag-and-drop
  const processFiles = (fileList: FileList | File[], targetDestination?: "notes" | "chef") => {
    const incomingFiles = Array.from(fileList);
    if (incomingFiles.length === 0) return;

    if (targetDestination === "notes") {
      setNoteTab("photo");
      if (route === "auto") setRoute("notes");
    } else if (targetDestination === "chef") {
      setChefTab("photo");
      if (route === "auto") setRoute("chef");
    }

    incomingFiles.forEach((file) => {
      // If it's a text/markdown file, append directly to prompt text
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            setPromptText(promptText ? `${promptText}\n\n${text}` : text);
          }
        };
        reader.readAsText(file);
        return;
      }

      // If it's an audio file, attach as audio
      if (file.type.startsWith("audio/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setAudioAttachment({
            name: file.name,
            mimeType: file.type || "audio/mp3",
            data: base64,
          });
        };
        reader.readAsDataURL(file);
        if (targetDestination === "notes") setNoteTab("audio");
        return;
      }

      // Images (whiteboard photos, receipt photos, fridge photos, screenshots)
      if (
        file.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic)$/i.test(file.name)
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type || "image/png",
              data: base64,
              previewUrl: base64,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // File input change handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  // Drag-and-drop event handlers for Note Cram column
  const handleNotesDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    notesDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingNotes(true);
    }
  };

  const handleNotesDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleNotesDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    notesDragCounter.current -= 1;
    if (notesDragCounter.current <= 0) {
      notesDragCounter.current = 0;
      setIsDraggingNotes(false);
    }
  };

  const handleNotesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    notesDragCounter.current = 0;
    setIsDraggingNotes(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, "notes");
    }
  };

  // Drag-and-drop event handlers for The Cook column
  const handleChefDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chefDragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingChef(true);
    }
  };

  const handleChefDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleChefDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chefDragCounter.current -= 1;
    if (chefDragCounter.current <= 0) {
      chefDragCounter.current = 0;
      setIsDraggingChef(false);
    }
  };

  const handleChefDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    chefDragCounter.current = 0;
    setIsDraggingChef(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, "chef");
    }
  };

  // Audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAudioAttachment({
        name: file.name,
        mimeType: file.type || "audio/mp3",
        data: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // Live Microphone Recording with Real-time Speech-to-Text
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioAttachment({
            name: `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
            mimeType: "audio/webm",
            data: base64data,
          });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setInterimTranscript("");

      // Store initial text before starting dictation
      basePromptRef.current = promptText;

      // Initialize Web Speech API for real-time dictation if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          let accumulatedFinal = "";

          recognition.onresult = (event: any) => {
            let currentInterim = "";
            let newFinalChunk = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const textChunk = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                newFinalChunk += textChunk + " ";
              } else {
                currentInterim += textChunk;
              }
            }

            if (newFinalChunk) {
              accumulatedFinal += newFinalChunk;
              const updatedPrompt = basePromptRef.current
                ? `${basePromptRef.current} ${accumulatedFinal}`.trim()
                : accumulatedFinal.trim();
              setPromptText(updatedPrompt);
            }

            setInterimTranscript(currentInterim);
          };

          recognition.onerror = (e: any) => {
            console.warn("Speech recognition notice:", e.error);
          };

          recognition.onend = () => {
            // Restart speech recognition if media recorder is still actively recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                recognition.start();
              } catch (_) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn("Speech recognition unavailable in browser, continuing with media recorder audio memo:", err);
        }
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setMicError("Microphone access is required for voice recording and dictation. Please allow microphone access in your browser.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setInterimTranscript("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const removeAudio = () => {
    setAudioAttachment(null);
  };

  const hasInput = promptText.trim().length > 0 || files.length > 0 || audioAttachment !== null;

  const handleNoteSubmit = () => {
    setRoute("notes");
    onSubmit("notes");
  };

  const handleChefSubmit = () => {
    setRoute("chef");
    onSubmit("chef");
  };

  return (
    <div
      className="w-full mb-8 font-sans"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        // Prevent default browser behavior of opening image as link
        e.preventDefault();
      }}
    >
      
      {/* HIDDEN FILE INPUTS */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={chefImageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleAudioUpload}
        accept="audio/*"
        className="hidden"
      />

      {/* MODE SELECTION BLOCK (FOOTER/TOP CONTROLLER) */}
      <div className="bg-white border border-black/15 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
        <label className="block text-xs font-semibold text-black/60 mb-3 tracking-wider">
          CHOOSE UNTANGLER MODE
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <button
            type="button"
            onClick={() => setRoute("auto")}
            className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "auto"
                ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Zap className={`w-4 h-4 ${route === "auto" ? "text-amber-400" : "text-amber-500"}`} />
            <span>auto-detect</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("notes")}
            className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "notes"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Brain className={`w-4 h-4 ${route === "notes" ? "text-indigo-100" : "text-indigo-600"}`} />
            <span>Note Cram</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("chef")}
            className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "chef"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Utensils className={`w-4 h-4 ${route === "chef" ? "text-amber-100" : "text-amber-600"}`} />
            <span>The Cook</span>
          </button>
        </div>

        {/* Drag-and-drop quick hint */}
        <div className="mt-3.5 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
          <div className="flex items-center gap-1.5 font-medium">
            <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Drag & drop whiteboard photos or grocery receipts directly onto either panel</span>
          </div>
          <span className="text-[11px] font-mono text-black/50">
            {files.length > 0 ? (
              <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                ✓ {files.length} photo{files.length > 1 ? "s" : ""} attached
              </span>
            ) : (
              "PNG • JPG • WEBP • screenshots"
            )}
          </span>
        </div>
      </div>

      {/* CRITICAL RESPONSIVE TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: NOTE ENGINE FEATURES & TEMPLATES */}
        {/* ========================================================= */}
        <div
          onDragEnter={handleNotesDragEnter}
          onDragOver={handleNotesDragOver}
          onDragLeave={handleNotesDragLeave}
          onDrop={handleNotesDrop}
          className={`relative bg-white border rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between transition-all overflow-hidden ${
            isDraggingNotes
              ? "border-indigo-500 ring-4 ring-indigo-200 bg-indigo-50/20 scale-[1.008]"
              : route === "notes"
              ? "border-indigo-600 ring-2 ring-indigo-500"
              : "border-black/15"
          }`}
        >
          {/* Active Drag Overlay for Note Cram */}
          {isDraggingNotes && (
            <div className="absolute inset-0 z-30 bg-indigo-950/92 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none transition-all">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl mb-3 animate-bounce border border-indigo-400">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Drop Whiteboard or Note Photos Here
              </h4>
              <p className="text-xs text-indigo-200 mt-1.5 max-w-xs leading-relaxed">
                Release to attach and untangle handwritten notes, whiteboard formulas & diagrams
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/30">
                  Whiteboards • Paper Notes • Slides
                </span>
              </div>
            </div>
          )}
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black leading-tight">
                    Note Cram
                  </h3>
                  <p className="text-xs text-black/50">
                    study notes & cram sheets
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase font-semibold">
                academic
              </span>
            </div>

            {/* Note Engine Templates & Presets */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-black/60 mb-2">
                quick templates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoute("notes");
                    setPromptText(`Prof spent 45 min on SN2 mechanisms. Primary alkyl halide reacts with strong nucleophile like OH- in bimolecular transition state. Inversion of stereochemistry occurs (Walden inversion). Polar aprotic solvents like DMSO favor SN2. Rate = k[substrate][nucleophile]. Steric hindrance slows it down. Tertiary halides DO NOT undergo SN2!`);
                  }}
                  className="text-left bg-[#FAF8F5] hover:bg-purple-50/70 border border-black/10 hover:border-purple-300 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>o-chem SN2 mechanism</span>
                  </p>
                  <span className="text-[11px] text-black/50 line-clamp-1 mt-0.5">
                    messy whiteboard scribbles
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoute("notes");
                    setPromptText(`Voice transcript: "Midterm review: demand curve shifts from non-price factors like income, preferences, substitutes. Movement ALONG demand curve is ONLY price change. Supply slopes up due to marginal opportunity cost. Price ceilings cause shortages, floors cause surpluses."`);
                  }}
                  className="text-left bg-[#FAF8F5] hover:bg-rose-50/70 border border-black/10 hover:border-rose-300 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>econ 101 memo</span>
                  </p>
                  <span className="text-[11px] text-black/50 line-clamp-1 mt-0.5">
                    supply/demand transcript
                  </span>
                </button>
              </div>
            </div>

            {/* Note Modality Selector */}
            <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-xs font-medium text-black/60">input source:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setNoteTab("text")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    noteTab === "text" ? "bg-black text-white" : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  text
                </button>
                <button
                  type="button"
                  onClick={() => setNoteTab("photo")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    noteTab === "photo" ? "bg-black text-white" : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  photo ({files.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNoteTab("audio")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    noteTab === "audio" ? "bg-black text-white" : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  voice
                </button>
              </div>
            </div>

            {/* Mic Error Banner if any */}
            {micError && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
                <span>{micError}</span>
                <button
                  type="button"
                  onClick={() => setMicError(null)}
                  className="text-amber-800 hover:text-black font-bold p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Note Input Field */}
            {noteTab === "text" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-black/50">
                    type or dictate lecture notes:
                  </label>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? `Dictating live (${recordingTime}s)` : "Dictate notes (speech-to-text)"}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isRecording
                        ? "bg-rose-600 text-white border border-rose-600 animate-pulse"
                        : "bg-white hover:bg-rose-50 text-black border border-black/15 shadow-2xs"
                    }`}
                  >
                    {isRecording ? <Radio className="w-4 h-4 text-white animate-spin" /> : <Mic className="w-4 h-4 text-rose-500" />}
                  </button>
                </div>

                <textarea
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    if (route === "auto") setRoute("notes");
                  }}
                  placeholder="Paste messy lecture notes, whiteboard transcript, study sheet, or dictate directly into prompt..."
                  rows={5}
                  className="w-full p-3.5 border border-black/15 rounded-xl font-medium text-xs sm:text-sm text-black focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-y bg-[#FAF8F5] mb-2 placeholder:text-black/40"
                />

                {isRecording && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-950">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="font-semibold text-rose-700 shrink-0">Speech-to-Text:</span>
                      <span className="text-black/80 italic truncate">{interimTranscript || "Listening... speak clearly into mic"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-black text-white px-2 py-0.5 text-[10px] font-semibold rounded shrink-0 hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      done
                    </button>
                  </div>
                )}
              </div>
            )}

            {noteTab === "photo" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFiles(e.dataTransfer.files, "notes");
                  }
                }}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl p-3.5 mb-3 bg-[#FAF8F5] text-center transition-all group"
              >
                {files.length === 0 ? (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="cursor-pointer py-3.5 px-2 hover:bg-indigo-50/50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-2 text-indigo-600 group-hover:scale-105 transition-transform shadow-2xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-xs text-black">
                      Drag & drop photos of whiteboards or lecture notes here
                    </p>
                    <p className="text-[11px] text-black/60 mt-0.5">
                      or <span className="text-indigo-600 font-medium underline">browse from your computer</span>
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      📸 whiteboard scribbles • math equations • slide photos
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 text-xs">
                      <span className="font-semibold text-black flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{files.length} photo{files.length > 1 ? "s" : ""} attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative group border border-black/15 rounded-lg bg-white p-1 overflow-hidden shadow-2xs">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover rounded" />
                          <p className="text-[9px] text-black/70 truncate mt-1 text-left px-0.5 font-mono">
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer transition-colors shadow-xs"
                            title="Remove photo"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full bg-white hover:bg-indigo-50/50 border border-black/15 hover:border-indigo-400 py-1.5 px-2 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-black"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>+ drop or add more whiteboard photos</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {noteTab === "audio" && (
              <div className="border border-dashed border-black/20 rounded-xl p-4 mb-3 bg-[#FAF8F5] text-center">
                {!audioAttachment ? (
                  <div className="flex flex-col items-center gap-2">
                    {isRecording ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-3.5 py-2 rounded-xl animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="font-semibold text-xs text-rose-950">
                            recording audio & dictating live: {recordingTime}s
                          </span>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-black text-white px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer hover:bg-rose-700 transition-colors"
                          >
                            done
                          </button>
                        </div>
                        {interimTranscript && (
                          <p className="text-xs text-black/70 italic bg-white border border-black/10 px-3 py-1.5 rounded-lg max-w-full truncate">
                            "{interimTranscript}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={startRecording}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Mic className="w-3.5 h-3.5 text-white" /> record & dictate note
                          </button>
                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="bg-white hover:bg-black/5 border border-black/15 px-3.5 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer"
                          >
                            upload audio
                          </button>
                        </div>
                        <p className="text-[10px] text-black/50">
                          transcribes real-time speech directly into note text field
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white border border-black/15 rounded-lg p-2">
                    <span className="font-medium text-xs text-black truncate">{audioAttachment.name}</span>
                    <button onClick={removeAudio} className="text-black/50 hover:text-black p-1 cursor-pointer">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Left Submit Button */}
          <button
            type="button"
            onClick={handleNoteSubmit}
            disabled={isLoading || (!promptText && files.length === 0 && !audioAttachment)}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-black/10 text-black/40 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
            }`}
          >
            {isLoading && route === "notes" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                <span>untangling notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>untangle notes now</span>
              </>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: DORM CHEF BUDGET & MEAL TOOLS */}
        {/* ========================================================= */}
        <div
          onDragEnter={handleChefDragEnter}
          onDragOver={handleChefDragOver}
          onDragLeave={handleChefDragLeave}
          onDrop={handleChefDrop}
          className={`relative bg-white border rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between transition-all overflow-hidden ${
            isDraggingChef
              ? "border-amber-500 ring-4 ring-amber-200 bg-amber-50/20 scale-[1.008]"
              : route === "chef"
              ? "border-amber-600 ring-2 ring-amber-500"
              : "border-black/15"
          }`}
        >
          {/* Active Drag Overlay for The Cook */}
          {isDraggingChef && (
            <div className="absolute inset-0 z-30 bg-amber-950/92 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none transition-all">
              <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xl mb-3 animate-bounce border border-amber-400">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Drop Receipt or Fridge Photos Here
              </h4>
              <p className="text-xs text-amber-200 mt-1.5 max-w-xs leading-relaxed">
                Release to scan grocery prices, pantry leftovers & generate budget dorm recipes
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/30">
                  Grocery Receipts • Fridge Shelves • Pantry Leftovers
                </span>
              </div>
            </div>
          )}
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black leading-tight">
                    The Cook
                  </h3>
                  <p className="text-xs text-black/50">
                    fridge ingredients & budget meals
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase font-semibold">
                food & budget
              </span>
            </div>

            {/* Dorm Chef Templates & Presets */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-black/60 mb-2">
                quick meal presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoute("chef");
                    setBudget("12.00");
                    setPromptText(`3 eggs, half onion, sharp cheddar, 2 stale flour tortillas, half jar salsa. Need quick breakfast burrito prep under 15 min!`);
                  }}
                  className="text-left bg-[#FAF8F5] hover:bg-orange-50/70 border border-black/10 hover:border-orange-300 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>messy dorm fridge + $12</span>
                  </p>
                  <span className="text-[11px] text-black/50 line-clamp-1 mt-0.5">
                    3 eggs, onion, cheddar, tortillas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoute("chef");
                    setBudget("15.00");
                    setPromptText(`Scanned receipt: Instant Ramen ($2.50), Rolled Oats ($3.20), Peanut Butter ($3.80), Eggs ($2.99), Bananas ($1.50). High-protein snack recipe!`);
                  }}
                  className="text-left bg-[#FAF8F5] hover:bg-emerald-50/70 border border-black/10 hover:border-emerald-300 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>target receipt + pantry</span>
                  </p>
                  <span className="text-[11px] text-black/50 line-clamp-1 mt-0.5">
                    ramen, oats, eggs & peanut butter
                  </span>
                </button>
              </div>
            </div>

            {/* Integrated Dorm Meal Budget Box */}
            <div className="mb-4 bg-[#FAF8F5] border border-black/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="font-semibold text-xs text-black flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> dorm meal budget
                </label>
                <div className="flex items-center gap-1 bg-white border border-black/15 rounded-lg px-2.5 py-0.5">
                  <span className="font-bold text-xs text-emerald-700">$</span>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="12.00"
                    className="w-16 font-semibold text-xs text-black outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                {["5.00", "10.00", "15.00", "20.00"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      budget === b ? "bg-amber-600 text-white border-amber-600" : "bg-white border-black/15 text-black hover:bg-black/5"
                    }`}
                  >
                    ${b.split(".")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Chef Modality Selector */}
            <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2">
              <span className="text-xs font-medium text-black/60">fridge / recipe input:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setChefTab("text")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    chefTab === "text" ? "bg-black text-white" : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  items
                </button>
                <button
                  type="button"
                  onClick={() => setChefTab("photo")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    chefTab === "photo" ? "bg-black text-white" : "bg-black/5 text-black/70 hover:bg-black/10"
                  }`}
                >
                  photo
                </button>
              </div>
            </div>

            {/* Chef Textarea */}
            {chefTab === "text" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-black/50">
                    type or dictate fridge items:
                  </label>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? `Dictating live (${recordingTime}s)` : "Dictate items (speech-to-text)"}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isRecording
                        ? "bg-rose-600 text-white border border-rose-600 animate-pulse"
                        : "bg-white hover:bg-rose-50 text-black border border-black/15 shadow-2xs"
                    }`}
                  >
                    {isRecording ? <Radio className="w-4 h-4 text-white animate-spin" /> : <Mic className="w-4 h-4 text-rose-500" />}
                  </button>
                </div>

                <textarea
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    if (route === "auto") setRoute("chef");
                  }}
                  placeholder="List fridge items, pantry leftovers, grocery receipt text, or dictate directly into prompt..."
                  rows={4}
                  className="w-full p-3.5 border border-black/15 rounded-xl font-medium text-xs sm:text-sm text-black focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 resize-y bg-[#FAF8F5] mb-2 placeholder:text-black/40"
                />

                {isRecording && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-950">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                      <span className="font-semibold text-rose-700 shrink-0">Speech-to-Text:</span>
                      <span className="text-black/80 italic truncate">{interimTranscript || "Listening... speak fridge items"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-black text-white px-2 py-0.5 text-[10px] font-semibold rounded shrink-0 hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      done
                    </button>
                  </div>
                )}
              </div>
            )}

            {chefTab === "photo" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFiles(e.dataTransfer.files, "chef");
                  }
                }}
                className="border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl p-3.5 mb-3 bg-[#FAF8F5] text-center transition-all group"
              >
                {files.length === 0 ? (
                  <div
                    onClick={() => chefImageInputRef.current?.click()}
                    className="cursor-pointer py-3.5 px-2 hover:bg-amber-50/50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-2 text-amber-600 group-hover:scale-105 transition-transform shadow-2xs">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-xs text-black">
                      Drag & drop grocery receipts or fridge photos here
                    </p>
                    <p className="text-[11px] text-black/60 mt-0.5">
                      or <span className="text-amber-700 font-medium underline">browse from your computer</span>
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      🧾 paper receipts • shelf photos • pantry items
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 text-xs">
                      <span className="font-semibold text-black flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                        <span>{files.length} photo{files.length > 1 ? "s" : ""} attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative group border border-black/15 rounded-lg bg-white p-1 overflow-hidden shadow-2xs">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover rounded" />
                          <p className="text-[9px] text-black/70 truncate mt-1 text-left px-0.5 font-mono">
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer transition-colors shadow-xs"
                            title="Remove photo"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => chefImageInputRef.current?.click()}
                      className="w-full bg-white hover:bg-amber-50/50 border border-black/15 hover:border-amber-400 py-1.5 px-2 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-black"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ drop or add more receipt photos</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Submit Button */}
          <button
            type="button"
            onClick={handleChefSubmit}
            disabled={isLoading || (!promptText && files.length === 0 && !audioAttachment)}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-black/10 text-black/40 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md"
            }`}
          >
            {isLoading && route === "chef" ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                <span>cooking recipes...</span>
              </>
            ) : (
              <>
                <Utensils className="w-4 h-4 text-amber-200" />
                <span>untangle recipes now</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

