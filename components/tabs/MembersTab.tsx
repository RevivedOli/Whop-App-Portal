'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Member } from '@/lib/types'

interface MembersTabProps {
  clientId: string
}

export function MembersTab({ clientId }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNonOnboarded, setShowNonOnboarded] = useState(false)
  const [aiAccessFilter, setAiAccessFilter] = useState('has_used')
  const [perPage, setPerPage] = useState(25)

  useEffect(() => {
    loadMembers()
  }, [clientId, showNonOnboarded, aiAccessFilter])

  const loadMembers = async () => {
    try {
      let query = supabase
        .from('members')
        .select('*')
        .eq('client_id', clientId)

      if (!showNonOnboarded) {
        query = query.eq('is_onboarded', true)
      }

      if (aiAccessFilter === 'has_used') {
        query = query.eq('has_ai_access', true)
      } else if (aiAccessFilter === 'no_access') {
        query = query.eq('has_ai_access', false)
      }

      query = query.limit(perPage).order('last_updated', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div className="text-gray-400">Loading members...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          Members
          <button className="w-5 h-5 rounded-full bg-gray-700 text-gray-400 text-xs hover:bg-gray-600 flex items-center justify-center">
            ?
          </button>
        </h2>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            Notify All Members
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showNonOnboarded}
              onChange={(e) => setShowNonOnboarded(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-[#0a0a0a] border-gray-700 rounded focus:ring-blue-500"
            />
            Show non-onboarded
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">AI Access:</label>
            <select
              value={aiAccessFilter}
              onChange={(e) => setAiAccessFilter(e.target.value)}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="has_used">Has Used AI (Default)</option>
              <option value="no_access">No AI Access</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Per page:</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">USER</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">PROFILE</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">STATUS</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">LAST UPDATED</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{member.name || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">@{member.username}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {member.profile_tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-2">
                      {member.is_onboarded && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Onboarded
                        </span>
                      )}
                      {member.has_ai_access && (
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                          AI Access
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">
                    {member.last_updated ? formatDate(member.last_updated) : 'N/A'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        Re-engage
                      </button>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

