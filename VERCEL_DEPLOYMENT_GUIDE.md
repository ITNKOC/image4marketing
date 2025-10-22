# 🚀 Guide de Déploiement Vercel - Image4Marketing

Guide étape par étape pour déployer l'application sur Vercel.

---

## ⚠️ IMPORTANT : Ordre des Étapes

**Vous DEVEZ configurer la base de données AVANT le premier build, sinon le build échouera.**

---

## 📋 Étape 1 : Créer le Projet Vercel

### Option A : Via GitHub (Recommandé)

1. **Push votre code sur GitHub** :
```bash
git add .
git commit -m "feat: ready for Vercel deployment"
git push origin main
```

2. **Connecter à Vercel** :
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New Project"
   - Importez votre repository GitHub
   - **NE PAS DÉPLOYER TOUT DE SUITE !** ❌

### Option B : Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

---

## 📋 Étape 2 : Créer la Base de Données Postgres

**AVANT tout déploiement**, créez la base de données :

1. **Dans le dashboard Vercel**, allez dans votre projet
2. Cliquez sur l'onglet **"Storage"**
3. Cliquez sur **"Create Database"**
4. Sélectionnez **"Postgres"**
5. Choisissez la région la plus proche de vos utilisateurs
6. Cliquez sur **"Create"**

Vercel va automatiquement :
- Créer la base de données Postgres
- Ajouter `DATABASE_URL` à vos variables d'environnement
- Connecter la DB à votre projet

---

## 📋 Étape 3 : Configurer les Variables d'Environnement

Dans le dashboard Vercel, allez dans **"Settings" → "Environment Variables"** et ajoutez :

### Variables Obligatoires

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | *Auto-généré par Vercel Postgres* | URL de connexion PostgreSQL |

### Variables Optionnelles

| Variable | Valeur | Description |
|----------|--------|-------------|
| `AI_API_PROVIDER` | `replicate` ou `nanobanana` ou `stability` | Provider IA (mode MOCK si absent) |
| `AI_API_KEY` | Votre clé API | Clé pour le provider IA choisi |
| `UPSTASH_REDIS_REST_URL` | URL Upstash | Pour le rate limiting (optionnel) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash | Pour le rate limiting (optionnel) |

**Note** : Si vous n'ajoutez pas `AI_API_KEY`, l'application fonctionnera en mode MOCK (images Unsplash).

---

## 📋 Étape 4 : Configurer Prisma pour Production

Le `package.json` contient déjà le script `postinstall` qui génère automatiquement Prisma Client :

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

✅ **Rien à faire ici, c'est déjà configuré !**

---

## 📋 Étape 5 : Migrer le Schéma Prisma

Après avoir créé la base de données, vous devez appliquer le schéma :

### Option A : Depuis votre machine locale

```bash
# 1. Copiez la DATABASE_URL depuis Vercel
# 2. Ajoutez-la temporairement dans .env.local
echo "DATABASE_URL=postgresql://..." >> .env.local

# 3. Appliquez le schéma
npx prisma db push

# 4. (Optionnel) Vérifiez le schéma
npx prisma studio
```

### Option B : Via Vercel CLI

```bash
vercel env pull .env.production
npx prisma db push
```

**Note** : `prisma db push` est recommandé pour Vercel (pas de migration files).

---

## 📋 Étape 6 : Déployer l'Application

Maintenant que tout est configuré, vous pouvez déployer :

### Via Dashboard Vercel

1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur **"Redeploy"** ou **"Deploy"**
3. Attendez que le build se termine ✅

### Via CLI

```bash
vercel --prod
```

---

## 📋 Étape 7 : Vérifications Post-Déploiement

### 1. **Vérifier que l'application fonctionne**
```bash
curl https://your-app.vercel.app/
```

### 2. **Tester l'upload**
- Allez sur votre app
- Uploadez une image
- Vérifiez que ça fonctionne

### 3. **Vérifier les logs**
```bash
vercel logs your-app.vercel.app
```

---

## 🔧 Configuration Avancée

### Storage pour les Images Uploadées

⚠️ **Important** : Vercel utilise un système de fichiers éphémère. Les fichiers uploadés dans `/public/uploads` seront perdus après chaque redéploiement.

**Solutions** :

#### Option 1 : Vercel Blob (Recommandé)

```bash
npm install @vercel/blob
```

Modifiez `src/app/api/upload/route.ts` :
```tsx
import { put } from '@vercel/blob';

// Au lieu de fs.writeFile
const blob = await put(fileName, buffer, {
  access: 'public',
});

return NextResponse.json({
  uploadId,
  imageUrl: blob.url, // URL permanente
});
```

#### Option 2 : Cloudinary

```bash
npm install cloudinary
```

#### Option 3 : AWS S3

```bash
npm install @aws-sdk/client-s3
```

### Configuration du Domaine Personnalisé

1. Allez dans **"Settings" → "Domains"**
2. Ajoutez votre domaine
3. Suivez les instructions DNS

---

## 🐛 Troubleshooting

### Problème : Build échoue avec "Prisma Client not generated"

**Solution** :
```bash
# Vérifiez que package.json contient :
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Problème : "Failed to collect page data for /api/generate"

**Solution** :
1. Vérifiez que `DATABASE_URL` est configuré dans Vercel
2. Vérifiez que toutes les routes API ont `export const dynamic = 'force-dynamic';`
3. Relancez le build après avoir configuré la DB

### Problème : Images uploadées disparaissent après redéploiement

**Solution** : Utilisez Vercel Blob ou Cloudinary (voir section Storage ci-dessus)

### Problème : Rate limiting ne fonctionne pas

**Solution** : Le rate limiting en mémoire ne fonctionne pas en serverless. Configurez Upstash Redis :
```bash
npm install @upstash/ratelimit @upstash/redis
```

---

## 📊 Monitoring et Analytics

### Vercel Analytics (Gratuit)

```bash
npm install @vercel/analytics
```

Dans `src/app/layout.tsx` :
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Vercel Speed Insights (Gratuit)

```bash
npm install @vercel/speed-insights
```

Dans `src/app/layout.tsx` :
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 🚀 Checklist Finale

Avant de déployer, vérifiez :

- [ ] Base de données Postgres créée sur Vercel
- [ ] `DATABASE_URL` configuré dans les variables d'environnement
- [ ] Schéma Prisma appliqué avec `npx prisma db push`
- [ ] (Optionnel) `AI_API_KEY` configuré
- [ ] (Optionnel) Vercel Blob configuré pour le storage
- [ ] Code pushé sur GitHub
- [ ] Build local réussit avec `npm run build`
- [ ] Toutes les routes API ont `export const dynamic = 'force-dynamic'`
- [ ] `package.json` contient le script `postinstall`

---

## 🎉 Déploiement Réussi !

Votre application est maintenant en ligne sur :
```
https://your-app.vercel.app
```

### Prochaines Étapes

1. **Configurer un domaine personnalisé**
2. **Activer Vercel Analytics**
3. **Configurer le storage permanent** (Vercel Blob)
4. **Ajouter Sentry** pour le monitoring d'erreurs
5. **Configurer Upstash Redis** pour un rate limiting distribué

---

## 📚 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**Bon déploiement ! 🚀**
