// Fix: Create type definitions for the application.
export interface JournalImage {
  base64: string;
  mimeType: string;
  description: string;
}

export interface JournalFile {
  name: string;
  base64: string;
  mimeType: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string; // Using string for date YYYY-MM-DD
  content: string;
  summary: string;
  tags: string[];
  images: JournalImage[];
  files: JournalFile[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface PresentationSlide {
  title: string;
  points: string[];
  speakerNotes?: string;
}

// Fix: Define the AIStudio interface to resolve subsequent property declaration errors.
// The compiler error indicates that `window.aistudio` is expected to have the type `AIStudio`.
export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

// Fix: Centralize global type definitions to resolve duplicate declaration errors.
// By defining the type inline, we avoid conflicts if this file is somehow included twice.
declare global {
  interface Window {
    // Fix: Use the named AIStudio interface to ensure consistency with other declarations.
    aistudio: AIStudio;
  }
}
