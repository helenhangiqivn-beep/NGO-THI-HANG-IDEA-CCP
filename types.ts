export interface Concept {
  name: string;
  description: string;
  colorScheme: string;
  size: string;
  yarn: string;
  hook: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface AppState {
  step: 'upload' | 'generating-text' | 'results';
  uploadedImage: string | null; // Base64 string
  colorCount: number;
  style: string;
  concepts: Concept[];
  error: string | null;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_CONCEPTS = 'GENERATING_CONCEPTS',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}