'use client'

import React, { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

export default function AdminTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-luker-orange text-luker-brown'
                : 'border-transparent text-muted-foreground hover:text-luker-brown hover:border-luker-orange/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-card rounded-lg border border-border shadow-card p-6">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}
