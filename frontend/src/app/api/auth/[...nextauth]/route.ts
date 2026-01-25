// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

// Definición de opciones de NextAuth
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (authError || !authData.user) {
          throw new Error('Credenciales inválidas');
        }

        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!usuarioData) {
          throw new Error('Usuario no encontrado');
        }

        return {
          id: usuarioData.id,
          email: usuarioData.email,
          name: usuarioData.nombre_completo,
          rol: usuarioData.rol,
          cedula: usuarioData.cedula,
          accessToken: authData.session?.access_token,
          refreshToken: authData.session?.refresh_token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? '';
        token.name = user.name ?? '';
        token.rol = user.rol;
        token.cedula = user.cedula;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          rol: token.rol as string,
          cedula: token.cedula as string,
          accessToken: token.accessToken as string,
          refreshToken: token.refreshToken as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};

//  Exportación compatible con Next.js 14 App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
