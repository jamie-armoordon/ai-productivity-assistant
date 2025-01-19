import { useState, useRef } from 'react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph } from 'docx'
import { formatContent } from '../utils/formatContent'

type ContentType = 
  | 'email' 
  | 'report'
  | 'presentation'
  | 'meeting-notes'
  | 'project-proposal'
  | 'research-summary'
  | 'literature-review'
  | 'executive-summary'
  | 'case-study'
  | 'documentation'

type WritingStyle = 
  | 'professional' 
  | 'casual' 
  | 'academic' 
  | 'creative'
  | 'technical'
  | 'conversational'
  | 'persuasive'
  | 'formal'
  | 'journalistic'
  | 'storytelling'

interface AdditionalContext {
  [key: string]: string
}

interface ContentTypeInfo {
  value: ContentType
  label: string
  description: string
  icon: JSX.Element
}

interface WritingStyleInfo {
  value: WritingStyle
  label: string
  description: string
  icon: JSX.Element
}

const contentTypes: ContentTypeInfo[] = [
  {
    value: 'email',
    label: 'Professional Email',
    description: 'Compose clear business communications, follow-ups, or team updates',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  },
  {
    value: 'report',
    label: 'Business Report',
    description: 'Structured reports with analysis, findings, and recommendations',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  },
  {
    value: 'presentation',
    label: 'Presentation Slides',
    description: 'Clear, engaging slides with key points and speaker notes',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  },
  {
    value: 'meeting-notes',
    label: 'Meeting Notes',
    description: 'Structured summaries of discussions, action items, and decisions',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  },
  {
    value: 'project-proposal',
    label: 'Project Proposal',
    description: 'Detailed project outlines with objectives, timelines, and resources',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  },
  {
    value: 'research-summary',
    label: 'Research Summary',
    description: 'Academic research condensed into key findings and insights',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  },
  {
    value: 'literature-review',
    label: 'Literature Review',
    description: 'Academic analysis of existing research and publications',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  },
  {
    value: 'executive-summary',
    label: 'Executive Summary',
    description: 'Concise overview of key business findings and recommendations',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  },
  {
    value: 'case-study',
    label: 'Case Study',
    description: 'Detailed analysis of specific scenarios or examples',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  },
  {
    value: 'documentation',
    label: 'Documentation',
    description: 'Clear instructions, processes, or technical documentation',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  }
]

const writingStyles: WritingStyleInfo[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Clear, business-appropriate language for workplace communication',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  },
  {
    value: 'academic',
    label: 'Academic',
    description: 'Scholarly language suitable for academic papers and research',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Precise, detailed language for technical documentation',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Highly professional tone for official communications',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  },
  {
    value: 'analytical',
    label: 'Analytical',
    description: 'Data-driven approach with logical analysis',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  }
]

export default function TextGenerator() {
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState<ContentType>('email')
  const [style, setStyle] = useState<WritingStyle>('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [additionalContext, setAdditionalContext] = useState<AdditionalContext>({})
  const [copied, setCopied] = useState(false)
  const [savedContent, setSavedContent] = useState<Array<{
    id: number,
    content: string,
    timestamp: Date,
    contentType: ContentType,
    style: WritingStyle
  }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeneratedContent('')

    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          content_type: contentType,
          style,
          additional_context: additionalContext
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate content')
      }

      setGeneratedContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

    try {
      const text = await file.text()
      setPrompt(text)
    } catch (err) {
      setError('Failed to read file')
    }
  }

  const saveGeneration = () => {
    if (generatedContent) {
      setSavedContent(prev => [...prev, {
        id: Date.now(),
        content: generatedContent,
        timestamp: new Date(),
        contentType,
        style
      }])
    }
  }

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: generatedContent })
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `generated-${contentType}.docx`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Text Generator</h2>
        <div className="flex items-center space-x-2 text-gray-500">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm">Powered by Jamify AI</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              What would you like to create?
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.doc,.docx"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 focus:outline-none"
            >
              <div className="flex items-center space-x-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm">Upload File</span>
              </div>
            </button>
          </div>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 shadow-sm"
              placeholder="Describe what you would like to create..."
              required
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {prompt.length} characters
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Content Type
              </label>
              <span className="text-xs text-gray-500">Select one</span>
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
              {contentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200
                    ${contentType === type.value 
                      ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="content-type"
                    value={type.value}
                    checked={contentType === type.value}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <div className={`flex-shrink-0 ${contentType === type.value ? 'text-blue-500' : 'text-gray-400'}`}>
                      {type.icon}
                    </div>
                    <div className="ml-3 flex-grow text-center">
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Writing Style
              </label>
              <span className="text-xs text-gray-500">Select one</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {writingStyles.map((styleInfo) => (
                <label
                  key={styleInfo.value}
                  className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200
                    ${style === styleInfo.value 
                      ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="writing-style"
                    value={styleInfo.value}
                    checked={style === styleInfo.value}
                    onChange={(e) => setStyle(e.target.value as WritingStyle)}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <div className={`flex-shrink-0 ${style === styleInfo.value ? 'text-blue-500' : 'text-gray-400'}`}>
                      {styleInfo.icon}
                    </div>
                    <div className="ml-3 flex-grow text-center">
                      <div className="text-sm font-medium text-gray-900">{styleInfo.label}</div>
                      <div className="text-xs text-gray-500">{styleInfo.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Content...
            </span>
          ) : 'Generate Content'}
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

      {generatedContent && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Generated Content:</h3>
            <div className="flex space-x-2">
              <button
                onClick={saveGeneration}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                title="Save Generation"
              >
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Save</span>
                </div>
              </button>
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
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: formatContent(generatedContent) 
              }} 
              className="space-y-2 text-gray-600"
            />
          </div>
        </div>
      )}

      {savedContent.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Saved Generations</h3>
          <div className="space-y-4">
            {savedContent.map(item => (
              <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{item.contentType}</p>
                    <p className="text-sm text-gray-500">{item.timestamp.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => {
                      setContentType(item.contentType)
                      setStyle(item.style)
                      setGeneratedContent(item.content)
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Load
                  </button>
                </div>
                <p className="text-gray-600 line-clamp-2">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 