import React, { useState, useRef } from "react";
import { RouteMode, FileAttachment } from "../types";
import {
  Brain,
  Utensils,
  Zap,
  FileText,
  Camera,
  Mic,
  Upload,
  X,
  DollarSign,
  Play,
  Square,
  Sparkles,
  Paperclip,
  Trash2
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

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

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

  // Live Microphone Recording
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

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access is required for voice memo recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
      <div className="bg-white border-4 border-black p-3.5 sm:p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] mb-6">
        <label className="block text-xs font-black uppercase text-black mb-3 tracking-wider">
          1. CHOOSE UNTANGLER MODE
        </label>

        {/* Structural sequence: 
            - Computer (>= 768px): spans horizontally across in a single clean row (md:grid-cols-3)
            - Smartphone (< 768px): stacks vertically (grid-cols-1) with tightened internal margins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <button
            type="button"
            onClick={() => setRoute("auto")}
            className={`w-full py-3 px-4 border-4 border-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "auto"
                ? "bg-[#00F5FF] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <Zap className="w-4 h-4 fill-black text-black stroke-[2.5]" />
            <span>AUTO-DETECT</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("notes")}
            className={`w-full py-3 px-4 border-4 border-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "notes"
                ? "bg-[#FF90E8] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <Brain className="w-4 h-4 text-black stroke-[2.5]" />
            <span>NOTE ENGINE</span>
          </button>

          <button
            type="button"
            onClick={() => setRoute("chef")}
            className={`w-full py-3 px-4 border-4 border-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              route === "chef"
                ? "bg-[#B5FFD9] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <Utensils className="w-4 h-4 text-black stroke-[2.5]" />
            <span>DORM CHEF</span>
          </button>
        </div>
      </div>

      {/* CRITICAL RESPONSIVE TWO-COLUMN GRID:
          - Laptop view (> 768px): grid-cols-2 side-by-side
          - Mobile view (<= 768px): grid-cols-1 stacked with 12px (p-3) padding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 🧠 NOTE ENGINE FEATURES & TEMPLATES */}
        {/* ========================================================= */}
        <div
          className={`bg-white border-4 border-black p-3 sm:p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-all ${
            route === "notes" ? "ring-4 ring-[#FF90E8]" : ""
          }`}
        >
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FF90E8] border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Brain className="w-6 h-6 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-black uppercase leading-tight tracking-tight">
                    NOTE ENGINE
                  </h3>
                  <p className="text-[11px] font-black text-gray-700 uppercase">
                    STUDY NOTES & CRAM SHEETS
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#FF90E8] text-black border-2 border-black px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ACADEMIC
              </span>
            </div>

            {/* Note Engine Templates & Presets */}
            <div className="mb-4">
              <label className="block text-[11px] font-black uppercase text-black mb-1.5 tracking-wider">
                ⚡️ QUICK NOTE TEMPLATES
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoute("notes");
                    setPromptText(`Prof spent 45 min on SN2 mechanisms. Primary alkyl halide reacts with strong nucleophile like OH- in bimolecular transition state. Inversion of stereochemistry occurs (Walden inversion). Polar aprotic solvents like DMSO favor SN2. Rate = k[substrate][nucleophile]. Steric hindrance slows it down. Tertiary halides DO NOT undergo SN2!`);
                  }}
                  className="text-left bg-[#FFF4E0] hover:bg-[#FF90E8]/30 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <p className="font-black text-xs text-black uppercase flex items-center gap-1">
                    🧪 O-Chem SN2 Mechanism
                  </p>
                  <span className="text-[10px] text-gray-700 font-bold line-clamp-1">
                    Messy whiteboard scribbles
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoute("notes");
                    setPromptText(`Voice transcript: "Midterm review: demand curve shifts from non-price factors like income, preferences, substitutes. Movement ALONG demand curve is ONLY price change. Supply slopes up due to marginal opportunity cost. Price ceilings cause shortages, floors cause surpluses."`);
                  }}
                  className="text-left bg-[#FFF4E0] hover:bg-[#FF90E8]/30 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <p className="font-black text-xs text-black uppercase flex items-center gap-1">
                    🎙️ Econ 101 Lecture Memo
                  </p>
                  <span className="text-[10px] text-gray-700 font-bold line-clamp-1">
                    Supply/demand voice transcript
                  </span>
                </button>
              </div>
            </div>

            {/* Note Modality Selector */}
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-black">INPUT SOURCE:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setNoteTab("text")}
                  className={`px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                    noteTab === "text" ? "bg-[#FF90E8]" : "bg-white"
                  }`}
                >
                  📄 TEXT
                </button>
                <button
                  type="button"
                  onClick={() => setNoteTab("photo")}
                  className={`px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                    noteTab === "photo" ? "bg-[#FF90E8]" : "bg-white"
                  }`}
                >
                  📸 PHOTO ({files.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNoteTab("audio")}
                  className={`px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                    noteTab === "audio" ? "bg-[#FF90E8]" : "bg-white"
                  }`}
                >
                  🎙️ VOICE
                </button>
              </div>
            </div>

            {/* Note Input Field */}
            {noteTab === "text" && (
              <textarea
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  if (route === "auto") setRoute("notes");
                }}
                placeholder="Paste messy lecture notes, whiteboard transcript, study sheet, or professor ramblings here..."
                rows={5}
                className="w-full p-3 border-3 border-black font-medium text-xs sm:text-sm text-black focus:outline-none focus:ring-0 resize-y bg-[#FFF4E0] mb-3"
              />
            )}

            {noteTab === "photo" && (
              <div className="border-3 border-dashed border-black p-4 mb-3 bg-[#FFF4E0] text-center">
                {files.length === 0 ? (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="cursor-pointer py-3 hover:bg-amber-100 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-black mx-auto mb-1 stroke-[2.5]" />
                    <p className="font-black text-xs uppercase text-black">
                      UPLOAD WHITEBOARD / NOTE PHOTO
                    </p>
                    <p className="text-[10px] text-gray-800 font-bold mt-0.5">
                      Click to choose images (PNG, JPG)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative border-2 border-black bg-white p-1">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover" />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white p-0.5 border border-black cursor-pointer"
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full bg-white border-2 border-black py-1 text-xs font-black uppercase cursor-pointer"
                    >
                      + ADD MORE NOTE PHOTOS
                    </button>
                  </div>
                )}
              </div>
            )}

            {noteTab === "audio" && (
              <div className="border-3 border-dashed border-black p-4 mb-3 bg-[#FFF4E0] text-center">
                {!audioAttachment ? (
                  <div className="flex flex-col items-center gap-2">
                    {isRecording ? (
                      <div className="flex items-center gap-2 bg-[#FF90E8] border-2 border-black px-3 py-1 animate-pulse">
                        <div className="w-2.5 h-2.5 bg-red-600 animate-ping" />
                        <span className="font-black text-xs text-black uppercase">
                          RECORDING: {recordingTime}s
                        </span>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase cursor-pointer"
                        >
                          STOP
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="bg-[#FF90E8] border-2 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center gap-1"
                        >
                          <Mic className="w-3.5 h-3.5 stroke-[2.5]" /> REC MEMO
                        </button>
                        <button
                          type="button"
                          onClick={() => audioInputRef.current?.click()}
                          className="bg-white border-2 border-black px-3 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                        >
                          UPLOAD AUDIO
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white border-2 border-black p-2">
                    <span className="font-black text-xs uppercase truncate">{audioAttachment.name}</span>
                    <button onClick={removeAudio} className="bg-[#FF6B6B] text-white p-1 border border-black cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
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
            className={`w-full py-3 px-4 border-4 border-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#FF90E8] hover:bg-pink-300 text-black"
            }`}
          >
            <Zap className="w-4 h-4 fill-black text-black stroke-[2.5]" />
            <span>⚡️ UNTANGLE NOTES NOW</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: 🍳 DORM CHEF BUDGET & MEAL TOOLS */}
        {/* ========================================================= */}
        <div
          className={`bg-white border-4 border-black p-3 sm:p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between transition-all ${
            route === "chef" ? "ring-4 ring-[#B5FFD9]" : ""
          }`}
        >
          <div>
            {/* Header Block */}
            <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#B5FFD9] border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Utensils className="w-6 h-6 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-black uppercase leading-tight tracking-tight">
                    DORM CHEF
                  </h3>
                  <p className="text-[11px] font-black text-gray-700 uppercase">
                    FRIDGE INGREDIENTS & BUDGET MEALS
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-[#B5FFD9] text-black border-2 border-black px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                FOOD & BUDGET
              </span>
            </div>

            {/* Dorm Chef Templates & Presets */}
            <div className="mb-4">
              <label className="block text-[11px] font-black uppercase text-black mb-1.5 tracking-wider">
                🍳 QUICK MEAL PRESETS
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoute("chef");
                    setBudget("12.00");
                    setPromptText(`3 eggs, half onion, sharp cheddar, 2 stale flour tortillas, half jar salsa. Need quick breakfast burrito prep under 15 min!`);
                  }}
                  className="text-left bg-[#FFF4E0] hover:bg-[#B5FFD9]/40 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <p className="font-black text-xs text-black uppercase flex items-center gap-1">
                    🍳 Messy Dorm Fridge + $12
                  </p>
                  <span className="text-[10px] text-gray-700 font-bold line-clamp-1">
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
                  className="text-left bg-[#FFF4E0] hover:bg-[#B5FFD9]/40 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <p className="font-black text-xs text-black uppercase flex items-center gap-1">
                    🧾 Target Receipt + Pantry
                  </p>
                  <span className="text-[10px] text-gray-700 font-bold line-clamp-1">
                    Ramen, oats, eggs & peanut butter
                  </span>
                </button>
              </div>
            </div>

            {/* Integrated Dorm Meal Budget Box */}
            <div className="mb-4 bg-[#B5FFD9] border-3 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="font-black text-xs text-black uppercase flex items-center gap-1">
                  <DollarSign className="w-4 h-4 stroke-[3]" /> DORM MEAL BUDGET
                </label>
                <div className="flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5">
                  <span className="font-black text-sm text-black">$</span>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="12.00"
                    className="w-16 font-black text-sm text-black outline-none bg-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                {["5.00", "10.00", "15.00", "20.00"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`flex-1 py-0.5 text-[10px] font-black border-2 border-black uppercase ${
                      budget === b ? "bg-black text-white" : "bg-white text-black hover:bg-amber-100"
                    }`}
                  >
                    ${b.split(".")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Chef Modality Selector */}
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-black">FRIDGE / RECIPE INPUT:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setChefTab("text")}
                  className={`px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                    chefTab === "text" ? "bg-[#B5FFD9]" : "bg-white"
                  }`}
                >
                  🥗 ITEMS
                </button>
                <button
                  type="button"
                  onClick={() => setChefTab("photo")}
                  className={`px-2 py-0.5 border-2 border-black text-[11px] font-black uppercase ${
                    chefTab === "photo" ? "bg-[#B5FFD9]" : "bg-white"
                  }`}
                >
                  📸 PHOTO
                </button>
              </div>
            </div>

            {/* Chef Textarea */}
            {chefTab === "text" && (
              <textarea
                value={promptText}
                onChange={(e) => {
                  setPromptText(e.target.value);
                  if (route === "auto") setRoute("chef");
                }}
                placeholder="List fridge items, pantry leftovers, grocery receipt text, or meal card allowance..."
                rows={4}
                className="w-full p-3 border-3 border-black font-medium text-xs sm:text-sm text-black focus:outline-none focus:ring-0 resize-y bg-[#FFF4E0] mb-3"
              />
            )}

            {chefTab === "photo" && (
              <div className="border-3 border-dashed border-black p-4 mb-3 bg-[#FFF4E0] text-center">
                {files.length === 0 ? (
                  <div
                    onClick={() => chefImageInputRef.current?.click()}
                    className="cursor-pointer py-3 hover:bg-amber-100 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-black mx-auto mb-1 stroke-[2.5]" />
                    <p className="font-black text-xs uppercase text-black">
                      UPLOAD FRIDGE OR RECEIPT PHOTO
                    </p>
                    <p className="text-[10px] text-gray-800 font-bold mt-0.5">
                      Click to choose image (PNG, JPG)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative border-2 border-black bg-white p-1">
                          <img src={file.previewUrl} alt={file.name} className="w-full h-16 object-cover" />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white p-0.5 border border-black cursor-pointer"
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => chefImageInputRef.current?.click()}
                      className="w-full bg-white border-2 border-black py-1 text-xs font-black uppercase cursor-pointer"
                    >
                      + ADD MORE PHOTOS
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
            className={`w-full py-3 px-4 border-4 border-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
              isLoading || (!promptText && files.length === 0 && !audioAttachment)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#B5FFD9] hover:bg-[#8effbf] text-black"
            }`}
          >
            <Utensils className="w-4 h-4 text-black stroke-[2.5]" />
            <span>🍳 UNTANGLE RECIPES NOW</span>
          </button>
        </div>

      </div>

    </div>
  );
};

