'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function TopNav() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Reportar', href: '/reportar' },
    { name: 'Carga Masiva', href: '/carga-masiva' },
    { name: 'Configuración', href: '/admin' },
  ]

  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard">
                <Image 
                  src="/Logos_Fundacion_Luker/fundacion-luker-color-letra-cafe-horizontal.png" 
                  alt="Fundación Luker"
                  width={150}
                  height={40}
                  className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => {
                const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/')
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-luker-orange text-luker-brown'
                        : 'border-transparent text-muted-foreground hover:border-luker-orange/50 hover:text-luker-brown'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 rounded-md text-sm font-bold text-luker-red hover:bg-luker-red/10 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
