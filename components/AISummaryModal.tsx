'use client'

import { useState } from 'react'
import { X, Sparkles, Clock, Loader } from 'lucide-react'

interface AISummaryModalProps {
  groupId: string
  groupName: string
  onClose: () => void
}

const TIME_PERIODS = [
  { label: '1 Hour', value: '1h', hours: 1 },
  { label: '8 Hours', value: '8h', hours: 8 },
  { label: '12 Hours', value: '12h', hours: 12 },
  { label: '24 Hours', value: '24h', hours: 24 },
  { label: '3 Days', value: '3d', hours: 72 },
  { label: '7 Days', value: '7d', hours: 168 },
]

function AISummaryContent({ summary, selectedPeriod }: { summary: string, selectedPeriod: string }) {
  const parseStructuredSummary = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Extract different sections
    const stats = { messages: 0, participants: 0, period: '' }
    const topics: string[] = []
    const highlights: string[] = []
    let sentiment = ''
    let activityLevel = ''
    
    let currentSection = ''
    
    lines.forEach(line => {
      const trimmed = line.trim()
      
      // Detect sections by emojis or keywords
      if (trimmed.includes('📊') || trimmed.toLowerCase().includes('statistics')) {
        currentSection = 'stats'
      } else if (trimmed.includes('🎯') || trimmed.toLowerCase().includes('topics')) {
        currentSection = 'topics'
      } else if (trimmed.includes('💡') || trimmed.toLowerCase().includes('highlights')) {
        currentSection = 'highlights'
      } else if (trimmed.includes('📈') || trimmed.toLowerCase().includes('sentiment')) {
        currentSection = 'sentiment'
      } else if (trimmed.includes('⚡') || trimmed.toLowerCase().includes('activity')) {
        currentSection = 'activity'
      }
      
      // Parse content based on current section
      if (currentSection === 'stats' && trimmed.startsWith('•')) {
        const content = trimmed.replace('•', '').trim()
        if (content.includes('messages')) {
          const match = content.match(/(\d+)/)
          if (match) stats.messages = parseInt(match[1])
        } else if (content.includes('participants')) {
          const match = content.match(/(\d+)/)
          if (match) stats.participants = parseInt(match[1])
        } else if (content.includes('period') || content.includes('Activity period')) {
          stats.period = content.split(':')[1]?.trim() || content
        }
      } else if (currentSection === 'topics' && (trimmed.startsWith('•') || trimmed.startsWith('-'))) {
        const content = trimmed.replace(/^[•-]\s*/, '').trim()
        if (content && !content.includes('List the') && !content.includes('[')) {
          topics.push(content)
        }
      } else if (currentSection === 'highlights' && (trimmed.startsWith('•') || trimmed.startsWith('-'))) {
        const content = trimmed.replace(/^[•-]\s*/, '').trim()
        if (content && !content.includes('Key decisions') && !content.includes('[')) {
          highlights.push(content)
        }
      } else if (currentSection === 'sentiment' && !trimmed.includes('📈') && !trimmed.includes('Overall Sentiment') && trimmed.length > 5) {
        if (!sentiment) sentiment = trimmed
      } else if (currentSection === 'activity' && !trimmed.includes('⚡') && !trimmed.includes('Activity Level') && trimmed.length > 5) {
        if (!activityLevel) activityLevel = trimmed
      }
    })
    
    return { stats, topics, highlights, sentiment, activityLevel }
  }
  
  const { stats, topics, highlights, sentiment, activityLevel } = parseStructuredSummary(summary)
  
  // Get the display label for the selected period
  const periodLabel = TIME_PERIODS.find(p => p.value === selectedPeriod)?.label || selectedPeriod
  
  return (
    <div className="space-y-4">
      {/* Statistics Box */}
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Statistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-white">{stats.messages || 0}</div>
            <div className="text-xs text-gray-400">Messages sent</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-white">{stats.participants || 0}</div>
            <div className="text-xs text-gray-400">Active participants</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-white">{periodLabel}</div>
            <div className="text-xs text-gray-400">Summary period</div>
          </div>
        </div>
      </div>

      {/* Topics Box */}
      {topics.length > 0 && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Topics
          </h3>
          <div className="space-y-2">
            {topics.slice(0, 3).map((topic, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <span className="text-gray-200">{topic}</span>
              </div>
            ))}
            {topics.length === 0 && (
              <div className="text-gray-400 text-sm italic">No specific topics identified</div>
            )}
          </div>
        </div>
      )}

      {/* Important Highlights Box */}
      {highlights.length > 0 && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            Important Highlights
          </h3>
          <div className="space-y-2">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-200">{highlight}</span>
              </div>
            ))}
            {highlights.length === 0 && (
              <div className="text-gray-400 text-sm italic">No specific highlights identified</div>
            )}
          </div>
        </div>
      )}

      {/* Overall Sentiment Box */}
      {sentiment && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            Overall Sentiment
          </h3>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-200">{sentiment}</p>
          </div>
          {activityLevel && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Activity Level</div>
              <p className="text-gray-200">{activityLevel}</p>
            </div>
          )}
        </div>
      )}

      {/* Fallback for unstructured content */}
      {!stats.messages && !topics.length && !highlights.length && !sentiment && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-700">
        ✨ AI Summary powered by GPT-4o-mini
      </div>
    </div>
  )
}

export function AISummaryModal({ groupId, groupName, onClose }: AISummaryModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('24h')
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleGenerateSummary = async () => {
    setIsLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          timePeriod: selectedPeriod,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error generating summary:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-modern">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Summary</h2>
              <p className="text-gray-600 text-sm">{groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!summary && !isLoading && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Time Period</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`p-3 rounded-xl border transition-colors flex items-center space-x-2 ${
                        selectedPeriod === period.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{period.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-primary hover:shadow-lg disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 mx-auto transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary</span>
                </button>
              </div>
            </>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-gray-900 font-medium">Analyzing messages...</span>
              </div>
              <p className="text-gray-600 text-sm">
                AI is summarizing the last {TIME_PERIODS.find(p => p.value === selectedPeriod)?.label.toLowerCase()} of conversation
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium mb-2">Error generating summary</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => {
                    setError('')
                    handleGenerateSummary()
                  }}
                  className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {summary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Summary - Last {TIME_PERIODS.find(p => p.value === selectedPeriod)?.label}
                </h3>
                <button
                  onClick={() => {
                    setSummary('')
                    setError('')
                  }}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-sm transition-colors font-medium"
                >
                  New Summary
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <AISummaryContent summary={summary} selectedPeriod={selectedPeriod} />
              </div>

              <div className="text-center text-xs text-gray-500">
                Summary generated by AI • May not capture all nuances
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
