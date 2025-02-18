import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      router.push('/auth/signin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6 transform hover:scale-[1.02] transition-all duration-300">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </h2>
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors duration-300 underline decoration-2 decoration-transparent hover:decoration-purple-600"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="block w-full px-4 py-3.5 rounded-xl border border-gray-300 shadow-sm 
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             text-gray-900 text-sm transition-all duration-300
                             hover:border-indigo-300"
                    placeholder="Enter your full name"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full px-4 py-3.5 rounded-xl border border-gray-300 shadow-sm 
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             text-gray-900 text-sm transition-all duration-300
                             hover:border-indigo-300"
                    placeholder="Enter your email"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="block w-full px-4 py-3.5 rounded-xl border border-gray-300 shadow-sm 
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             text-gray-900 text-sm transition-all duration-300
                             hover:border-indigo-300"
                    placeholder="Create a password"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                         transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
              >
                Create your account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}