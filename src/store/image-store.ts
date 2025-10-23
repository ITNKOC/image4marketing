import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ImageStore } from '@/types';

export const useImageStore = create<ImageStore>()(
  devtools(
    (set, get) => ({
      // State
      currentStep: 'upload',
      uploadedImage: null,
      generatedImages: [],
      sessionId: null,
      selectedImage: null,
      chatHistory: [],
      isLoading: false,
      error: null,

      // Actions
      setUploadedImage: (data) =>
        set({
          uploadedImage: data,
          currentStep: 'generate',
          error: null,
        }),

      startGeneration: () =>
        set({
          isLoading: true,
          error: null,
        }),

      setGeneratedImages: (sessionId, images) =>
        set({
          sessionId,
          generatedImages: images,
          isLoading: false,
          currentStep: 'modify',
        }),

      selectImageForModification: (imageId) => {
        const image = get().generatedImages.find((img) => img.id === imageId);
        if (image) {
          set({ selectedImage: image });
        }
      },

      selectImageForChat: (imageId) => {
        const image = get().generatedImages.find((img) => img.id === imageId);
        if (image) {
          set({
            selectedImage: image,
            currentStep: 'chat',
            chatHistory: [
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: 'Image sélectionnée ! Décrivez les modifications que vous souhaitez apporter.',
                imageUrl: image.url,
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      },

      updateImage: (imageId, newUrl, newPrompt) =>
        set((state) => ({
          generatedImages: state.generatedImages.map((img) =>
            img.id === imageId
              ? { ...img, url: newUrl, prompt: newPrompt }
              : img
          ),
          selectedImage:
            state.selectedImage?.id === imageId
              ? { ...state.selectedImage, url: newUrl, prompt: newPrompt }
              : state.selectedImage,
        })),

      addChatMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        })),

      selectImageForFinal: (imageId) => {
        const image = get().generatedImages.find((img) => img.id === imageId);
        if (image) {
          set({
            selectedImage: image,
            currentStep: 'final',
          });
        }
      },

      setError: (error) =>
        set({
          error,
          isLoading: false,
        }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      reset: () =>
        set({
          currentStep: 'upload',
          uploadedImage: null,
          generatedImages: [],
          sessionId: null,
          selectedImage: null,
          chatHistory: [],
          isLoading: false,
          error: null,
        }),
    }),
    { name: 'image-store' }
  )
);
