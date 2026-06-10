'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f5fa] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-[#1F4E79] p-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">Registro</h2>
          <p className="text-blue-100 mt-2 font-medium">Crear nueva cuenta en Fundata</p>
        </div>
        
        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-200">
                <h3 className="font-bold text-lg mb-2">¡Registro Exitoso!</h3>
                <p className="text-sm">
                  Tu cuenta ha sido creada. Sin embargo, por seguridad ingresas como <strong>INACTIVO</strong>. 
                  Un administrador debe aprobarte y asignarte un rol antes de que puedas usar el sistema.
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[#1F4E79] text-white font-bold py-3 rounded-lg hover:bg-[#163857] transition-colors"
              >
                Volver al Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none transition-shadow"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none transition-shadow"
                  placeholder="tu_correo@fundacionluker.org.co"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none transition-shadow"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-70 mt-2"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>

              <div className="mt-8 text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="font-bold text-[#1F4E79] hover:underline">
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
