'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { KnowledgeModule } from '@/lib/types'

interface KnowledgeTabProps {
  clientId: string
}

export function KnowledgeTab({ clientId }: KnowledgeTabProps) {
  const [modules, setModules] = useState<KnowledgeModule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadModules()
  }, [clientId])

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_modules')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setModules(data || [])
    } catch (error) {
      console.error('Error loading knowledge modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  if (loading) {
    return <div className="text-gray-400">Loading knowledge modules...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            Knowledge
            <button className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs hover:bg-gray-600 flex items-center justify-center">
              ?
            </button>
          </h2>
        </div>
        <button
          onClick={loadModules}
          className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#1f1f1f] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No knowledge modules found.</p>
          </div>
        ) : (
          modules.map((module) => (
            <div
              key={module.id}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {module.is_start_here && (
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                      START HERE
                    </button>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">
                        {module.trained_count}/{module.total_count} trained
                      </span>
                      <span className="text-gray-400">{module.chapter_count} chapter{module.chapter_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule(module.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedModules.has(module.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

