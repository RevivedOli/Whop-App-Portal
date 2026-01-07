'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getSessionToken } from '@/lib/supabase/auth-helpers'
import { EditLessonModal } from '@/components/knowledge/EditLessonModal'
import type { CourseWithTrainingStatus, CourseTrainingStatus, TrainingStatus, Lesson } from '@/lib/types'

interface KnowledgeTabProps {
  clientId: string
}

const STATUS_COLORS: Record<TrainingStatus | 'default', string> = {
  pending: 'bg-gray-500',
  transcribing: 'bg-blue-500',
  transcribe_failed: 'bg-red-500',
  transcribed: 'bg-yellow-500',
  training: 'bg-purple-500',
  train_failed: 'bg-red-500',
  trained: 'bg-green-500',
  default: 'bg-gray-500',
}

const STATUS_LABELS: Record<TrainingStatus | 'default', string> = {
  pending: 'Pending',
  transcribing: 'Transcribing',
  transcribe_failed: 'Transcribe Failed',
  transcribed: 'Transcribed',
  training: 'Training',
  train_failed: 'Train Failed',
  trained: 'Trained',
  default: 'Unknown',
}

export function KnowledgeTab({ clientId }: KnowledgeTabProps) {
  const [courses, setCourses] = useState<CourseWithTrainingStatus[]>([])
  const [orphanedLessons, setOrphanedLessons] = useState<CourseTrainingStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [whopCompanyId, setWhopCompanyId] = useState<string | null>(null)
  const [companySlug, setCompanySlug] = useState<string | null>(null)
  const [experienceId, setExperienceId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; courseId: string; chapterId?: string } | null>(null)
  const [trainingLessons, setTrainingLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('whop_company_id')
        .eq('id', clientId)
        .single()

      if (client?.whop_company_id) {
        setWhopCompanyId(client.whop_company_id)
        loadCourses(client.whop_company_id)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      setLoading(false)
    }
  }

  const loadCourses = async (companyId: string) => {
    setLoading(true)
    try {
      const token = await getSessionToken()
      if (!token) {
        throw new Error('No session token')
      }

      const response = await fetch(`/api/knowledge/courses?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

      const data = await response.json()
      setCourses(data.courses || [])
      setOrphanedLessons(data.orphanedLessons || [])
      setCompanySlug(data.companySlug)
      setExperienceId(data.experienceId)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  const getStatusColor = (status?: TrainingStatus): string => {
    return STATUS_COLORS[status || 'default']
  }

  const getStatusLabel = (status?: TrainingStatus): string => {
    return STATUS_LABELS[status || 'default']
  }

  const handleTrainLesson = async (lesson: Lesson, courseId: string, chapterId?: string) => {
    if (!whopCompanyId) return

    setTrainingLessons(prev => new Set(prev).add(lesson.id))
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch('/api/knowledge/courses/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: whopCompanyId,
          lessonId: lesson.id,
          courseId,
          chapterId,
          title: lesson.title,
          status: 'pending',
          video_asset: lesson.video_asset,
          embed_id: lesson.embed_id,
          embed_type: lesson.embed_type,
          video_source_type: lesson.video_asset ? 'mux' : (lesson.embed_type || null),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start training')
      }

      // Reload courses to show updated status
      await loadCourses(whopCompanyId)
    } catch (error) {
      console.error('Error training lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to train lesson')
    } finally {
      setTrainingLessons(prev => {
        const newSet = new Set(prev)
        newSet.delete(lesson.id)
        return newSet
      })
    }
  }

  const handleEditMetadata = (lesson: Lesson, courseId: string, chapterId?: string) => {
    setEditingLesson({ lesson, courseId, chapterId })
  }

  const handleUntrainLesson = async (lessonId: string, courseId: string, chapterId?: string) => {
    if (!whopCompanyId) return
    if (!confirm('Are you sure you want to untrain this lesson? This will delete all training data.')) {
      return
    }

    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch(`/api/knowledge/courses/lessons/${lessonId}/untrain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: whopCompanyId,
          courseId,
          chapterId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to untrain lesson')
      }

      await loadCourses(whopCompanyId)
    } catch (error) {
      console.error('Error untraining lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to untrain lesson')
    }
  }

  const handleGeneratePDF = async (lessonId: string) => {
    if (!whopCompanyId) return

    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch(`/api/knowledge/courses/lessons/${lessonId}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: whopCompanyId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate PDF summary')
      }

      alert('PDF summary generated successfully!')
      await loadCourses(whopCompanyId)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate PDF summary')
    }
  }

  const handleKeepOrphaned = async (lessonId: string) => {
    if (!whopCompanyId) return

    try {
      const token = await getSessionToken()
      if (!token) throw new Error('No session token')

      const response = await fetch(`/api/knowledge/courses/lessons/${lessonId}/keep-orphaned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: whopCompanyId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to keep orphaned lesson')
      }

      await loadCourses(whopCompanyId)
    } catch (error) {
      console.error('Error keeping orphaned lesson:', error)
      alert(error instanceof Error ? error.message : 'Failed to keep orphaned lesson')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading courses...</div>
      </div>
    )
  }

  if (!whopCompanyId) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No Whop Company ID found for this client.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          onClick={() => whopCompanyId && loadCourses(whopCompanyId)}
          className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white hover:bg-[#1f1f1f] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Legend */}
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-2">Status:</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-300">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">Transcribing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-300">Transcribed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-300">Training</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Trained</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Failed</span>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No courses found.</p>
          </div>
        ) : (
          courses.map((course) => {
            const isExpanded = expandedCourses.has(course.id)
            const isStartHere = course.chapters.some(ch => ch.lessons.some(l => l.order === 0))

            return (
              <div
                key={course.id}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    {isStartHere && (
                      <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-xs font-medium">START HERE</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400">
                          {course.trainingStats.trained}/{course.trainingStats.total} trained
                        </span>
                        <span className="text-gray-400">{course.chapters.length} chapter{course.chapters.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Chapters */}
                {isExpanded && (
                  <div className="space-y-4 mt-4">
                    {course.chapters.map((chapter) => {
                      const isChapterExpanded = expandedChapters.has(chapter.id)
                      return (
                        <div key={chapter.id} className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4">
                          {/* Chapter Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-white mb-1">{chapter.title}</h4>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-green-400">
                                  {chapter.trainingStats.trained}/{chapter.trainingStats.total} trained
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleChapter(chapter.id)}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${isChapterExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Lessons */}
                          {isChapterExpanded && (
                            <div className="space-y-3 mt-3">
                              {chapter.lessons.map((lesson) => {
                                const status = lesson.trainingStatus?.status
                                const isTrained = status === 'trained'
                                const isPending = !status || status === 'pending'
                                const lessonType = lesson.lesson_type || 'multi'

                                return (
                                  <div
                                    key={lesson.id}
                                    className="bg-[#0a0a0a] border border-gray-900 rounded-lg p-4 flex items-center gap-4"
                                  >
                                    {/* Thumbnail or START HERE */}
                                    <div className="w-16 h-16 bg-black rounded flex items-center justify-center flex-shrink-0">
                                      {lesson.thumbnail?.url ? (
                                        <img
                                          src={lesson.thumbnail.url}
                                          alt={lesson.title}
                                          className="w-full h-full object-cover rounded"
                                        />
                                      ) : (
                                        <span className="text-white text-xs font-medium">START HERE</span>
                                      )}
                                    </div>

                                    {/* Lesson Info */}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-white font-medium mb-1 truncate">{lesson.title}</h5>
                                      <p className="text-gray-400 text-sm">{lessonType}</p>
                                    </div>

                                    {/* Status Indicator */}
                                    {status && (
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      {isTrained && (
                                        <>
                                          <button
                                            onClick={() => {
                                              if (lesson.trainingStatus?.lesson_url) {
                                                window.open(lesson.trainingStatus.lesson_url, '_blank')
                                              }
                                            }}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="View Lesson"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleEditMetadata(lesson, course.id, chapter.id)}
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                            title="Edit Metadata"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleUntrainLesson(lesson.id, course.id, chapter.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Untrain & Delete"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                      {isPending && lessonType === 'multi' && (
                                        <button
                                          onClick={() => handleTrainLesson(lesson, course.id, chapter.id)}
                                          disabled={trainingLessons.has(lesson.id)}
                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                                        >
                                          {trainingLessons.has(lesson.id) ? 'Training...' : 'Train'}
                                        </button>
                                      )}
                                      {lessonType === 'pdf' && (
                                        <span className="text-gray-500 text-sm">Coming soon</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Orphaned Lessons */}
      {orphanedLessons.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Orphaned Lessons</h3>
          <div className="space-y-3">
            {orphanedLessons.map((lesson) => (
              <div
                key={lesson.lesson_id}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-white font-medium">{lesson.title}</h4>
                  <p className="text-gray-400 text-sm">Trained but no longer in Whop courses</p>
                </div>
                <button
                  onClick={() => handleKeepOrphaned(lesson.lesson_id)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Keep
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <EditLessonModal
          lesson={editingLesson.lesson}
          courseId={editingLesson.courseId}
          chapterId={editingLesson.chapterId}
          companyId={whopCompanyId || ''}
          onClose={() => setEditingLesson(null)}
          onSave={async () => {
            setEditingLesson(null)
            if (whopCompanyId) {
              await loadCourses(whopCompanyId)
            }
          }}
        />
      )}
    </div>
  )
}
