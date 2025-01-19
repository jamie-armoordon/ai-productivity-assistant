import { useState, useEffect, useRef } from 'react'
import './App.css'
import TextGenerator from './components/TextGenerator'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph } from 'docx'
import History from './components/History'
import Templates from './components/Templates'
import Help from './components/Help'

type SummaryLength = 'short' | 'medium' | 'long'
type Feature = 'summariser' | 'generator' | 'history' | 'templates' | 'help'

interface QuestionHistory {
  id: number
  question_text: string
  answer_text: string
  created_at: string
}

interface SummaryResponse {
  original_text: string
  summary: string
  id: number
}

function App() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium')
  const [charCount, setCharCount] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [questionLoading, setQuestionLoading] = useState(false)
  const [questionError, setQuestionError] = useState('')
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentSummaryId, setCurrentSummaryId] = useState<number | null>(null)
  const [activeFeature, setActiveFeature] = useState<Feature>('generator')
  const [copied, setCopied] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)

  useEffect(() => {
    if (currentSummaryId) {
      fetchQuestionHistory(currentSummaryId)
    }
    setFadeIn(true)
  }, [currentSummaryId])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setInputText(text)
    setCharCount(text.length)
  }

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await fetch('http://localhost:8000/api/summarise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          max_length: 150,
          min_length: 50
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to summarize text')
      }

      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestionHistory = async (summaryId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/questions/${summaryId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch question history')
      }
      const data = await response.json()
      setQuestionHistory(data)
    } catch (error) {
      console.error('Error fetching question history:', error)
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuestionLoading(true)
    setQuestionError('')
    setAnswer('')
    
    // Save the current question before clearing input
    const questionText = question
    setCurrentQuestion(questionText)
    setQuestion('') // Clear input field

    try {
      const response = await fetch('http://localhost:8000/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: inputText,
          question: questionText,
          summary: summary,
          summary_id: currentSummaryId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get answer')
      }

      setAnswer(data.answer)
      setTimeout(() => {
        if (currentSummaryId) {
          fetchQuestionHistory(currentSummaryId)
        }
      }, 500)
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setQuestionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingFile(true)
    try {
      const text = await file.text()
      setInputText(text)
      setCharCount(text.length)
    } catch (err) {
      setError('Failed to read file')
    } finally {
      setIsProcessingFile(false)
    }
  }

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: summary }),
          ...(questionHistory.map(item => new Paragraph({ text: `Q: ${item.question_text}\nA: ${item.answer_text}` })))
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'summary-and-qa.docx')
  }

  const exportToPDF = async () => {
    // Implementation will require a PDF library
    // We can use libraries like jsPDF or html2pdf
  }

  const exportToTXT = () => {
    const content = `Summary:\n${summary}\n\nQuestions & Answers:\n${
      questionHistory.map(item => `Q: ${item.question_text}\nA: ${item.answer_text}\n`).join('\n')
    }`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, 'summary-and-qa.txt')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="ml-3">
                  <h1 className="text-xl font-semibold text-gray-800">AI Productivity Suite</h1>
                  <p className="text-xs text-blue-600 font-medium">by Jamify AI</p>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="hidden sm:flex sm:space-x-4 items-center">
              <button
                onClick={() => setActiveFeature('summariser')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${activeFeature === 'summariser' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Summariser
              </button>
              <button
                onClick={() => setActiveFeature('generator')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${activeFeature === 'generator' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Generator
              </button>
              <button
                onClick={() => setActiveFeature('history')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${activeFeature === 'history' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                History
              </button>
              <button
                onClick={() => setActiveFeature('templates')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${activeFeature === 'templates' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveFeature('help')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${activeFeature === 'help' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Help
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 backdrop-blur-sm border border-gray-100">
          <div className="p-6 sm:p-8 md:p-10">
            {activeFeature === 'summariser' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Text Summariser</h2>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.doc,.docx"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 focus:outline-none"
                      disabled={isProcessingFile}
                    >
                      <div className="flex items-center space-x-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm">Upload File</span>
                      </div>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSummarize} className="space-y-4">
                  <div className="relative">
                    <textarea
                      className="w-full h-40 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                      value={inputText}
                      onChange={handleTextChange}
                      placeholder="Enter text to summarise..."
                      required
                      maxLength={10000}
                    />
                    {inputText && (
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        title="Clear text"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Summary Length:</label>
                    <select
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value as SummaryLength)}
                      className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || charCount === 0}
                    className="w-full bg-blue-500 text-white rounded-lg px-6 py-3 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Summary...
                      </span>
                    ) : 'Summarise'}
                  </button>
                </form>

                {error && (
                  <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium">Error:</p>
                    </div>
                    <p className="mt-1">{error}</p>
                  </div>
                )}

                {summary && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Summary:</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={exportToWord}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                          title="Export to Word"
                        >
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>DOCX</span>
                          </div>
                        </button>
                        <button
                          onClick={exportToTXT}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                          title="Export to Text"
                        >
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>TXT</span>
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className={`mt-6 pt-6 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-semibold">Summary:</h3>
                        <button
                          onClick={() => copyToClipboard(summary)}
                          className="text-blue-500 hover:text-blue-600 focus:outline-none"
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <span className="flex items-center space-x-1 text-green-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm">Copied!</span>
                            </span>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                        <p className="text-gray-700 leading-relaxed">{summary}</p>
                      </div>

                      {/* Q&A Section */}
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Ask a Question</h3>
                        <form onSubmit={handleQuestionSubmit} className="space-y-4">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ask a question about the text..."
                            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                          />

                          <button
                            type="submit"
                            disabled={questionLoading || !question.trim()}
                            className="w-full bg-green-500 text-white rounded-lg px-6 py-3 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {questionLoading ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Getting Answer...
                              </span>
                            ) : 'Ask Question'}
                          </button>
                        </form>

                        {answer && (
                          <div className={`mt-4 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Current Answer:</h4>
                              <button
                                onClick={() => copyToClipboard(answer)}
                                className="text-blue-500 hover:text-blue-600 focus:outline-none"
                                title="Copy to clipboard"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                            <div className="border rounded-lg p-4 bg-blue-50">
                              <p className="font-medium text-gray-700">Q: {currentQuestion}</p>
                              <p className="mt-2 text-gray-600">A: {answer}</p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className="mt-4 text-blue-500 hover:text-blue-600 focus:outline-none flex items-center space-x-1"
                        >
                          <svg className={`w-4 h-4 transform transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{showHistory ? 'Hide Previous Questions' : 'Show Previous Questions'}</span>
                        </button>

                        {showHistory && questionHistory.length > 0 && (
                          <div className="mt-4 space-y-4">
                            <h4 className="font-medium">Previous Questions:</h4>
                            {questionHistory.map((item) => (
                              <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                <p className="font-medium text-gray-700">Q: {item.question_text}</p>
                                <p className="mt-2 text-gray-600">A: {item.answer_text}</p>
                                <p className="mt-2 text-sm text-gray-500">
                                  Asked on: {formatDate(item.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeFeature === 'generator' ? (
              <TextGenerator />
            ) : activeFeature === 'history' ? (
              <History />
            ) : activeFeature === 'templates' ? (
              <Templates />
            ) : (
              <Help />
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-blue-600 font-semibold">Jamify AI</span>
            </div>
            <p className="text-center text-gray-500 text-sm">
              Enhancing your workflow with advanced AI technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
