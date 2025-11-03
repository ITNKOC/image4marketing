'use client';

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileSchema } from '@/lib/zod-schemas';
import { useImageStore } from '@/store/image-store';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const setUploadedImage = useImageStore((state) => state.setUploadedImage);
  const setError = useImageStore((state) => state.setError);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validation = uploadFileSchema.safeParse({ file });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message ?? 'Fichier invalide';
      toast.error(errorMessage);
      setError(errorMessage);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de l\'upload');
      }

      const data = await response.json();

      setUploadedImage({
        uploadId: data.uploadId,
        url: data.imageUrl,
        metadata: data.metadata,
      });

      toast.success('Image uploadée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
      setError(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraButtonClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-2xl p-8 md:p-12 text-center smooth-transition
            ${isDragging
              ? 'bg-gray-50 border-2 border-black scale-[1.02]'
              : 'bg-white border-2 border-gray-200 hover:border-gray-400'
            }
            ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-default'}
          `}
        >
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <Image
                    src={preview}
                    alt="Prévisualisation"
                    fill
                    className="object-contain p-4"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-white text-center">
                        <svg className="animate-spin h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="font-semibold">Upload en cours...</p>
                      </div>
                    </div>
                  )}
                </div>

                {!uploading && (
                  <button
                    onClick={handleFileButtonClick}
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 smooth-transition"
                  >
                    Changer l'image
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <motion.div
                  className="mx-auto w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center"
                  animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                >
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </motion.div>

                <h3 className="text-2xl md:text-3xl font-bold text-black mb-3">
                  {isDragging ? 'Déposez votre image ici' : 'Uploadez votre photo'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Glissez-déposez une image ou utilisez les boutons ci-dessous
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <button
                    onClick={handleFileButtonClick}
                    disabled={uploading}
                    className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Choisir un fichier
                  </button>

                  {isMobile && (
                    <button
                      onClick={handleCameraButtonClick}
                      disabled={uploading}
                      className="w-full sm:w-auto px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Prendre une photo
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full">JPEG</span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full">PNG</span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full">WebP</span>
                  <span className="px-3 py-1.5 bg-gray-100 rounded-full">Max 10MB</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
        </div>

        <motion.p
          className="text-center mt-6 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Prenez une photo bien éclairée pour de meilleurs résultats
        </motion.p>
      </motion.div>
    </div>
  );
}
