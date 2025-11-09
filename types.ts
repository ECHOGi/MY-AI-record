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
  deadline: string; // YYYY-MM-DD
  status: string;
}

export interface PresentationSlide {
  title: string;
  points: string[];
  speakerNotes?: string;
}

// Fix: To resolve TypeScript errors about duplicate declarations of `window.aistudio`,
// a global `AIStudio` interface is defined and `aistudio` is declared as a `var`
// in the global scope. Using `var` allows for declaration merging, which resolves
// conflicts with other libraries that might also define `window.aistudio`.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  var aistudio: AIStudio;
}
