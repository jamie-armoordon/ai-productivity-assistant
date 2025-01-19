import { useState, useEffect } from 'react'
import { formatContent } from '../utils/formatContent'

interface Template {
  id: number
  title: string
  description: string
  type: string
  prompt: string
  content: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const useTemplate = async (template: Template) => {
    try {
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: template.prompt,
          content_type: template.type,
          style: template.type,
        }),
      })

      if (!response.ok) throw new Error('Failed to use template')
      
      // Handle successful generation (e.g., show notification, redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use template')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Templates</h2>
        <div className="text-sm text-gray-500">
          Powered by Jamify AI
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
            <h3 className="font-medium mb-1">{template.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{template.description}</p>
            <button className="text-blue-600 hover:text-blue-700 text-sm">
              Use Template
            </button>
            <div className="mt-2">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(template.content) 
                }} 
                className="space-y-2 text-gray-600 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 