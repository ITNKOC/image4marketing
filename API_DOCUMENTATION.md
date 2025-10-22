# 🔌 API Documentation - Image4Marketing

Documentation complète de toutes les API Routes du projet.

---

## 📍 Base URL

```
Développement: http://localhost:3000
Production:    https://your-domain.com
```

---

## 🔐 Authentification

Actuellement, l'API n'a **pas d'authentification**.

Pour la Phase 3 (production), il est recommandé d'ajouter :
- JWT tokens
- API keys
- Rate limiting par IP/utilisateur

---

## 📋 Endpoints Overview

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/upload` | POST | Upload et optimise une image | Non |
| `/api/generate` | POST | Génère 4 variantes marketing | Non |
| `/api/regenerate` | POST | Régénère une image avec nouveau prompt | Non |
| `/api/validate` | POST | Valide une image finale | Non |

---

## 📤 POST `/api/upload`

### Description
Upload une photo de plat, l'optimise avec Sharp, et la sauvegarde dans `/public/uploads/`.

### Request

**Content-Type:** `multipart/form-data`

**Body:**
```typescript
{
  file: File // JPEG, PNG, WebP (< 10MB)
}
```

**Exemple avec cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

**Exemple avec JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

### Response

**Status 200 - Success:**
```json
{
  "uploadId": "1714123456789-abc123def",
  "imageUrl": "/uploads/1714123456789-abc123def.jpg",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 2048576
  }
}
```

**Status 400 - Validation Error:**
```json
{
  "error": "Format de fichier non supporté"
}
```

**Status 400 - File Size Error:**
```json
{
  "error": "Le fichier dépasse la taille maximale de 10MB"
}
```

**Status 500 - Server Error:**
```json
{
  "error": "Erreur lors de l'upload du fichier"
}
```

### Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `file` | File | ✅ | JPEG/PNG/WebP, < 10MB |

### Notes

- L'image est automatiquement redimensionnée à 2000x2000px max (ratio préservé)
- Qualité JPEG : 90%
- Les images sont sauvegardées dans `/public/uploads/` avec un nom unique

---

## 🎨 POST `/api/generate`

### Description
Génère 4 variantes marketing d'une image uploadée via une API IA.

Crée une `Session` et 4 `Image` dans la base de données Prisma.

### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "imageUrl": "/uploads/1714123456789-abc123def.jpg",
  "stylePrompt": "modern minimalist" // optionnel
}
```

**Exemple avec cURL:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "/uploads/1714123456789-abc123def.jpg"
  }'
```

**Exemple avec JavaScript:**
```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: uploadedImage.url,
    stylePrompt: 'elegant'
  }),
});

const data = await response.json();
```

### Response

**Status 200 - Success:**
```json
{
  "sessionId": "clx123abc456def",
  "images": [
    {
      "id": "clx456ghi789jkl",
      "url": "https://images.unsplash.com/photo-Yn0l7uwBrpw?w=800&q=80",
      "prompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K on elegant wooden table surface",
      "createdAt": "2024-05-20T10:30:45.123Z"
    },
    {
      "id": "clx789mno012pqr",
      "url": "https://images.unsplash.com/photo-jpkfc5_d-DI?w=800&q=80",
      "prompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K with modern monochrome background",
      "createdAt": "2024-05-20T10:30:45.456Z"
    },
    {
      "id": "clx345stu678vwx",
      "url": "https://images.unsplash.com/photo-N_Y88TWmGwA?w=800&q=80",
      "prompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K with fresh ingredients scattered artfully",
      "createdAt": "2024-05-20T10:30:45.789Z"
    },
    {
      "id": "clx901yzа234bcd",
      "url": "https://images.unsplash.com/photo-MQUqbmszGGM?w=800&q=80",
      "prompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K with restaurant ambiance blur background",
      "createdAt": "2024-05-20T10:30:46.012Z"
    }
  ]
}
```

**Status 400 - Validation Error:**
```json
{
  "error": "URL invalide"
}
```

**Status 500 - Server Error:**
```json
{
  "error": "Erreur lors de la génération des images"
}
```

### Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `imageUrl` | string | ✅ | URL valide |
| `stylePrompt` | string | ❌ | Texte libre |

### Database Operations

1. Crée une `Session` :
   - `uploadId`: généré automatiquement
   - `originalImage`: URL de l'image uploadée

2. Crée 4 `Image` liées à la session :
   - `url`: URL de l'image générée
   - `prompt`: Prompt utilisé pour la génération
   - `isFinal`: `false` par défaut
   - `isValidated`: `false` par défaut

### AI Provider Behavior

| Provider | Temps de réponse | Mode Async |
|----------|------------------|------------|
| MOCK | ~1.5s | Non |
| NanoBanana | 5-15s | Non |
| Replicate | 10-30s | Oui (polling) |
| Stability AI | 8-20s | Non |

---

## 🔄 POST `/api/regenerate`

### Description
Régénère une image existante avec un nouveau prompt personnalisé.

Met à jour l'`Image` dans la base de données avec la nouvelle URL et le nouveau prompt.

### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "sessionId": "clx123abc456def",
  "imageId": "clx456ghi789jkl",
  "userPrompt": "ajouter fond noir minimaliste, lumière douce"
}
```

**Exemple avec cURL:**
```bash
curl -X POST http://localhost:3000/api/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clx123abc456def",
    "imageId": "clx456ghi789jkl",
    "userPrompt": "ajouter fond noir"
  }'
```

**Exemple avec JavaScript:**
```javascript
const response = await fetch('/api/regenerate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'clx123abc456def',
    imageId: 'clx456ghi789jkl',
    userPrompt: 'ajouter fond noir minimaliste',
  }),
});

const data = await response.json();
```

### Response

**Status 200 - Success:**
```json
{
  "imageId": "clx456ghi789jkl",
  "newImageUrl": "https://images.unsplash.com/photo-tAKXap853rY?w=800&q=80",
  "newPrompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K on elegant wooden table surface + ajouter fond noir minimaliste, lumière douce"
}
```

**Status 400 - Validation Error:**
```json
{
  "error": "Le prompt doit faire au moins 10 caractères"
}
```

**Status 404 - Not Found:**
```json
{
  "error": "Image non trouvée"
}
```

**Status 500 - Server Error:**
```json
{
  "error": "Erreur lors de la régénération de l'image"
}
```

### Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `sessionId` | string | ✅ | Non vide |
| `imageId` | string | ✅ | Non vide |
| `userPrompt` | string | ✅ | Min 10 caractères |

### Database Operations

1. Récupère l'`Image` existante via `imageId`
2. Combine `originalPrompt` + `userPrompt`
3. Appelle l'API IA avec le prompt combiné
4. Met à jour l'`Image` :
   - `url`: nouvelle URL
   - `prompt`: nouveau prompt combiné

---

## ✅ POST `/api/validate`

### Description
Valide une image finale choisie par l'utilisateur.

Marque l'`Image` comme `isFinal=true` et `isValidated=true` dans la base de données.

Génère les URLs de téléchargement et de partage.

### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "sessionId": "clx123abc456def",
  "finalImageId": "clx456ghi789jkl"
}
```

**Exemple avec cURL:**
```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "clx123abc456def",
    "finalImageId": "clx456ghi789jkl"
  }'
```

**Exemple avec JavaScript:**
```javascript
const response = await fetch('/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'clx123abc456def',
    finalImageId: 'clx456ghi789jkl',
  }),
});

const data = await response.json();
```

### Response

**Status 200 - Success:**
```json
{
  "success": true,
  "downloadUrl": "https://images.unsplash.com/photo-Yn0l7uwBrpw?w=800&q=80",
  "shareUrl": "http://localhost:3000/share/clx123abc456def/clx456ghi789jkl",
  "image": {
    "id": "clx456ghi789jkl",
    "url": "https://images.unsplash.com/photo-Yn0l7uwBrpw?w=800&q=80",
    "prompt": "Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K on elegant wooden table surface"
  }
}
```

**Status 400 - Validation Error:**
```json
{
  "error": "Image ID requis"
}
```

**Status 404 - Not Found:**
```json
{
  "error": "Image non trouvée ou ne correspond pas à la session"
}
```

**Status 500 - Server Error:**
```json
{
  "error": "Erreur lors de la validation de l'image"
}
```

### Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `sessionId` | string | ✅ | Non vide |
| `finalImageId` | string | ✅ | Non vide |

### Database Operations

1. Vérifie que l'`Image` existe et appartient à la `Session`
2. Met à jour l'`Image` :
   - `isFinal`: `true`
   - `isValidated`: `true`
3. Génère les URLs :
   - `downloadUrl`: URL directe de l'image
   - `shareUrl`: URL publique de partage (format: `/share/{sessionId}/{imageId}`)

---

## 🚨 Error Codes

| Status Code | Signification | Exemple de message |
|-------------|---------------|-------------------|
| **200** | Success | Requête réussie |
| **400** | Bad Request | Validation Zod échouée, paramètres manquants |
| **404** | Not Found | Ressource introuvable (Image, Session) |
| **500** | Internal Server Error | Erreur serveur, DB error, API IA error |

---

## 📦 Common Response Headers

```
Content-Type: application/json
X-Powered-By: Next.js
```

---

## 🧪 Testing avec Postman

### Collection Postman

Créer une nouvelle collection avec ces requests :

#### 1. Upload Image
```
POST http://localhost:3000/api/upload
Body: form-data
  - file: [select file]
```

#### 2. Generate Images
```
POST http://localhost:3000/api/generate
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "imageUrl": "{{uploadedImageUrl}}"
}
```

#### 3. Regenerate Image
```
POST http://localhost:3000/api/regenerate
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "sessionId": "{{sessionId}}",
  "imageId": "{{imageId}}",
  "userPrompt": "ajouter fond sombre"
}
```

#### 4. Validate Image
```
POST http://localhost:3000/api/validate
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "sessionId": "{{sessionId}}",
  "finalImageId": "{{imageId}}"
}
```

### Variables d'environnement Postman

```json
{
  "uploadedImageUrl": "",
  "sessionId": "",
  "imageId": ""
}
```

---

## 🔒 Rate Limiting (À implémenter - Phase 3)

### Recommandations

| Endpoint | Limite | Période |
|----------|--------|---------|
| `/api/upload` | 10 requêtes | par minute |
| `/api/generate` | 5 requêtes | par minute |
| `/api/regenerate` | 10 requêtes | par minute |
| `/api/validate` | 20 requêtes | par minute |

### Implémentation avec Upstash

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requêtes, veuillez réessayer plus tard' },
      { status: 429 }
    );
  }

  // ... suite de la logique
}
```

---

## 📊 Monitoring & Analytics

### Métriques importantes à surveiller

| Métrique | Description | Seuil d'alerte |
|----------|-------------|----------------|
| Latence `/api/generate` | Temps de réponse | > 30s |
| Taux d'erreur 500 | Erreurs serveur | > 1% |
| Taille des uploads | Taille moyenne des fichiers | > 5MB |
| Appels IA | Coût par requête | Budget dépassé |

### Outils recommandés

- **Vercel Analytics** : Performance
- **Sentry** : Error tracking
- **LogRocket** : Session replay
- **DataDog** : Infrastructure monitoring

---

## 🔧 Debugging

### Activer les logs détaillés

Dans `.env.local` :
```bash
DEBUG=prisma:*
```

### Logs Console

Tous les endpoints loguent les erreurs avec `console.error()` :

```typescript
catch (error) {
  console.error('Erreur génération:', error);
  return NextResponse.json({ error: '...' }, { status: 500 });
}
```

### Prisma Studio

Pour inspecter la base de données :

```bash
npx prisma studio
```

---

## 📚 Références

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Validation](https://zod.dev)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Sharp Image Processing](https://sharp.pixelplumbing.com)
