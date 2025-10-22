# 🏗️ Architecture Technique - Image4Marketing

Documentation technique détaillée de l'architecture, des patterns et des décisions de conception.

---

## 📐 Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   page.tsx  │  │  Components  │  │ Zustand Store│       │
│  │ (Main Page) │◄─┤ (UI Layer)   │◄─┤ (State Mgmt) │       │
│  └──────┬──────┘  └──────────────┘  └──────────────┘       │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │ HTTP Requests
          ▼
┌─────────────────────────────────────────────────────────────┐
│                 NEXT.JS SERVER (App Router)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   API Routes Layer                     │  │
│  │  /api/upload  /api/generate  /api/regenerate  /api/validate│
│  └─────┬─────────────┬─────────────┬─────────────┬────────┘  │
│        │             │             │             │            │
│        ▼             ▼             ▼             ▼            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │               Business Logic Layer                    │    │
│  │    ┌────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │    │ ai-client  │  │   prisma    │  │   utils    │  │    │
│  │    │  (IA API)  │  │ (DB Client) │  │ (Helpers)  │  │    │
│  │    └─────┬──────┘  └──────┬──────┘  └────────────┘  │    │
│  └──────────┼─────────────────┼──────────────────────────┘    │
└─────────────┼─────────────────┼───────────────────────────────┘
              │                 │
              ▼                 ▼
    ┌─────────────────┐  ┌──────────────┐
    │  External AI     │  │   Database   │
    │  Providers API   │  │   (SQLite)   │
    │  (NanoBanana,    │  │   (Prisma)   │
    │   Replicate,     │  │              │
    │   Stability AI)  │  │              │
    └─────────────────┘  └──────────────┘
```

---

## 🎯 Principes de conception

### 1. **Separation of Concerns (SoC)**

Chaque couche a une responsabilité unique :

- **UI Layer** (Components) : Affichage et interactions utilisateur
- **State Management** (Zustand) : État global de l'application
- **API Layer** (API Routes) : Endpoints HTTP, validation, orchestration
- **Business Logic** (lib/) : Logique métier, clients externes
- **Data Layer** (Prisma) : Accès et manipulation de données

### 2. **Typage Strict TypeScript**

Configuration `tsconfig.json` avec tous les flags stricts activés :

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUncheckedIndexedAccess": true
}
```

**Zéro `any`** dans toute la codebase.

### 3. **Validation à Double Niveau**

- **Côté client** : Validation Zod pour feedback immédiat
- **Côté serveur** : Validation Zod redondante pour la sécurité

Exemple dans `UploadArea.tsx` :
```typescript
const validation = uploadFileSchema.safeParse({ file });
if (!validation.success) {
  toast.error(validation.error.errors[0]?.message);
  return;
}
```

Et dans `/api/upload/route.ts` :
```typescript
const validation = uploadFileSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: ... }, { status: 400 });
}
```

### 4. **Error Handling Proactif**

Toutes les fonctions async utilisent `try/catch` :

```typescript
try {
  const response = await fetch('/api/generate', { ... });
  if (!response.ok) throw new Error(...);
  // ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  toast.error(errorMessage);
  setError(errorMessage);
}
```

### 5. **React Server Components First**

Par défaut, tous les composants sont des **Server Components**.

Utilisation de `"use client"` uniquement quand nécessaire :
- Hooks React (`useState`, `useEffect`)
- Gestion d'événements (`onClick`, `onChange`)
- Store Zustand
- Animations Framer Motion

---

## 🗂️ Patterns de conception utilisés

### 1. **Singleton Pattern** (Prisma Client)

`src/lib/prisma.ts` implémente un singleton pour éviter les multiples instances en dev :

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. **Strategy Pattern** (AI Providers)

`src/lib/ai-client.ts` utilise le Strategy Pattern pour supporter plusieurs providers :

```typescript
export async function generateImages(params: GenerateImagesParams) {
  const provider = process.env.AI_API_PROVIDER ?? 'replicate';

  switch (provider) {
    case 'nanobanana':
      return generateWithNanoBanana(params);
    case 'replicate':
      return generateWithReplicate(params);
    case 'stability':
      return generateWithStabilityAI(params);
    default:
      return generateMockImages(params);
  }
}
```

### 3. **Repository Pattern** (Prisma)

Prisma agit comme un repository, isolant la logique de persistance :

```typescript
// Dans /api/generate/route.ts
const session = await prisma.session.create({
  data: {
    uploadId: `upload-${Date.now()}`,
    originalImage: imageUrl,
    images: {
      create: generatedImages.map((img) => ({
        url: img.url,
        prompt: img.prompt,
      })),
    },
  },
  include: { images: true },
});
```

### 4. **Compound Component Pattern** (Modal)

`ModifyDialog.tsx` utilise `AnimatePresence` et `motion` pour créer un compound component animé :

```typescript
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div ... /> {/* Backdrop */}
      <motion.div ... /> {/* Modal */}
    </>
  )}
</AnimatePresence>
```

### 5. **Custom Hooks Pattern** (Zustand)

Utilisation de `useImageStore` comme custom hook :

```typescript
const uploadedImage = useImageStore((state) => state.uploadedImage);
const setGeneratedImages = useImageStore((state) => state.setGeneratedImages);
```

---

## 🔄 Flux de données détaillé

### Upload Flow

```
User Action → UploadArea (Client)
                ├─ handleFile()
                ├─ Validation Zod (client-side)
                ├─ FileReader (preview)
                └─ fetch('/api/upload')
                     ↓
                /api/upload (Server)
                     ├─ Validation Zod (server-side)
                     ├─ Sharp optimization
                     ├─ fs.writeFile()
                     └─ Response { uploadId, imageUrl, metadata }
                          ↓
                UploadArea (Client)
                     ├─ setUploadedImage() → Zustand
                     ├─ currentStep → 'generate'
                     └─ toast.success()
```

### Generation Flow

```
User Click → handleGenerate() (page.tsx)
                ├─ startGeneration() → Zustand (isLoading = true)
                └─ fetch('/api/generate')
                     ↓
                /api/generate (Server)
                     ├─ Validation Zod
                     ├─ generateImages() → ai-client.ts
                     │    ├─ Check AI_API_KEY
                     │    ├─ If empty: generateMockImages()
                     │    └─ Else: call real provider
                     ├─ prisma.session.create()
                     │    └─ images.create() (x4)
                     └─ Response { sessionId, images[] }
                          ↓
                page.tsx (Client)
                     ├─ setGeneratedImages() → Zustand
                     ├─ currentStep → 'modify'
                     ├─ isLoading = false
                     └─ toast.success()
                          ↓
                ImageGrid renders 4 images
```

### Regeneration Flow

```
User Click "Modifier" → ImageGrid
                           ├─ setModifyingImage(image)
                           └─ ModifyDialog opens
                                ↓
User enters prompt → handleRegenerate()
                           ├─ Validation Zod (min 10 chars)
                           └─ fetch('/api/regenerate')
                                ↓
                           /api/regenerate (Server)
                                ├─ Validation Zod
                                ├─ prisma.image.findUnique()
                                ├─ regenerateImage() → ai-client.ts
                                ├─ prisma.image.update()
                                └─ Response { newImageUrl, newPrompt }
                                     ↓
                           ModifyDialog (Client)
                                ├─ updateImage() → Zustand
                                ├─ onClose()
                                └─ toast.success()
                                     ↓
                           ImageGrid re-renders with updated image
```

### Validation Flow

```
User Click "Choisir" → selectImageForFinal() → Zustand
                           ├─ selectedImage = image
                           ├─ currentStep → 'final'
                           └─ FinalCard renders
                                ↓
User Click "✓ Valider" → handleValidate()
                           └─ fetch('/api/validate')
                                ↓
                           /api/validate (Server)
                                ├─ Validation Zod
                                ├─ prisma.image.findFirst()
                                ├─ prisma.image.update({ isFinal, isValidated })
                                └─ Response { downloadUrl, shareUrl }
                                     ↓
                           FinalCard (Client)
                                ├─ setValidated(true)
                                ├─ setShareUrl(url)
                                └─ toast.success()
                                     ↓
                           Buttons enabled: Download, Share
```

---

## 🎨 État Management avec Zustand

### Structure du Store

```typescript
interface ImageStoreState {
  currentStep: 'upload' | 'generate' | 'modify' | 'final';
  uploadedImage: UploadedImage | null;
  generatedImages: GeneratedImage[];
  sessionId: string | null;
  selectedImage: GeneratedImage | null;
  isLoading: boolean;
  error: string | null;
}

interface ImageStoreActions {
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
```

### Pourquoi Zustand ?

1. **Simplicité** : API minimaliste, pas de boilerplate
2. **Performance** : Sélecteurs granulaires évitent les re-renders inutiles
3. **TypeScript** : Excellent support natif
4. **DevTools** : Integration avec Redux DevTools via `devtools()` middleware
5. **Pas de Context Provider** : Utilisable directement sans wrapper

### Exemple d'utilisation optimisée

❌ **Non optimisé** (re-render à chaque changement du store) :
```typescript
const store = useImageStore();
```

✅ **Optimisé** (re-render uniquement si `uploadedImage` change) :
```typescript
const uploadedImage = useImageStore((state) => state.uploadedImage);
```

---

## 🔐 Sécurité

### 1. **Validation des inputs**

Toutes les entrées utilisateur sont validées avec **Zod** :

```typescript
// src/lib/zod-schemas.ts
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
```

### 2. **Sanitization des fichiers**

- Extension vérifiée côté serveur
- Taille limitée à 10MB
- Images optimisées avec **Sharp** (évite les exploits de formats malveillants)

### 3. **SQL Injection Protection**

Prisma utilise des **requêtes paramétrées** automatiquement :

```typescript
// ✅ Sécurisé par défaut
await prisma.image.findUnique({
  where: { id: imageId }
});
```

### 4. **CORS et CSP**

À configurer dans `next.config.js` pour la production :

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'your-domain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
      ],
    },
  ];
}
```

### 5. **Environment Variables**

Jamais de secrets dans le code :
- `AI_API_KEY` uniquement côté serveur
- Variables `NEXT_PUBLIC_*` pour le client

---

## ⚡ Performance & Optimisation

### 1. **Image Optimization**

#### Sharp (Serveur)
```typescript
await sharp(buffer)
  .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 90 })
  .toFile(filePath);
```

#### Next/Image (Client)
```typescript
<Image
  src={image.url}
  alt={image.prompt}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
  priority={isFinal} // Pour l'image finale
/>
```

### 2. **Code Splitting Automatique**

Next.js 14 avec App Router fait du code splitting automatique :
- Chaque route = chunk séparé
- Components dynamiques avec `dynamic()` si nécessaire

### 3. **Server Components**

Réduction de la taille du bundle JavaScript :
- Components sans interactivité = Server Components
- Pas de JS envoyé au client
- Rendu côté serveur

### 4. **Database Queries Optimization**

```typescript
// ✅ Optimisé : inclut les relations nécessaires
const session = await prisma.session.create({
  data: { ... },
  include: { images: true }, // Évite une 2e requête
});

// ❌ Non optimisé : 2 requêtes séparées
const session = await prisma.session.create({ ... });
const images = await prisma.image.findMany({
  where: { sessionId: session.id }
});
```

### 5. **React Hydration Optimization**

Pas d'API calls côté client au montage initial :
- Données statiques = Server Components
- Données dynamiques = chargement après interaction utilisateur

---

## 🧩 Extensibilité

### Ajouter un nouveau provider IA

1. Ajouter une fonction dans `src/lib/ai-client.ts` :

```typescript
async function generateWithNewProvider(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  // Implémentation...
}
```

2. Ajouter le cas dans le switch :

```typescript
switch (provider) {
  case 'newprovider':
    return generateWithNewProvider(params);
  // ...
}
```

3. Configurer `.env.local` :

```bash
AI_API_PROVIDER=newprovider
AI_API_KEY=your_key
```

### Ajouter un nouveau modèle Prisma

1. Éditer `prisma/schema.prisma` :

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  sessions  Session[]
}
```

2. Créer une migration :

```bash
npx prisma migrate dev --name add_user_model
```

3. Utiliser dans les API routes :

```typescript
const user = await prisma.user.create({
  data: { email: 'user@example.com' }
});
```

---

## 🧪 Testing Strategy (Recommandé)

### Unit Tests (Vitest + Testing Library)

```typescript
// utils.test.ts
import { formatFileSize } from './utils';

test('formatFileSize formats bytes correctly', () => {
  expect(formatFileSize(1024)).toBe('1 KB');
  expect(formatFileSize(1048576)).toBe('1 MB');
});
```

### Integration Tests (Playwright)

```typescript
// upload.spec.ts
test('user can upload an image', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');
  await expect(page.locator('text=Upload en cours')).toBeVisible();
});
```

### API Tests (Supertest)

```typescript
// api/upload.test.ts
import request from 'supertest';
import { createServer } from 'http';

test('POST /api/upload validates file size', async () => {
  const response = await request(app)
    .post('/api/upload')
    .attach('file', 'large-file.jpg');

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('10MB');
});
```

---

## 📊 Monitoring & Logging (Production)

### Recommandations

1. **Sentry** : Error tracking
2. **Vercel Analytics** : Performance monitoring
3. **LogRocket** : Session replay
4. **Prisma Pulse** : Database monitoring

### Exemple d'intégration Sentry

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Dans les API routes
try {
  // ...
} catch (error) {
  Sentry.captureException(error);
  return NextResponse.json({ error: '...' }, { status: 500 });
}
```

---

## 🔄 CI/CD Pipeline (Recommandé)

### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run build
```

---

## 📚 Références

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zod Documentation](https://zod.dev)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
