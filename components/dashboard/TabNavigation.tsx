'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'AI Configuration', href: 'ai-config' },
  { name: 'Welcome', href: 'welcome' },
  { name: 'Knowledge', href: 'knowledge' },
  { name: 'Members', href: 'members' },
  { name: 'Reports', href: 'reports' },
  { name: 'Re-engage Members', href: 're-engage' },
]

export function TabNavigation({ basePath }: { basePath: string }) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-800 mb-8">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const href = tab.href === 'ai-config' ? basePath : `${basePath}/${tab.href}`
          const isActive =
            (tab.href === 'ai-config' && pathname === basePath) ||
            pathname === href ||
            pathname?.startsWith(href + '/')
          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {tab.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

