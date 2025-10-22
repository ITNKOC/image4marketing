# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### À venir
- Authentification utilisateur (JWT/OAuth)
- Dashboard personnel avec historique
- Batch processing (plusieurs images à la fois)
- Templates prédéfinis
- Export PDF/formats multiples

---

## [1.0.0] - 2024-05-20

### 🎉 Version Initiale - Production Ready

---

## [0.3.0] - 2024-05-20 - Phase 3 (Polish)

### ✨ Added
- **Animations avancées** avec Framer Motion
  - Animations de grille avec stagger children
  - Animations de boutons (hover + tap)
  - Transitions de page fluides
  - Fichier centralisé `src/lib/animations.ts` pour réutilisabilité

- **Rate Limiting**
  - Système de rate limiting en mémoire pour le développement
  - Support Upstash Redis prêt pour la production
  - Limites par endpoint :
    - Upload : 10 req/min
    - Generate : 5 req/min
    - Regenerate : 10 req/min
    - Validate : 20 req/min
  - Headers HTTP (`X-RateLimit-*`) pour feedback client

- **Error Boundaries**
  - Composant `ErrorBoundary` pour capturer les erreurs React
  - UI d'erreur élégante avec actions (réessayer/retour accueil)
  - Détails techniques en mode développement
  - Prêt pour intégration Sentry

- **Page de Partage Public**
  - Route `/share/[sessionId]/[imageId]`
  - Métadonnées Open Graph pour réseaux sociaux
  - Page not-found personnalisée
  - Boutons de téléchargement et création

- **Documentation complète**
  - `README.md` : Documentation générale
  - `ARCHITECTURE.md` : Documentation technique
  - `API_DOCUMENTATION.md` : Documentation API
  - `DEPLOYMENT.md` : Guide de déploiement
  - `DOCUMENTATION_INDEX.md` : Index de navigation
  - `CHANGELOG.md` : Ce fichier

### 🔧 Changed
- ImageGrid maintenant animé avec variants Framer Motion
- Tous les boutons ont des animations hover/tap
- Amélioration de l'expérience utilisateur globale

### 🐛 Fixed
- Optimisation des performances avec `priority` sur images principales

---

## [0.2.0] - 2024-05-19 - Phase 2 (Intégration IA & DB)

### ✨ Added
- **Base de données Prisma**
  - Modèle `Session` pour les sessions utilisateur
  - Modèle `Image` pour les images générées
  - Relations 1:N (Session → Images)
  - Client Prisma avec singleton pattern

- **API IA Multi-Providers**
  - Support de NanoBanana (provider principal)
  - Support de Replicate (alternative)
  - Support de Stability AI (alternative)
  - Fallback automatique sur mode MOCK si `AI_API_KEY` non défini
  - Prompts système avec 4 variations automatiques

- **Endpoints API supplémentaires**
  - `POST /api/regenerate` : Régénération avec prompt personnalisé
  - `POST /api/validate` : Validation image finale
  - Sauvegarde en base de données pour tous les endpoints

- **Composants UI Phase 2**
  - `ModifyDialog.tsx` : Modal animée pour régénération
    - Textarea pour prompts personnalisés
    - 6 suggestions de prompts cliquables
    - Validation Zod (min 10 caractères)
  - `FinalCard.tsx` : Vue finale complète
    - Prévisualisation haute résolution
    - Métadonnées détaillées
    - Actions : Valider, Télécharger, Partager, Recommencer
  - `ImageGrid.tsx` : Bouton "Modifier" maintenant fonctionnel

### 🔧 Changed
- `/api/generate` maintenant sauvegarde en base de données
- Upload d'images maintenant génère un `uploadId` unique
- Store Zustand étendu avec `updateImage()` pour régénération

### 🗄️ Database Schema
```prisma
model Session {
  id            String   @id @default(cuid())
  uploadId      String   @unique
  originalImage String
  createdAt     DateTime @default(now())
  images        Image[]
}

model Image {
  id          String   @id @default(cuid())
  sessionId   String
  session     Session  @relation(...)
  url         String
  prompt      String
  isFinal     Boolean  @default(false)
  isValidated Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## [0.1.0] - 2024-05-18 - Phase 1 (MVP)

### ✨ Added
- **Setup initial du projet**
  - Next.js 14.2.3 avec App Router
  - TypeScript 5.4.5 en mode strict
  - TailwindCSS 3.4.3 avec @tailwindcss/forms
  - Configuration ESLint et Prettier

- **Upload d'images**
  - Composant `UploadArea.tsx` avec drag & drop
  - Bouton "Choisir un fichier" visible
  - Validation Zod côté client et serveur
  - Formats acceptés : JPEG, PNG, WebP
  - Taille maximale : 10MB
  - Prévisualisation immédiate
  - Optimisation avec Sharp (resize + compression)

- **Génération d'images (Mode MOCK)**
  - `POST /api/generate` avec mock intégré
  - 4 variantes générées automatiquement
  - Images mockées depuis Unsplash
  - Prompts système professionnels

- **Interface utilisateur**
  - Layout responsive avec gradient background
  - Indicateur de progression (4 étapes)
  - Composant `LoadingSpinner.tsx`
  - Composant `ImageGrid.tsx` pour afficher 4 images
  - Design avec TailwindCSS (palette indigo + slate)

- **State Management**
  - Store Zustand avec devtools
  - États : `upload`, `generate`, `modify`, `final`
  - Actions : `setUploadedImage`, `startGeneration`, `setGeneratedImages`, `reset`

- **Notifications**
  - react-hot-toast pour toasts
  - Notifications de succès/erreur
  - Configuration des styles dans `layout.tsx`

- **Validation**
  - Schémas Zod pour toutes les entrées
  - Validation double (client + serveur)
  - Messages d'erreur explicites

### 📁 Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts
│   │   └── upload/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ImageGrid.tsx
│   ├── LoadingSpinner.tsx
│   └── UploadArea.tsx
├── lib/
│   ├── ai-client.ts
│   ├── utils.ts
│   └── zod-schemas.ts
├── store/
│   └── image-store.ts
└── types/
    └── index.ts
```

### 🛠️ Configuration Files
- `next.config.js` : Configuration Next.js
- `tailwind.config.ts` : Configuration TailwindCSS
- `tsconfig.json` : TypeScript strict mode
- `postcss.config.js` : PostCSS pour TailwindCSS
- `.env.local` : Variables d'environnement
- `.gitignore` : Fichiers ignorés par Git

---

## Types de changements

- `Added` : Pour les nouvelles fonctionnalités
- `Changed` : Pour les changements dans les fonctionnalités existantes
- `Deprecated` : Pour les fonctionnalités bientôt supprimées
- `Removed` : Pour les fonctionnalités supprimées
- `Fixed` : Pour les corrections de bugs
- `Security` : Pour les corrections de vulnérabilités

---

## [Version Format]

Versions suivent le format MAJOR.MINOR.PATCH :
- **MAJOR** : Changements incompatibles avec les versions précédentes
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs compatibles

---

## Links

- [Repository](https://github.com/username/image4marketing)
- [Documentation](./README.md)
- [Contribution Guide](./CONTRIBUTING.md)
- [License](./LICENSE)
