import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DefaultSession } from 'next-auth'

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string
      accessToken?: string
    } & DefaultSession['user']
  }
  // Extend the user type to include the access token
  interface User {
    id: string
    name: string
    email: string
    access_token: string
  }
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })
          
          const data = await res.json()
          
          if (res.ok && data) {
            // Return the user object with the access token
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              access_token: data.access_token 
            }
          }
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/signup'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Pass the access token and user details to the token
        token.accessToken = user.access_token
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Pass the access token and user details to the session
        session.user.id = token.id as string
        session.user.accessToken = token.accessToken as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  }
})