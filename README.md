# 🍽️ Image4Marketing - Générateur d'images marketing IA

![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.14.0-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.3-38B2AC?logo=tailwind-css)

Application Next.js 14+ qui transforme vos photos de plats en images marketing professionnelles via une API d'intelligence artificielle.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [Flux utilisateur](#-flux-utilisateur)
- [API Routes](#-api-routes)
- [Composants](#-composants)
- [Base de données](#-base-de-données)
- [Providers IA](#-providers-ia)
- [Commandes utiles](#-commandes-utiles)
- [Tests](#-tests)
- [Déploiement](#-déploiement)

---

## ✨ Fonctionnalités

### Phase 1 (MVP) ✅
- ✅ Upload d'images avec drag & drop et sélecteur de fichier
- ✅ Validation Zod côté client et serveur
- ✅ Prévisualisation immédiate
- ✅ Génération de 4 variantes marketing (mode MOCK)
- ✅ Gestion d'état avec Zustand
- ✅ Notifications toast avec react-hot-toast
- ✅ Interface responsive avec TailwindCSS

### Phase 2 (Intégration IA & DB) ✅
- ✅ Intégration Prisma avec SQLite
- ✅ Support de 3 providers IA (NanoBanana, Replicate, Stability AI)
- ✅ Régénération d'images avec prompts personnalisés
- ✅ Modal de modification avec suggestions
- ✅ Vue finale avec métadonnées complètes
- ✅ Validation et sauvegarde en base de données
- ✅ Téléchargement et partage d'images
- ✅ Animations Framer Motion

### Phase 3 (À venir)
- ⏳ Animations avancées
- ⏳ Rate Limiting avec Upstash
- ⏳ Accessibilité (A11y) complète
- ⏳ Optimisations performance
- ⏳ Page de partage public
- ⏳ Historique des sessions

---

## 🛠️ Stack Technique

| Technologie | Version | Rôle |
|------------|---------|------|
| **Next.js** | 14.2.3 | Framework React avec App Router |
| **TypeScript** | 5.4.5 | Typage strict (mode strict activé) |
| **Prisma** | 5.14.0 | ORM pour la base de données |
| **SQLite** | - | Base de données (dev) |
| **Zustand** | 4.5.2 | State management |
| **Zod** | 3.23.8 | Validation de schémas |
| **TailwindCSS** | 3.4.3 | Styling utility-first |
| **Framer Motion** | 11.2.6 | Animations |
| **React Hot Toast** | 2.4.1 | Notifications |
| **Sharp** | 0.33.4 | Optimisation d'images |
| **clsx + tailwind-merge** | - | Gestion conditionnelle de classes |

---

## 📦 Installation

### Prérequis

- **Node.js** 18+
- **npm** ou **yarn**

### Étapes

```bash
# 1. Cloner le repository (ou utiliser le dossier existant)
cd image4marketing

# 2. Installer les dépendances
npm install

# 3. Créer le dossier uploads
mkdir -p public/uploads
touch public/uploads/.gitkeep

# 4. Copier le fichier d'environnement
cp .env.local.example .env.local
# Ou créer manuellement .env.local (voir section Configuration)

# 5. Générer le client Prisma
npx prisma generate

# 6. Créer la base de données
npx prisma db push

# 7. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

---

## ⚙️ Configuration

### Variables d'environnement (`.env.local`)

```bash
# Base de données SQLite (dev)
DATABASE_URL="file:./dev.db"

# API IA (laisser vide pour utiliser le mode MOCK)
AI_API_KEY=
AI_API_PROVIDER=nanobanana

# URL publique de l'application (pour le partage)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Configuration des providers IA

#### Mode MOCK (par défaut)
Laissez `AI_API_KEY` vide. Le système générera automatiquement 4 images mockées depuis Unsplash.

#### NanoBanana
```bash
AI_API_KEY=your_nanobanana_api_key
AI_API_PROVIDER=nanobanana
```

#### Replicate
```bash
AI_API_KEY=r8_your_replicate_token
AI_API_PROVIDER=replicate
```

#### Stability AI
```bash
AI_API_KEY=sk-your_stability_key
AI_API_PROVIDER=stability
```

---

## 📁 Structure du projet

```
image4marketing/
├── prisma/
│   └── schema.prisma              # Schéma de la base de données
├── public/
│   └── uploads/                   # Images uploadées
│       └── .gitkeep
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/
│   │   │   │   └── route.ts       # POST /api/generate
│   │   │   ├── regenerate/
│   │   │   │   └── route.ts       # POST /api/regenerate
│   │   │   ├── upload/
│   │   │   │   └── route.ts       # POST /api/upload
│   │   │   └── validate/
│   │   │       └── route.ts       # POST /api/validate
│   │   ├── globals.css            # Styles globaux
│   │   ├── layout.tsx             # Layout principal
│   │   └── page.tsx               # Page d'accueil
│   ├── components/
│   │   ├── FinalCard.tsx          # Vue finale avec validation
│   │   ├── ImageGrid.tsx          # Grille d'images générées
│   │   ├── LoadingSpinner.tsx     # Spinner de chargement
│   │   ├── ModifyDialog.tsx       # Modal de modification
│   │   └── UploadArea.tsx         # Zone d'upload drag & drop
│   ├── lib/
│   │   ├── ai-client.ts           # Client IA multi-providers
│   │   ├── prisma.ts              # Client Prisma singleton
│   │   ├── utils.ts               # Fonctions utilitaires
│   │   └── zod-schemas.ts         # Schémas de validation
│   ├── store/
│   │   └── image-store.ts         # Store Zustand
│   └── types/
│       └── index.ts               # Types TypeScript
├── .env.local                     # Variables d'environnement
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔄 Flux utilisateur

### 1️⃣ Étape 1 : Upload
- L'utilisateur upload une photo de plat
- Méthodes : drag & drop OU bouton "Choisir un fichier"
- Validation Zod : format (JPEG, PNG, WebP) et taille (< 10MB)
- Prévisualisation immédiate
- L'image est optimisée avec Sharp et sauvegardée dans `/public/uploads/`

### 2️⃣ Étape 2 : Génération
- Clic sur "Générer les images marketing"
- Appel à `/api/generate` avec l'URL de l'image
- L'API appelle le client IA (mock ou réel selon config)
- 4 variantes sont générées avec des prompts différents :
  - Sur table en bois élégante
  - Fond monochrome moderne
  - Ingrédients frais éparpillés
  - Ambiance restaurant avec bokeh
- Sauvegarde en DB (Session + 4 Images)
- Affichage dans la grille

### 3️⃣ Étape 3 : Modification (optionnelle)
- Clic sur "Modifier" sur une image
- Modal animée s'ouvre avec :
  - Prévisualisation de l'image
  - Prompt actuel
  - Zone de texte pour modifications
  - 6 suggestions cliquables
- Validation Zod : minimum 10 caractères
- Appel à `/api/regenerate`
- L'image est mise à jour dans la grille

### 4️⃣ Étape 4 : Sélection finale
- Clic sur "Choisir" sur l'image préférée
- Vue `FinalCard` s'affiche avec :
  - Image haute résolution
  - Métadonnées (ID, date, prompt)
  - Boutons d'action

### 5️⃣ Étape 5 : Validation
- Clic sur "✓ Valider cette image"
- Appel à `/api/validate`
- Mise à jour DB : `isFinal=true`, `isValidated=true`
- Génération des URLs de téléchargement et partage

### 6️⃣ Étape 6 : Actions finales
- **📥 Télécharger** : Télécharge l'image en haute résolution
- **🔗 Partager** : Copie l'URL publique dans le presse-papier
- **🔄 Recommencer** : Reset complet pour une nouvelle session

---

## 🔌 API Routes

### POST `/api/upload`
**Description** : Upload et optimisation d'une image

**Input** :
```typescript
FormData {
  file: File // JPEG, PNG, WebP (< 10MB)
}
```

**Output** :
```typescript
{
  uploadId: string;
  imageUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}
```

---

### POST `/api/generate`
**Description** : Génère 4 variantes marketing

**Input** :
```typescript
{
  imageUrl: string;
  stylePrompt?: string;
}
```

**Output** :
```typescript
{
  sessionId: string;
  images: Array<{
    id: string;
    url: string;
    prompt: string;
    createdAt: string;
  }>;
}
```

**Logique** :
1. Validation Zod
2. Appel au client IA (4 variantes)
3. Création de `Session` dans Prisma
4. Création de 4 `Image` liées à la session
5. Retour des images générées

---

### POST `/api/regenerate`
**Description** : Régénère une image avec un nouveau prompt

**Input** :
```typescript
{
  sessionId: string;
  imageId: string;
  userPrompt: string; // min 10 caractères
}
```

**Output** :
```typescript
{
  imageId: string;
  newImageUrl: string;
  newPrompt: string;
}
```

**Logique** :
1. Validation Zod
2. Récupération de l'image originale depuis Prisma
3. Appel à `regenerateImage()` avec le nouveau prompt
4. Mise à jour de l'image dans Prisma
5. Retour de la nouvelle URL

---

### POST `/api/validate`
**Description** : Valide une image finale

**Input** :
```typescript
{
  sessionId: string;
  finalImageId: string;
}
```

**Output** :
```typescript
{
  success: boolean;
  downloadUrl: string;
  shareUrl: string;
  image: {
    id: string;
    url: string;
    prompt: string;
  };
}
```

**Logique** :
1. Validation Zod
2. Vérification que l'image appartient à la session
3. Mise à jour : `isFinal=true`, `isValidated=true`
4. Génération des URLs de téléchargement et partage
5. Retour des informations

---

## 🎨 Composants

### `UploadArea.tsx`
**Rôle** : Zone d'upload drag & drop avec bouton

**Props** : Aucune

**État local** :
- `isDragging` : État du drag & drop
- `preview` : URL de prévisualisation
- `uploading` : État de chargement

**Fonctionnalités** :
- Drag & drop
- Bouton "Choisir un fichier"
- Validation Zod côté client
- Prévisualisation immédiate
- Upload vers `/api/upload`
- Bouton "Changer l'image" après upload

---

### `ImageGrid.tsx`
**Rôle** : Affiche les 4 images générées

**Props** : Aucune (utilise le store Zustand)

**État local** :
- `modifyingImage` : Image en cours de modification

**Fonctionnalités** :
- Affichage en grille responsive (1 col mobile, 2 cols desktop)
- Bouton "Choisir" : passe à la vue finale
- Bouton "Modifier" : ouvre la modal `ModifyDialog`

---

### `ModifyDialog.tsx`
**Rôle** : Modal animée pour régénérer une image

**Props** :
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageUrl: string;
  currentPrompt: string;
}
```

**État local** :
- `userPrompt` : Prompt personnalisé saisi
- `isRegenerating` : État de chargement

**Fonctionnalités** :
- Animations Framer Motion (backdrop blur + modal scale)
- Textarea pour prompt personnalisé
- 6 suggestions cliquables
- Validation Zod (min 10 caractères)
- Appel à `/api/regenerate`
- Mise à jour automatique dans le store

---

### `FinalCard.tsx`
**Rôle** : Vue finale avec actions de validation

**Props** : Aucune (utilise le store Zustand)

**État local** :
- `isValidating` : État de validation
- `validated` : Image validée ou non
- `shareUrl` : URL de partage générée

**Fonctionnalités** :
- Prévisualisation haute résolution
- Affichage des métadonnées (ID, date, prompt)
- Bouton "✓ Valider cette image"
- Bouton "📥 Télécharger" (download local)
- Bouton "🔗 Partager" (copie URL dans presse-papier)
- Bouton "🔄 Recommencer"
- Changement d'UI après validation

---

### `LoadingSpinner.tsx`
**Rôle** : Spinner animé avec texte

**Props** :
```typescript
{
  text?: string; // défaut: "Chargement..."
}
```

**Fonctionnalités** :
- Animation CSS (spin)
- Texte personnalisable

---

## 🗄️ Base de données

### Schéma Prisma

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
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  url         String
  prompt      String
  isFinal     Boolean  @default(false)
  isValidated Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### Relations

- Une `Session` contient plusieurs `Image` (1:N)
- Suppression en cascade : si une session est supprimée, ses images le sont aussi
- `uploadId` : identifiant unique de l'upload
- `originalImage` : URL de l'image uploadée par l'utilisateur
- `isFinal` : marque l'image choisie par l'utilisateur
- `isValidated` : marque l'image comme validée (étape finale)

### Inspecter la base de données

```bash
npx prisma studio
```

Ouvre une interface web sur `http://localhost:5555` pour explorer les données.

---

## 🤖 Providers IA

### Architecture

Le fichier `src/lib/ai-client.ts` supporte 3 providers avec fallback automatique sur le mode MOCK.

### Mode MOCK
**Activation** : `AI_API_KEY` vide ou non défini

**Comportement** :
- Simule un délai de 1.5s
- Retourne 4 images Unsplash de haute qualité
- Parfait pour le développement et les tests

### NanoBanana
**URL** : `https://api.nanobanana.com/v1/generate`

**Configuration** :
```bash
AI_API_KEY=your_nanobanana_key
AI_API_PROVIDER=nanobanana
```

**Requête** :
```typescript
{
  prompt: string;
  image: string; // URL de l'image
  width: 1024;
  height: 1024;
}
```

### Replicate
**URL** : `https://api.replicate.com/v1/predictions`

**Configuration** :
```bash
AI_API_KEY=r8_your_token
AI_API_PROVIDER=replicate
```

**Modèle** : `stability-ai/sdxl:latest`

**Note** : Système de polling pour attendre la complétion de la prédiction.

### Stability AI
**URL** : `https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`

**Configuration** :
```bash
AI_API_KEY=sk-your_key
AI_API_PROVIDER=stability
```

**Paramètres** :
- `cfg_scale: 7`
- `samples: 1`
- `steps: 30`

**Output** : Base64 encodé

---

## 🎯 Commandes utiles

```bash
# Développement
npm run dev              # Lancer le serveur de développement
npm run build            # Build de production
npm run start            # Lancer le build de production
npm run lint             # Linter ESLint

# Base de données
npx prisma generate      # Générer le client Prisma
npx prisma db push       # Appliquer le schéma à la DB
npx prisma studio        # Interface web pour explorer la DB
npx prisma migrate dev   # Créer une migration (production)

# Nettoyage
rm -rf .next             # Supprimer le cache Next.js
rm prisma/dev.db         # Reset de la base de données
rm -rf public/uploads/*  # Supprimer tous les uploads
```

---

## 🧪 Tests

### Tests manuels

1. **Upload** : Tester avec différents formats (JPEG, PNG, WebP) et tailles
2. **Validation** : Tester avec des fichiers invalides (PDF, > 10MB)
3. **Génération** : Vérifier que 4 images sont générées
4. **Modification** : Tester la régénération avec différents prompts
5. **Validation finale** : Vérifier que la DB est mise à jour correctement

### Tests de charge

```bash
# Installer Apache Bench (si nécessaire)
sudo apt-get install apache2-utils

# Test de charge sur /api/upload
ab -n 100 -c 10 http://localhost:3000/api/upload
```

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Variables d'environnement à configurer sur Vercel :
# - DATABASE_URL (PostgreSQL recommandé pour la prod)
# - AI_API_KEY
# - AI_API_PROVIDER
# - NEXT_PUBLIC_APP_URL
```

### Base de données en production

⚠️ **Important** : SQLite n'est pas recommandé pour la production.

Utilisez **PostgreSQL** ou **MySQL** :

```bash
# PostgreSQL sur Vercel
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"

# Appliquer les migrations
npx prisma migrate deploy
```

### Stockage d'images en production

Remplacer `/public/uploads/` par un service cloud :
- **Vercel Blob Storage**
- **AWS S3**
- **Cloudinary**
- **UploadThing**

---

## 🐛 Troubleshooting

### Erreur : "Module not found: Can't resolve 'sharp'"

```bash
npm install sharp
```

### Erreur : "Prisma Client not found"

```bash
npx prisma generate
```

### Les images mockées ne s'affichent pas

Vérifier la configuration `next.config.js` :

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
}
```

### Erreur : "ENOENT: no such file or directory 'public/uploads'"

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

### Les animations Framer Motion ne fonctionnent pas

Vérifier que le composant utilise bien `"use client"` en haut du fichier.

---

## 📝 License

Ce projet est un MVP éducatif. Libre d'utilisation.

---

## 👨‍💻 Auteur

Développé avec ❤️ par ITNKOC 

---

## 🙏 Remerciements

- **Next.js** pour le framework
- **Vercel** pour l'hébergement
- **Unsplash** pour les images mockées
- **Prisma** pour l'ORM élégant
- **TailwindCSS** pour le styling rapide
