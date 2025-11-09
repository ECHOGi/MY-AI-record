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

// Fix: Moved the 'AIStudio' interface into the 'declare global' block to make it a global type.
// This resolves the "Subsequent property declarations must have the same type"
// error by ensuring a single, global definition for the type used on `window.aistudio`.
declare global {
  // Fix: Define the `AIStudio` interface and apply it to `window.aistudio`
  // to resolve the "Subsequent property declarations must have the same type" error.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  // Fix: To resolve "All declarations of 'aistudio' must have identical modifiers.",
  // changed from augmenting the Window interface to declaring a global variable.
  // This approach is more robust for merging with globals defined by external scripts.
  var aistudio: AIStudio;
}
