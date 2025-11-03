import 'next-auth';

declare module 'next-auth' {
  interface User {
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
  }
}
