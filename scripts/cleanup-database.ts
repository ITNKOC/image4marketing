/**
 * Script de nettoyage de la base de données
 *
 * Ce script supprime toutes les images et sessions de PostgreSQL
 * pour résoudre le problème de quota de transfert de données.
 *
 * Usage: npx tsx scripts/cleanup-database.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Début du nettoyage de la base de données...\n');

  try {
    // 1. Compter les données actuelles
    const imageCount = await prisma.image.count();
    const sessionCount = await prisma.session.count();
    const userCount = await prisma.user.count();

    console.log('📊 État actuel de la base de données:');
    console.log(`   - Images: ${imageCount}`);
    console.log(`   - Sessions: ${sessionCount}`);
    console.log(`   - Utilisateurs: ${userCount}`);
    console.log('');

    // 2. Supprimer toutes les images
    console.log('🗑️  Suppression de toutes les images...');
    const deletedImages = await prisma.image.deleteMany({});
    console.log(`   ✅ ${deletedImages.count} images supprimées`);

    // 3. Supprimer toutes les sessions
    console.log('🗑️  Suppression de toutes les sessions...');
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`   ✅ ${deletedSessions.count} sessions supprimées`);

    // Note: On garde les utilisateurs
    console.log(`   ℹ️  ${userCount} utilisateurs conservés`);

    console.log('');
    console.log('✅ Nettoyage terminé avec succès!');
    console.log('');
    console.log('📝 Résumé:');
    console.log(`   - ${deletedImages.count} images supprimées`);
    console.log(`   - ${deletedSessions.count} sessions supprimées`);
    console.log(`   - Les nouvelles images seront automatiquement stockées sur Cloudinary`);
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
