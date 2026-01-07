'use client'

import { useState, useEffect } from 'react'
import { getSessionToken } from '@/lib/supabase/auth-helpers'
import type { Lesson, CourseTrainingStatus } from '@/lib/types'

interface EditLessonModalProps {
  lesson: Lesson
  courseId: string
  chapterId?: string
  companyId: string
  onClose: () => void
  onSave: () => void
}

export function EditLessonModal({
  lesson,
  courseId,
  chapterId,
  companyId,
  onClose,
  onSave,
}: EditLessonModalProps) {
  const [mode, setMode] = useState<'form' | 'json'>('form')
  const [speakers, setSpeakers] = useState('')
  const [date, setDate] = useState('')
  const [event, setEvent] = useState('')
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [pdfSummary, setPdfSummary] = useState<string | null>(null)

  useEffect(() => {
    loadLessonData()
  }, [lesson])

  const loadLessonData = async () => {
    if (lesson.trainingStatus?.metadata) {
      const meta = lesson.trainingStatus.metadata as Record<string, any>
      setMetadata(meta)
      setSpeakers(meta.speakers || '')
      setDate(meta.date || '')
      setEvent(meta.event || '')
    }

    if (lesson.trainingStatus?.lesson_summary_pdf) {
      setPdfSummary(lesson.trainingStatus.lesson_summary_pdf)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const updatedMetadata = mode === 'form' 
        ? {
            ...metadata,
            speakers: speakers.split(',').map(s => s.trim()).filter(Boolean),
            date,
            event,
          }
        : metadata

      const response = await fetch(`/api/knowledge/courses/lessons/${lesson.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          courseId,
          chapterId,
          metadata: updatedMetadata,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update lesson metadata')
      }

      onSave()
    } catch (error) {
      console.error('Error updating lesson metadata:', error)
      alert(error instanceof Error ? error.message : 'Failed to update lesson metadata')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePDF = async () => {
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch(`/api/knowledge/courses/lessons/${lesson.id}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate PDF summary')
      }

      const data = await response.json()
      setPdfSummary(data.lesson_summary_pdf)
      alert('PDF summary generated successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate PDF summary')
    }
  }

  const handleUntrain = async () => {
    if (!confirm('Are you sure you want to untrain and delete this lesson? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch(`/api/knowledge/courses/lessons/${lesson.id}/untrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          courseId,
          chapterId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to untrain lesson')
      }

      onSave()
    } catch (error) {
      console.error('Error untraining lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to untrain lesson')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Lesson Metadata</h2>
            <p className="text-gray-400 mt-1">{lesson.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Summary Section */}
        {pdfSummary ? (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-green-400 font-medium mb-2">PDF Summary Available</p>
                <p className="text-gray-300 text-sm">
                  The PDF summary has been generated. You can view it in a new tab or download it from the Knowledge page.
                </p>
              </div>
              <button
                onClick={() => window.open(pdfSummary, '_blank')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Summary
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleGeneratePDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Generate PDF Summary
            </button>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('form')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              mode === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f0f0f] text-gray-400 hover:text-white'
            }`}
          >
            Form Mode
          </button>
          <button
            onClick={() => setMode('json')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              mode === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f0f0f] text-gray-400 hover:text-white'
            }`}
          >
            JSON Mode
          </button>
        </div>

        {/* Form Mode */}
        {mode === 'form' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Speaker(s)
              </label>
              <input
                type="text"
                value={speakers}
                onChange={(e) => setSpeakers(e.target.value)}
                placeholder="Names of people speaking in the video (comma-separated)"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event
              </label>
              <input
                type="text"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Name of the event, webinar, or session"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-xs mt-1">e.g., Product Launch Webinar</p>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Metadata (JSON)
            </label>
            <textarea
              value={JSON.stringify(metadata, null, 2)}
              onChange={(e) => {
                try {
                  setMetadata(JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full h-64 px-4 py-2 bg-[#0f0f0f] border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleUntrain}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Untrain & Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

