import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: 'Le fichier doit faire moins de 10MB',
    })
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: 'Format accepté : JPEG, PNG ou WebP uniquement',
    }),
});

export const generateRequestSchema = z.object({
  imageUrl: z.string().url({ message: 'URL invalide' }),
  stylePrompt: z.string().optional(),
});

export const regenerateRequestSchema = z.object({
  sessionId: z.string().min(1, { message: 'Session ID requis' }),
  imageId: z.string().min(1, { message: 'Image ID requis' }),
  userPrompt: z.string().min(5, { message: 'Le prompt doit faire au moins 5 caractères' }),
});

export const validateRequestSchema = z.object({
  sessionId: z.string().min(1, { message: 'Session ID requis' }),
  finalImageId: z.string().min(1, { message: 'Image ID requis' }),
});
