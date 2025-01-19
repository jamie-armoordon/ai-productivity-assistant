export default function Help() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Help & FAQ</h2>
        <div className="text-sm text-gray-500">
          Powered by Jamify AI
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-medium mb-2">Getting Started</h3>
          <div className="prose prose-blue max-w-none">
            <p>Welcome to the AI Productivity Suite! Here's how to get started:</p>
            <ul>
              <li>Use the Summariser to condense long texts</li>
              <li>Use the Generator to create new content</li>
              <li>Save your favorite generations</li>
              <li>Use templates for quick starts</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">How does the AI work?</h4>
              <p className="text-gray-600">Our AI uses advanced language models to understand and generate human-like text based on your inputs.</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">What types of content can I generate?</h4>
              <p className="text-gray-600">You can generate various types of content including emails, reports, articles, and more.</p>
            </div>
            {/* Add more FAQ items */}
          </div>
        </section>
      </div>
    </div>
  )
} 