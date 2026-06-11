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
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-luker-brown text-luker-brown'
                : 'border-transparent text-muted-foreground hover:text-foreground/90'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}
