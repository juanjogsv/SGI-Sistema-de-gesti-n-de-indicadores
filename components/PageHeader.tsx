import React from 'react'
import Image from 'next/image'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  Icon?: LucideIcon
  iconBgColor?: string
  iconTextColor?: string
}

export default function PageHeader({ 
  title, 
  description, 
  Icon, 
  iconBgColor = 'bg-luker-brown', 
  iconTextColor = 'text-white' 
}: PageHeaderProps) {
  return (
    <header className="bg-white/90 border-b border-border shadow-sm backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 mb-8 flex justify-between items-center">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`${iconBgColor} ${iconTextColor} w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={24} className="sm:w-8 sm:h-8" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-luker-brown to-luker-orange bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm sm:text-base font-medium max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}
