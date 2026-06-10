import React from 'react'

type SemaforoNivel = 'azul' | 'verde' | 'amarillo' | 'amarillo_oscuro' | 'rojo' | 'rojo_critico' | 'gris'

export default function SemaforoBadge({ nivel }: { nivel: SemaforoNivel }) {
  const colors: Record<SemaforoNivel, { bg: string, text: string, label: string }> = {
    azul: { bg: '#D6E4F0', text: '#1F4E79', label: 'Supera Meta' },
    verde: { bg: '#E2EFDA', text: '#375623', label: 'Óptimo' },
    amarillo: { bg: '#FFF2CC', text: '#BF8F00', label: 'Alerta Leve' },
    amarillo_oscuro: { bg: '#FFF2CC', text: '#7F5B00', label: 'Alerta Moderada' },
    rojo: { bg: '#FCE4D6', text: '#C00000', label: 'Peligro' },
    rojo_critico: { bg: '#FCE4D6', text: '#7B0000', label: 'Crítico' },
    gris: { bg: '#F3F4F6', text: '#888888', label: 'Sin Dato' },
  }

  const colorConfig = colors[nivel] || colors.gris

  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ backgroundColor: colorConfig.bg, color: colorConfig.text }}
    >
      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colorConfig.text }}></span>
      {colorConfig.label}
    </span>
  )
}
