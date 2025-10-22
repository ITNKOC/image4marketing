# 🚀 Guide de Déploiement - Image4Marketing

Guide complet pour déployer l'application en production.

---

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Déploiement sur Vercel](#-déploiement-sur-vercel-recommandé)
- [Base de données en production](#-base-de-données-en-production)
- [Stockage d'images en production](#-stockage-dimages-en-production)
- [Variables d'environnement](#-variables-denvironnement)
- [Configuration DNS](#-configuration-dns)
- [Monitoring](#-monitoring)
- [Alternatives à Vercel](#-alternatives-à-vercel)
- [Checklist de déploiement](#-checklist-de-déploiement)

---

## ✅ Prérequis

- ✅ Code testé en local (`npm run dev` fonctionne)
- ✅ Base de données configurée (voir section dédiée)
- ✅ Compte sur la plateforme de déploiement (Vercel, etc.)
- ✅ Clé API IA (NanoBanana, Replicate, ou Stability AI)
- ✅ Repository Git (GitHub, GitLab, Bitbucket)

---

## 🎯 Déploiement sur Vercel (Recommandé)

### Pourquoi Vercel ?

- ✅ **Optimisé pour Next.js** (créé par la même équipe)
- ✅ **Déploiement automatique** depuis Git
- ✅ **Edge Network global** (CDN intégré)
- ✅ **Preview deployments** pour les Pull Requests
- ✅ **Plan gratuit généreux** (Hobby)
- ✅ **Analytics et monitoring intégrés**

### Étape 1 : Préparation

#### 1.1 Créer un compte Vercel

👉 https://vercel.com/signup

Connectez-vous avec GitHub, GitLab ou Bitbucket.

#### 1.2 Installer Vercel CLI (optionnel)

```bash
npm i -g vercel
```

#### 1.3 Pousser le code sur Git

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/image4marketing.git
git push -u origin main
```

### Étape 2 : Configuration Vercel

#### 2.1 Importer le projet

1. Allez sur https://vercel.com/new
2. Cliquez sur "Import Project"
3. Sélectionnez votre repository `image4marketing`
4. Cliquez sur "Import"

#### 2.2 Configurer les variables d'environnement

Dans la section "Environment Variables" :

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `AI_API_KEY` | `your_api_key` | Production |
| `AI_API_PROVIDER` | `replicate` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |

**⚠️ Important** : Ne pas mettre de clés API dans `.env.local` qui serait commit sur Git !

#### 2.3 Build Settings

Vercel détecte automatiquement Next.js. Vérifiez :

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 2.4 Root Directory

Si votre projet est dans un sous-dossier, spécifiez-le. Sinon, laisser `.` (racine).

### Étape 3 : Déployer

Cliquez sur **"Deploy"**.

Vercel va :
1. Cloner le repository
2. Installer les dépendances (`npm install`)
3. Générer le client Prisma (`prisma generate`)
4. Builder l'application (`npm run build`)
5. Déployer sur le Edge Network

⏱️ Durée : 2-5 minutes

### Étape 4 : Vérification

Une fois déployé :

1. Vercel vous donne une URL : `https://image4marketing-xyz.vercel.app`
2. Testez l'application :
   - Upload d'une image
   - Génération des variantes
   - Modification et validation

### Étape 5 : Domaine personnalisé (optionnel)

1. Allez dans **Settings > Domains**
2. Cliquez sur "Add"
3. Entrez votre domaine : `image4marketing.com`
4. Suivez les instructions pour configurer les DNS

---

## 🗄️ Base de données en production

### ⚠️ SQLite n'est PAS recommandé pour la production

SQLite est **read-only** sur Vercel (système de fichiers éphémère).

### Option 1 : PostgreSQL (Recommandé)

#### Providers recommandés

| Provider | Prix | Avantages |
|----------|------|-----------|
| **Vercel Postgres** | À partir de $0 | Intégration native, simple |
| **Supabase** | Free tier disponible | Open-source, features riches |
| **Neon** | Free tier disponible | Serverless, auto-scaling |
| **Railway** | $5/mois | Simple, fiable |

#### Configuration avec Vercel Postgres

1. Allez dans votre projet Vercel
2. Onglet **Storage** > **Create Database**
3. Sélectionnez **Postgres**
4. Vercel crée automatiquement :
   - Une base de données PostgreSQL
   - Les variables d'environnement nécessaires

5. Ajoutez `DATABASE_URL` dans vos variables d'environnement :

```
DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com/verceldb?sslmode=require"
```

#### Migration du schéma Prisma

```bash
# En local
npx prisma migrate dev --name init

# Appliquer en production
npx prisma migrate deploy
```

**⚠️ Important** : Ajoutez ceci dans `package.json` pour que Prisma se génère automatiquement au build :

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Option 2 : MySQL (Alternative)

Providers : **PlanetScale**, **Railway**

Configuration similaire, changez juste le `provider` dans `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

---

## 🖼️ Stockage d'images en production

### ⚠️ `/public/uploads/` n'est PAS persistant sur Vercel

Le système de fichiers est **éphémère**. Les images uploadées seront **supprimées** au prochain déploiement.

### Option 1 : Vercel Blob Storage (Recommandé)

#### Installation

```bash
npm install @vercel/blob
```

#### Configuration

```typescript
// src/app/api/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const blob = await put(file.name, file, {
    access: 'public',
  });

  return NextResponse.json({
    uploadId: blob.pathname,
    imageUrl: blob.url,
  });
}
```

#### Variables d'environnement

Vercel les crée automatiquement quand vous activez Blob Storage :

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

### Option 2 : AWS S3

```bash
npm install @aws-sdk/client-s3
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const command = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: fileName,
  Body: buffer,
  ContentType: file.type,
});

await s3.send(command);
```

### Option 3 : Cloudinary

```bash
npm install cloudinary
```

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const result = await cloudinary.uploader.upload(filePath, {
  folder: 'image4marketing',
});

return result.secure_url;
```

---

## 🔐 Variables d'environnement

### Production

```bash
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# API IA
AI_API_KEY="your_production_api_key"
AI_API_PROVIDER="replicate"

# URL publique
NEXT_PUBLIC_APP_URL="https://image4marketing.com"

# Stockage (si Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"

# Monitoring (optionnel)
SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_AUTH_TOKEN="xxx"

# Rate limiting (si Upstash)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"
```

### Preview (staging)

Mêmes variables, mais avec :
- Une base de données de staging
- Éventuellement une clé API de test
- URL de preview Vercel

### Comment les ajouter sur Vercel

1. **Dashboard Vercel** > Votre projet > **Settings** > **Environment Variables**
2. Ajoutez chaque variable :
   - **Name** : `DATABASE_URL`
   - **Value** : `postgresql://...`
   - **Environments** : Cochez `Production`, `Preview`, `Development`
3. Cliquez sur **Save**
4. Redéployez pour que les changements prennent effet

---

## 🌐 Configuration DNS

### Domaine personnalisé

#### 1. Acheter un domaine

Providers : **Namecheap**, **OVH**, **Google Domains**, **Cloudflare**

#### 2. Configurer les DNS

Allez dans votre registrar de domaine et ajoutez ces enregistrements :

**Pour domaine racine (image4marketing.com) :**

```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**Pour sous-domaine (www.image4marketing.com) :**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

#### 3. Ajouter le domaine sur Vercel

1. **Settings** > **Domains**
2. **Add** > Entrez `image4marketing.com`
3. Vercel vérifie les DNS (peut prendre 24-48h)
4. Une fois validé, Vercel génère automatiquement un certificat SSL

#### 4. Rediriger www vers apex (optionnel)

Dans Vercel, configurez la redirection :

```
www.image4marketing.com → image4marketing.com
```

---

## 📊 Monitoring

### 1. Vercel Analytics (intégré)

Activez dans **Settings** > **Analytics**

Métriques :
- Page views
- Unique visitors
- Top pages
- Countries
- Devices

### 2. Sentry (Error Tracking)

#### Installation

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### Configuration

Fichier créé automatiquement : `sentry.client.config.ts`, `sentry.server.config.ts`

Variables d'environnement :

```
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

### 3. Uptime Monitoring

Providers gratuits :
- **UptimeRobot** (gratuit, 50 monitors)
- **Pingdom**
- **Better Uptime**

Configurez un ping toutes les 5 minutes sur `/api/health`.

### 4. Prisma Accelerate (Performance DB)

```bash
npm install @prisma/extension-accelerate
```

```typescript
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())
```

---

## 🔄 Alternatives à Vercel

### 1. Netlify

**Avantages** :
- Plan gratuit
- CI/CD intégré
- Edge Functions

**Configuration** :

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 2. Railway

**Avantages** :
- Supporte SQLite en production
- Base de données PostgreSQL incluse
- Simple

**Déploiement** :

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 3. Fly.io

**Avantages** :
- Supporte SQLite (avec volumes)
- Edge regions multiples
- Prix compétitif

**Déploiement** :

```bash
fly launch
fly deploy
```

### 4. VPS (DigitalOcean, Linode, AWS EC2)

**Avantages** :
- Contrôle total
- Pas de vendor lock-in
- Peut être moins cher à grande échelle

**Étapes** :

1. Créer un VPS Ubuntu 22.04
2. Installer Node.js 18+
3. Installer PM2 pour process management
4. Configurer Nginx comme reverse proxy
5. Obtenir un certificat SSL avec Let's Encrypt

```bash
# Sur le VPS
git clone https://github.com/username/image4marketing.git
cd image4marketing
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start npm --name "image4marketing" -- start
pm2 save
pm2 startup
```

---

## ✅ Checklist de déploiement

### Avant le déploiement

- [ ] Code testé en local
- [ ] Tous les tests passent (si applicable)
- [ ] Variables d'environnement documentées
- [ ] `.env.local` dans `.gitignore`
- [ ] Base de données de production créée
- [ ] Migrations Prisma appliquées
- [ ] Stockage d'images configuré
- [ ] Clé API IA obtenue

### Configuration Vercel

- [ ] Projet importé depuis Git
- [ ] Variables d'environnement ajoutées
- [ ] Build settings vérifiés
- [ ] Premier déploiement réussi
- [ ] Application testée sur l'URL Vercel

### Post-déploiement

- [ ] Domaine personnalisé configuré (si applicable)
- [ ] DNS propagés et vérifiés
- [ ] Certificat SSL actif
- [ ] Monitoring configuré (Sentry, Analytics)
- [ ] Uptime monitoring activé
- [ ] Tests end-to-end en production

### Sécurité

- [ ] Rate limiting implémenté
- [ ] CORS configuré
- [ ] CSP headers ajoutés
- [ ] Secrets rotationnés (si nécessaire)
- [ ] Logs sensibles supprimés

---

## 🐛 Troubleshooting

### Erreur : "Prisma Client not found" en production

**Solution** : Ajoutez dans `package.json` :

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Erreur : "Cannot write to filesystem" avec SQLite

**Cause** : Système de fichiers read-only sur Vercel.

**Solution** : Migrer vers PostgreSQL (voir section dédiée).

### Erreur : Images uploadées disparaissent

**Cause** : `/public/uploads/` est éphémère sur Vercel.

**Solution** : Utiliser Vercel Blob Storage ou AWS S3 (voir section dédiée).

### Build timeout sur Vercel

**Cause** : Build trop long (limite: 45s sur plan gratuit).

**Solutions** :
- Optimiser les dépendances
- Passer au plan Pro (300s timeout)
- Utiliser `output: 'standalone'` dans `next.config.js`

### Erreur 500 en production mais pas en local

**Debugging** :
1. Vérifier les logs Vercel : **Deployments** > Cliquez sur le déploiement > **View Function Logs**
2. Ajouter Sentry pour error tracking
3. Vérifier que toutes les variables d'environnement sont définies

---

## 📚 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Railway Documentation](https://docs.railway.app)

---

## 🎉 Félicitations !

Votre application est maintenant en production ! 🚀

N'oubliez pas de :
- Monitorer les performances
- Surveiller les coûts (API IA, stockage)
- Collecter les feedbacks utilisateurs
- Itérer et améliorer

---

**Besoin d'aide ?** Consultez les logs, la documentation, ou créez une issue sur GitHub.
