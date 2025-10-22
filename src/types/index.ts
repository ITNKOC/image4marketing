export interface UploadedImage {
  uploadId: string;
  url: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

export type AppStep = 'upload' | 'generate' | 'modify' | 'final';

export interface ImageStoreState {
  currentStep: AppStep;
  uploadedImage: UploadedImage | null;
  generatedImages: GeneratedImage[];
  sessionId: string | null;
  selectedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
}

export interface ImageStoreActions {
  setUploadedImage: (data: UploadedImage) => void;
  startGeneration: () => void;
  setGeneratedImages: (sessionId: string, images: GeneratedImage[]) => void;
  selectImageForModification: (imageId: string) => void;
  updateImage: (imageId: string, newUrl: string, newPrompt: string) => void;
  selectImageForFinal: (imageId: string) => void;
  setError: (error: string) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export type ImageStore = ImageStoreState & ImageStoreActions;
