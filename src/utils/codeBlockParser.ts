export interface CodeBlock {
  code: string;
  language: string;
  filename?: string;
}

export interface ParsedMessage {
  parts: Array<{ type: 'text' | 'code'; content: string; codeBlock?: CodeBlock }>;
}

/**
 * Parses markdown code blocks from a message
 * Supports both ```language and ```language:filename formats
 */
export function parseCodeBlocks(content: string): ParsedMessage {
  const parts: ParsedMessage['parts'] = [];
  // Match code blocks with optional language and filename
  // Format: ```language:filename or ```language or ```
  const codeBlockRegex = /```(\w+)?(?::([^\n]+))?\n?([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Extract code block
    const language = match[1] || 'text';
    const filename = match[2]?.trim();
    const code = match[3] || '';

    parts.push({
      type: 'code',
      content: '',
      codeBlock: {
        code: code.trim(),
        language: language.toLowerCase(),
        filename,
      },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex);
    if (textContent.trim()) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return { parts };
}

