'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message === 'Email not confirmed' 
        ? 'Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada o desactiva la confirmación de correos en la configuración de Supabase (Authentication > Providers > Email).' 
        : signInError.message)
      setLoading(false)
      return
    }

    // Verificar si el usuario está activo en nuestra tabla public.usuarios
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: dbUser } = await supabase
        .from('usuarios')
        .select('activo')
        .eq('auth_user_id', user.id)
        .single()

      if (dbUser && dbUser.activo === false) {
        await supabase.auth.signOut()
        setError('Tu cuenta está registrada pero aún no ha sido activada por un Administrador.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f5fa] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="bg-[#1F4E79] p-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">Fundata</h2>
          <p className="text-blue-100 mt-2 font-medium">Sistema de Gestión de Indicadores</p>
        </div>
        
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h3>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none transition-shadow"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-70 mt-2"
            >
              {loading ? 'Ingresando...' : 'Entrar al Sistema'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-bold text-[#1F4E79] hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
