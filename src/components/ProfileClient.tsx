'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';

type UserWithSessions = {
  id: string;
  username: string;
  email: string | null;
  createdAt: Date;
  sessions: {
    id: string;
    uploadId: string;
    originalImage: string;
    createdAt: Date;
    images: {
      id: string;
      url: string;
      prompt: string;
      isFinal: boolean;
      isValidated: boolean;
      createdAt: Date;
    }[];
  }[];
};

type Props = {
  user: UserWithSessions;
};

export default function ProfileClient({ user }: Props) {
  const [filter, setFilter] = useState<'all' | 'validated'>('all');

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image téléchargée !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const filteredSessions = user.sessions.map((session) => ({
    ...session,
    images: filter === 'validated'
      ? session.images.filter((img) => img.isValidated)
      : session.images,
  })).filter((session) => session.images.length > 0);

  const totalImages = user.sessions.reduce(
    (acc, session) => acc + session.images.length,
    0
  );

  const validatedImages = user.sessions.reduce(
    (acc, session) => acc + session.images.filter((img) => img.isValidated).length,
    0
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-white -z-10" />

      <div className="container mx-auto px-4 py-8">
        {/* Header avec informations utilisateur */}
        <motion.div
          className="bg-white rounded-2xl p-8 mb-8 border-2 border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-black mb-2">
                {user.username}
              </h1>
              {user.email && <p className="text-gray-600">{user.email}</p>}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-black text-white rounded-xl p-4">
              <div className="text-3xl font-bold">{user.sessions.length}</div>
              <div className="text-gray-300">Sessions totales</div>
            </div>
            <div className="bg-gray-800 text-white rounded-xl p-4">
              <div className="text-3xl font-bold">{totalImages}</div>
              <div className="text-gray-300">Images générées</div>
            </div>
            <div className="bg-gray-600 text-white rounded-xl p-4">
              <div className="text-3xl font-bold">{validatedImages}</div>
              <div className="text-gray-300">Images validées</div>
            </div>
          </div>
        </motion.div>

        {/* Filtres */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-medium smooth-transition ${
              filter === 'all'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Toutes les images ({totalImages})
          </button>
          <button
            onClick={() => setFilter('validated')}
            className={`px-6 py-3 rounded-xl font-medium smooth-transition ${
              filter === 'validated'
                ? 'bg-black text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Validées ({validatedImages})
          </button>
        </div>

        {/* Historique des sessions */}
        <div className="space-y-8">
          {filteredSessions.length === 0 ? (
            <motion.div
              className="bg-white rounded-2xl p-12 text-center border-2 border-gray-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-black mb-2">
                Aucune image pour le moment
              </h3>
              <p className="text-gray-600">
                Commencez à générer des images marketing !
              </p>
            </motion.div>
          ) : (
            filteredSessions.map((session, index) => (
              <motion.div
                key={session.id}
                className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">
                      Session du {new Date(session.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.images.length} image{session.images.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {session.images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-black smooth-transition hover-lift"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          fill
                          className="object-cover"
                        />
                        {image.isValidated && (
                          <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            ✓ Validée
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {image.prompt}
                        </p>

                        <button
                          onClick={() =>
                            handleDownload(
                              image.url,
                              `image4marketing-${image.id}.jpg`
                            )
                          }
                          className="w-full px-3 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 smooth-transition"
                        >
                          📥 Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
