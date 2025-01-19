// types.ts
export interface ParsedEmail {
  title: string;
  subject: string;
  greeting: string;
  opening: string;
  content: string;
  signature: string;
  name: string;
  position: string;
}

// formatContent.ts
import { ParsedEmail } from './types';

export const parseEmailContent = (content: string): ParsedEmail | null => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    return {
      title: doc.querySelector('title')?.textContent?.trim() || '',
      subject: doc.querySelector('subject')?.textContent?.trim() || '',
      greeting: doc.querySelector('greeting')?.textContent?.trim() || '',
      opening: doc.querySelector('opening')?.textContent?.trim() || '',
      content: doc.querySelector('content')?.textContent?.trim() || '',
      signature: doc.querySelector('signature')?.textContent?.trim() || '',
      name: doc.querySelector('name')?.textContent?.trim() || '',
      position: doc.querySelector('position')?.textContent?.trim() || '',
    };
  } catch (error) {
    console.error('Error parsing email HTML:', error);
    return null;
  }
};

export const formatEmailTemplate = (email: ParsedEmail): string => {
  return `
    <div class="email-container max-w-2xl mx-auto">
      ${email.title ? `<div class="text-center mb-6 text-gray-600">${email.title}</div>` : ''}
      ${email.subject ? `<div class="text-center font-medium text-gray-900 mb-6">${email.subject}</div>` : ''}
      ${email.greeting ? `<div class="text-center mb-4">${email.greeting}</div>` : ''}
      ${email.opening ? `<div class="text-center mb-6">${email.opening}</div>` : ''}
      ${email.content ? `<div class="mb-6 text-gray-700 whitespace-pre-line">${email.content}</div>` : ''}
      <div class="mt-8">
        ${email.signature ? `<div class="mb-1">${email.signature}</div>` : ''}
        ${email.name ? `<div class="font-medium">${email.name}</div>` : ''}
        ${email.position ? `<div class="text-gray-600">${email.position}</div>` : ''}
      </div>
    </div>
  `;
};

export const formatContent = (content: string): string => {
  if (!content) return '';

  // Check if content is HTML email format
  if (content.includes('<email>')) {
    try {
      const parsedEmail = parseEmailContent(content);
      if (parsedEmail) {
        return formatEmailTemplate(parsedEmail);
      }
    } catch (error) {
      console.error('Error parsing email HTML:', error);
      return content; // Fallback to original content if parsing fails
    }
  }

  // Handle non-email content with existing formatting
  let formattedContent = content;

  // Handle bracketed asterisks [*text*] for inline emphasis
  formattedContent = formattedContent.replace(
    /\[\*(.*?)\*\]/g,
    '<span class="font-medium text-gray-900">$1</span>'
  );

  // Handle section headers with **text**
  formattedContent = formattedContent.replace(
    /\*\*(.*?)\*\*/g,
    '<span class="font-bold text-gray-900 block mt-4 mb-2 text-lg">$1</span>'
  );

  // Handle bullet points with * at start of line
  formattedContent = formattedContent.replace(
    /^\s*\*(.*)/gm,
    '<span class="block ml-4 my-2">• $1</span>'
  );

  // Handle email formatting
  if (formattedContent.includes('Subject:')) {
    // Center the "Generated Content" header
    formattedContent = formattedContent.replace(
      /(Generated Content)/,
      '<div class="text-center mb-4">$1</div>'
    );

    // Center and style the subject line
    formattedContent = formattedContent.replace(
      /(Subject:.*?)(\n|$)/,
      '<div class="text-center font-medium text-gray-900 mb-4">$1</div>'
    );

    // Center and style the greeting
    formattedContent = formattedContent.replace(
      /(Dear.*?)(\n|$)/,
      '<div class="text-center mb-4">$1</div>'
    );

    // Center and style the opening line
    formattedContent = formattedContent.replace(
      /(I hope this email finds you well\.)/,
      '<div class="text-center mb-4">$1</div>'
    );
  }

  // Handle code blocks with ```
  formattedContent = formattedContent.replace(
    /```(.*?)```/gs,
    '<pre class="bg-gray-50 p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>'
  );

  // Handle inline code with `code`
  formattedContent = formattedContent.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>'
  );

  // Handle links with [text](url)
  formattedContent = formattedContent.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Split into paragraphs and add proper spacing
  // Only apply to non-centered paragraphs
  formattedContent = formattedContent.split('\n\n').map(section => {
    if (!section.includes('class="text-center"')) {
      return `<div class="mb-4">${section}</div>`;
    }
    return section;
  }).join('');

  return formattedContent;
};