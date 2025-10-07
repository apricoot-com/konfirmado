import NextAuth, { DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      tenantId: string
    } & DefaultSession['user']
  }
  
  interface User {
    tenantId: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials)
        
        if (!validated.success) {
          return null
        }
        
        const { email, password } = validated.data
        
        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        })
        
        if (!user || !user.password) {
          return null
        }
        
        const isValid = await bcrypt.compare(password, user.password)
        
        if (!isValid) {
          return null
        }
        
        // Check if email is verified
        // Return null instead of throwing error to avoid Configuration error
        if (!user.emailVerified) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
})
