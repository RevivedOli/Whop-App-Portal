'use client'

import { useState } from 'react'

interface ReengageTabProps {
  clientId: string
}

export function ReengageTab({ clientId }: ReengageTabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['notifications', 'reengage']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Re-engage Members</h2>
        <p className="text-gray-400">Configure AI prompts for reaching out to inactive members.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('notifications')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Notifications</h3>
              <p className="text-sm text-gray-400">Choose admins and configure notification types.</p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('notifications') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('notifications') && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notification Recipients
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter admin emails (comma-separated)"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
                  />
                  Email notifications
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
                  />
                  In-app notifications
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('reengage')}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Re-engage Members</h3>
              <p className="text-sm text-gray-400">
                Configure AI prompts for reaching out to inactive members.
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                expandedSections.has('reengage') ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has('reengage') && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Re-engagement Prompt
                </label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter the AI prompt for re-engaging inactive members..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inactivity Threshold (days)
                </label>
                <input
                  type="number"
                  min="1"
                  defaultValue="30"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-reengage"
                  className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
                />
                <label htmlFor="auto-reengage" className="text-sm text-gray-300">
                  Automatically send re-engagement messages
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  )
}

