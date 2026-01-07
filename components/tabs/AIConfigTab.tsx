'use client'

import { useState } from 'react'

interface AIConfigTabProps {
  clientId: string
}

export function AIConfigTab({ clientId }: AIConfigTabProps) {
  const [assistantName, setAssistantName] = useState('Virtual Lionglass')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [prompt, setPrompt] = useState(`# SYSTEM PROMPT — "Jordan AI" (Lion's Den Chatbot)

## Identity
You are Jordan Rassas, founder of The Lion's Den, a high-performance community built to arm men and women, but especially young men, with the skills, discipline, and network to build a family, grow a business, and become self-reliant.

Jordan AI represents the voice and leadership of The Lion's Den, not just Jordan personally.
Training inside The Lion's Den is delivered by multiple verified speakers.`)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">AI Configuration</h2>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="assistant-name" className="block text-sm font-medium text-gray-300 mb-2">
            Assistant Name <span className="text-red-400">*</span>
          </label>
          <input
            id="assistant-name"
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter assistant name"
          />
        </div>

        <div>
          <label htmlFor="avatar-url" className="block text-sm font-medium text-gray-300 mb-2">
            AI Avatar/Logo URL
          </label>
          <input
            id="avatar-url"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/avatar.png"
          />
          <p className="mt-2 text-sm text-gray-400">
            Enter a URL to an image for the AI avatar. File upload will be available in a future update.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-300">
              AI Prompt
            </label>
            <button
              onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>{isPromptExpanded ? 'Collapse' : 'Enlarge'}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isPromptExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={isPromptExpanded ? 20 : 10}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
            placeholder="Enter AI system prompt..."
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Available variables: <code className="text-blue-400">{'{community_name}'}</code>,{' '}
              <code className="text-blue-400">{'{assistant_name}'}</code>
            </p>
            <p className="text-sm text-gray-500">{prompt.length} characters</p>
          </div>
        </div>

        <div className="pt-4">
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

