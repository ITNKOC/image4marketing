import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Récupérer l'utilisateur avec ses sessions et images
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      sessions: {
        include: {
          images: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return <ProfileClient user={user} />;
}
