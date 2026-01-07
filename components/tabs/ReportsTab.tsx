'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Report } from '@/lib/types'

interface ReportsTabProps {
  clientId: string
}

export function ReportsTab({ clientId }: ReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadReports()
  }, [clientId])

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
      if (data && data.length > 0 && !selectedReport) {
        setSelectedReport(data[0])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSuggestedTitle = () => {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startMonth = start.toLocaleString('default', { month: 'short' })
    const endMonth = end.toLocaleString('default', { month: 'short' })
    return `${startMonth} ${start.getFullYear()} - ${endMonth} ${end.getFullYear()}`
  }

  const validateDateRange = () => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (end > today) return false
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }

  const handleGenerate = () => {
    if (!validateDateRange()) {
      alert('Invalid date range. Select a date range up to 30 days. End date cannot be in the future.')
      return
    }
    // UI only - no actual generation
    alert('Report generation will be implemented in a future update.')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return <div className="text-gray-400">Loading reports...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          Reports
          <button className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs hover:bg-gray-600 flex items-center justify-center">
            ?
          </button>
        </h2>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Generate New Report</h3>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Report Title (optional)
          </label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder={getSuggestedTitle() || 'Dec 2025 - Jan 2026'}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {getSuggestedTitle() && (
            <p className="mt-1 text-sm text-gray-400">Suggested: {getSuggestedTitle()}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Select a date range up to 30 days. End date cannot be in the future.
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-white">Report History ({reports.length})</h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showHistory && (
          <div className="px-6 pb-4 space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left px-4 py-2 rounded hover:bg-[#0a0a0a] transition-colors ${
                  selectedReport?.id === report.id ? 'bg-[#0a0a0a]' : ''
                }`}
              >
                <div className="text-white">{report.title || 'Untitled Report'}</div>
                <div className="text-sm text-gray-400">
                  {formatDate(report.start_date)} - {formatDate(report.end_date)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Report Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Date Range</div>
              <div className="text-white">
                {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Conversations</div>
              <div className="text-white">{selectedReport.conversations || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedReport.status === 'completed'
                    ? 'bg-green-600/20 text-green-300'
                    : selectedReport.status === 'pending'
                    ? 'bg-yellow-600/20 text-yellow-300'
                    : 'bg-red-600/20 text-red-300'
                }`}
              >
                {selectedReport.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Download MD
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Download PDF
            </button>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between text-left"
            >
              <h4 className="text-md font-semibold text-white">Executive Summary</h4>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showSummary ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSummary && (
              <div className="mt-4 text-gray-400">
                Executive summary content will be displayed here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

