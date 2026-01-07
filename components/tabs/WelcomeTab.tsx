'use client'

import { useState } from 'react'

interface WelcomeTabProps {
  clientId: string
}

export function WelcomeTab({ clientId }: WelcomeTabProps) {
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [showWelcome, setShowWelcome] = useState(true)
  const [disclaimer, setDisclaimer] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [questionsIntro, setQuestionsIntro] = useState('')
  const [showQuestionsIntro, setShowQuestionsIntro] = useState(true)
  const [primaryColor, setPrimaryColor] = useState('#386bad')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          Welcome
          <button className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs hover:bg-gray-600 flex items-center justify-center">
            ?
          </button>
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Welcome Message</h3>
              <p className="text-sm text-gray-400">
                The first message users see when starting onboarding
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-welcome"
                checked={showWelcome}
                onChange={(e) => setShowWelcome(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-welcome" className="text-sm text-gray-300">
                Show to users
              </label>
            </div>
          </div>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter welcome message..."
          />
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Disclaimer</h3>
              <p className="text-sm text-gray-400">
                Important notice shown before users start answering questions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-disclaimer"
                checked={showDisclaimer}
                onChange={(e) => setShowDisclaimer(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-disclaimer" className="text-sm text-gray-300">
                Show to users
              </label>
            </div>
          </div>
          <textarea
            value={disclaimer}
            onChange={(e) => setDisclaimer(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter disclaimer text..."
          />
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Questions Introduction</h3>
              <p className="text-sm text-gray-400">
                Message shown before users start answering onboarding questions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-questions-intro"
                checked={showQuestionsIntro}
                onChange={(e) => setShowQuestionsIntro(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-questions-intro" className="text-sm text-gray-300">
                Show to users
              </label>
            </div>
          </div>
          <textarea
            value={questionsIntro}
            onChange={(e) => setQuestionsIntro(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter questions introduction..."
          />
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Primary Color</h3>
            <p className="text-sm text-gray-400">
              Customize the primary color used throughout the app
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-16 rounded border border-gray-700 cursor-pointer"
            />
            <div>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#386bad"
              />
            </div>
          </div>
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

