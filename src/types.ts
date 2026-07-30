export type RouteMode = "auto" | "notes" | "chef";

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64 string
  previewUrl?: string;
}

export interface UntangleHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  inputPrompt: string;
  inputType: "text" | "image" | "audio" | "multimodal";
  routeDetected: "notes" | "chef";
  outputMarkdown: string;
  budget?: string;
  tags: string[];
  pinned?: boolean;
}

export interface Flashcard {
  question: string;
  answer: string;
  tag: string;
}

export interface PresetSample {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: "Note Engine" | "Dorm Chef";
  route: RouteMode;
  prompt: string;
  budget?: string;
  files?: FileAttachment[];
}
