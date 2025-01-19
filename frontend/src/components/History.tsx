import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { formatContent } from '../utils/formatContent'

interface HistoryItem {
  id: number
  content: string
  content_type: string
  writing_style: string
  prompt: string
  created_at: string
}

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/history')
      if (!response.ok) throw new Error('Failed to fetch history')
      
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const regenerateContent = async (item: HistoryItem) => {
    setRegeneratingId(item.id)
    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: item.prompt,
          content_type: item.content_type,
          style: item.writing_style,
        }),
      })

      if (!response.ok) throw new Error('Failed to regenerate content')
      
      await fetchHistory() // Refresh history after regenerating
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate content')
    } finally {
      setRegeneratingId(null)
    }
  }

  const deleteGeneration = async (id: number) => {
    setDeletingId(id)
    try {
      const response = await fetch(`http://localhost:8000/api/history/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete generation')
      
      await fetchHistory() // Refresh history after deleting
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete generation')
    } finally {
      setDeletingId(null)
    }
  }

  const deleteAllHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all history? This action cannot be undone.')) {
      return
    }

    setIsDeletingAll(true)
    try {
      const response = await fetch('http://localhost:8000/api/history', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete history')
      
      await fetchHistory() // Refresh history after deleting
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete history')
    } finally {
      setIsDeletingAll(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'report':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Generation History</h2>
        <div className="flex items-center space-x-4">
          {history.length > 0 && (
            <button
              onClick={deleteAllHistory}
              disabled={isDeletingAll}
              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isDeletingAll ? (
                <span className="flex items-center space-x-1">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Deleting...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete All</span>
                </span>
              )}
            </button>
          )}
          <div className="text-sm text-gray-500">
            Powered by Jamify AI
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="border rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start space-x-3">
                    <div className="text-gray-500 mt-1">
                      {getContentTypeIcon(item.content_type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)} - {item.writing_style}
                      </h3>
                      <p className="text-sm text-gray-500">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => regenerateContent(item)}
                      disabled={regeneratingId === item.id || deletingId === item.id}
                      className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {regeneratingId === item.id ? (
                        <span className="flex items-center space-x-1">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Regenerating...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Regenerate</span>
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => deleteGeneration(item.id)}
                      disabled={deletingId === item.id || regeneratingId === item.id}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {deletingId === item.id ? (
                        <span className="flex items-center space-x-1">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Deleting...</span>
                        </span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 font-medium mb-1">Prompt:</p>
                  <p className="text-sm text-gray-600">{item.prompt}</p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">Generated Content:</p>
                  <div 
                    className={`prose prose-sm max-w-none text-gray-600 ${
                      expandedItems.includes(item.id) ? '' : 'max-h-32 overflow-hidden relative'
                    }`}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(item.content) 
                      }} 
                      className="space-y-2"
                    />
                    
                    {!expandedItems.includes(item.id) && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                    )}
                  </div>
                  
                  {item.content.length > 150 && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center space-x-1"
                    >
                      <span>{expandedItems.includes(item.id) ? 'Show less' : 'Show more'}</span>
                      <svg 
                        className={`w-4 h-4 transform transition-transform ${
                          expandedItems.includes(item.id) ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No generation history yet</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
} 