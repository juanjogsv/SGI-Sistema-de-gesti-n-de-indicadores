import React from 'react'
import { Database } from '@/types/database'

type SemaforoNivel = Database['public']['Enums']['semaforo_enum']

const colorMap: Record<SemaforoNivel, string> = {
  azul: '#1F4E79',
  verde: '#375623',
  amarillo: '#BF8F00',
  amarillo_oscuro: '#7F5B00',
  rojo: '#C00000',
  rojo_critico: '#7B0000',
  gris: '#888888'
}

interface SemaforoProps {
  nivel?: SemaforoNivel | null
}

export default function Semaforo({ nivel }: SemaforoProps) {
  // Fallback a gris si viene nulo
  const safeNivel = nivel || 'gris'
  const bgColor = colorMap[safeNivel]
  
  // Formatear etiqueta: 'amarillo_oscuro' -> 'Amarillo Oscuro'
  const label = safeNivel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="flex items-center gap-2.5">
      <div 
        className="w-3.5 h-3.5 rounded-full flex-shrink-0" 
        style={{ backgroundColor: bgColor }}
      />
      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}
