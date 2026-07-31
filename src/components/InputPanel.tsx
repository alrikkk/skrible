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
  onSubmit: () => void;
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const basePromptRef = useRef<string>("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chefImageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // File drop handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
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
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
      alert("Microphone access is required for voice memo recording and dictation.");
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
    setTimeout(() => onSubmit(), 50);
  };

  const handleChefSubmit = () => {
    setRoute("chef");
    setTimeout(() => onSubmit(), 50);
  };

  return (
    <div className="w-full mb-8 font-sans">
      
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
                ? "bg-[#ec4899] text-white border-[#ec4899] shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>auto-detect</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("notes")}
            className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "notes"
                ? "bg-[#ec4899] text-white border-[#ec4899] shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Note Cram</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("chef")}
            className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "chef"
                ? "bg-[#ec4899] text-white border-[#ec4899] shadow-xs"
                : "bg-white text-black/70 hover:text-black hover:bg-black/5 border-black/15"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>The Cook</span>
          </button>
        </div>
      </div>

      {/* CRITICAL RESPONSIVE TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: NOTE ENGINE FEATURES & TEMPLATES */}
        {/* ========================================================= */}
        <div
          className={`bg-white border border-black/15 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
            route === "notes" ? "ring-2 ring-[#ec4899]" : ""
          }`}
        >
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ec4899]/10 text-[#ec4899] rounded-xl">
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
              <span className="text-[10px] font-mono text-black/50 bg-black/5 px-2 py-0.5 rounded uppercase">
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
                  className="text-left bg-[#FAF8F5] hover:bg-[#ec4899]/10 border border-black/10 hover:border-[#ec4899]/30 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
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
                  className="text-left bg-[#FAF8F5] hover:bg-[#ec4899]/10 border border-black/10 hover:border-[#ec4899]/30 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
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
                        ? "bg-[#ec4899] text-white border border-[#ec4899] animate-pulse"
                        : "bg-white hover:bg-black/5 text-black border border-black/15 shadow-2xs"
                    }`}
                  >
                    {isRecording ? <Radio className="w-4 h-4 text-white animate-spin" /> : <Mic className="w-4 h-4 text-[#ec4899]" />}
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
                  className="w-full p-3.5 border border-black/15 rounded-xl font-medium text-xs sm:text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-y bg-[#FAF8F5] mb-2 placeholder:text-black/40"
                />

                {isRecording && (
                  <div className="mb-3 p-2.5 bg-[#ec4899]/10 border border-[#ec4899]/30 rounded-xl flex items-center justify-between text-xs text-black">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-[#ec4899] animate-ping shrink-0" />
                      <span className="font-semibold text-[#ec4899] shrink-0">Speech-to-Text:</span>
                      <span className="text-black/80 italic truncate">{interimTranscript || "Listening... speak clearly into mic"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-black text-white px-2 py-0.5 text-[10px] font-semibold rounded shrink-0 hover:bg-[#ec4899] transition-colors cursor-pointer"
                    >
                      done
                    </button>
                  </div>
                )}
              </div>
            )}

            {noteTab === "photo" && (
              <div className="border border-dashed border-black/20 rounded-xl p-4 mb-3 bg-[#FAF8F5] text-center">
                {files.length === 0 ? (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="cursor-pointer py-3 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <Camera className="w-7 h-7 text-black/60 mx-auto mb-1" />
                    <p className="font-medium text-xs text-black">
                      upload whiteboard / note photo
                    </p>
                    <p className="text-[10px] text-black/50 mt-0.5">
                      click to choose images (PNG, JPG)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative border border-black/15 rounded-lg bg-white p-1">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover rounded" />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full bg-white border border-black/15 hover:border-black/30 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                    >
                      + add more note photos
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
                        <div className="flex items-center gap-2 bg-[#ec4899]/10 border border-[#ec4899] px-3.5 py-2 rounded-xl animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ec4899] animate-ping" />
                          <span className="font-semibold text-xs text-black">
                            recording audio & dictating live: {recordingTime}s
                          </span>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-black text-white px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer hover:bg-[#ec4899] transition-colors"
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
                            className="bg-[#ec4899] hover:bg-[#db2777] text-white px-3.5 py-2 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Mic className="w-3.5 h-3.5" /> record & dictate note
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
                      <Trash2 className="w-4 h-4" />
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
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-black/10 text-black/40 cursor-not-allowed"
                : "bg-black hover:bg-[#ec4899] text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#ec4899]" />
            <span>untangle notes now</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: DORM CHEF BUDGET & MEAL TOOLS */}
        {/* ========================================================= */}
        <div
          className={`bg-white border border-black/15 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
            route === "chef" ? "ring-2 ring-[#ec4899]" : ""
          }`}
        >
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#ec4899]/10 text-[#ec4899] rounded-xl">
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
              <span className="text-[10px] font-mono text-black/50 bg-black/5 px-2 py-0.5 rounded uppercase">
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
                  className="text-left bg-[#FAF8F5] hover:bg-[#ec4899]/10 border border-black/10 hover:border-[#ec4899]/30 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
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
                  className="text-left bg-[#FAF8F5] hover:bg-[#ec4899]/10 border border-black/10 hover:border-[#ec4899]/30 p-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-black flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#ec4899] shrink-0" />
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
                  <DollarSign className="w-4 h-4 text-[#ec4899]" /> dorm meal budget
                </label>
                <div className="flex items-center gap-1 bg-white border border-black/15 rounded-lg px-2.5 py-0.5">
                  <span className="font-bold text-xs text-black/60">$</span>
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
                      budget === b ? "bg-black text-white border-black" : "bg-white border-black/15 text-black hover:bg-black/5"
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
                        ? "bg-[#ec4899] text-white border border-[#ec4899] animate-pulse"
                        : "bg-white hover:bg-black/5 text-black border border-black/15 shadow-2xs"
                    }`}
                  >
                    {isRecording ? <Radio className="w-4 h-4 text-white animate-spin" /> : <Mic className="w-4 h-4 text-[#ec4899]" />}
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
                  className="w-full p-3.5 border border-black/15 rounded-xl font-medium text-xs sm:text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-y bg-[#FAF8F5] mb-2 placeholder:text-black/40"
                />

                {isRecording && (
                  <div className="mb-3 p-2.5 bg-[#ec4899]/10 border border-[#ec4899]/30 rounded-xl flex items-center justify-between text-xs text-black">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 rounded-full bg-[#ec4899] animate-ping shrink-0" />
                      <span className="font-semibold text-[#ec4899] shrink-0">Speech-to-Text:</span>
                      <span className="text-black/80 italic truncate">{interimTranscript || "Listening... speak fridge items"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-black text-white px-2 py-0.5 text-[10px] font-semibold rounded shrink-0 hover:bg-[#ec4899] transition-colors cursor-pointer"
                    >
                      done
                    </button>
                  </div>
                )}
              </div>
            )}

            {chefTab === "photo" && (
              <div className="border border-dashed border-black/20 rounded-xl p-4 mb-3 bg-[#FAF8F5] text-center">
                {files.length === 0 ? (
                  <div
                    onClick={() => chefImageInputRef.current?.click()}
                    className="cursor-pointer py-3 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <Camera className="w-7 h-7 text-black/60 mx-auto mb-1" />
                    <p className="font-medium text-xs text-black">
                      upload fridge or receipt photo
                    </p>
                    <p className="text-[10px] text-black/50 mt-0.5">
                      click to choose image (PNG, JPG)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative border border-black/15 rounded-lg bg-white p-1">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover rounded" />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => chefImageInputRef.current?.click()}
                      className="w-full bg-white border border-black/15 hover:border-black/30 py-1.5 text-xs font-medium rounded-lg cursor-pointer"
                    >
                      + add more photos
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
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-black/10 text-black/40 cursor-not-allowed"
                : "bg-black hover:bg-[#ec4899] text-white"
            }`}
          >
            <Utensils className="w-4 h-4 text-[#ec4899]" />
            <span>untangle recipes now</span>
          </button>
        </div>

      </div>

    </div>
  );
};

