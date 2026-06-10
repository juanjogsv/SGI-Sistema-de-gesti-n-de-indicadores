'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileUp, Users, LogOut, Activity } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Actualizar Datos', href: '/update', icon: FileUp },
    { name: 'Gestión Usuarios', href: '/admin', icon: Users },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0 shadow-sm z-10 relative">
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">Fundata</h1>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fundación Luker</p>
        </div>
      </div>

      <div className="p-4 flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Menú Principal</p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-50">
        <button className="w-full nav-item hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
