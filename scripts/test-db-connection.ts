/**
 * Script de test de connexion à la base de données
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Test de connexion à la base de données...\n');

  try {
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à PostgreSQL réussie!\n');

    // Vérifier les tables
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const imageCount = await prisma.image.count();

    console.log('📊 État de la base de données:');
    console.log(`   - Utilisateurs: ${userCount}`);
    console.log(`   - Sessions: ${sessionCount}`);
    console.log(`   - Images: ${imageCount}`);
    console.log('');
    console.log('✅ Base de données prête à l\'emploi!');
    console.log('🎉 Les nouvelles images seront automatiquement stockées sur Cloudinary\n');

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
