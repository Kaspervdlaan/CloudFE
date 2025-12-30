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

/**
 * Parses markdown code blocks from streaming content
 * Handles incomplete code blocks (when closing ``` hasn't been received yet)
 * Supports both ```language and ```language:filename formats
 */
export function parseCodeBlocksStreaming(content: string): ParsedMessage {
  const parts: ParsedMessage['parts'] = [];
  
  // Find all positions of ```
  const backtickPositions: number[] = [];
  let searchIndex = 0;
  while (true) {
    const pos = content.indexOf('```', searchIndex);
    if (pos === -1) break;
    backtickPositions.push(pos);
    searchIndex = pos + 3;
  }
  
  // If no backticks found, return as text
  if (backtickPositions.length === 0) {
    if (content.trim()) {
      parts.push({ type: 'text', content });
    }
    return { parts };
  }
  
  // Process complete pairs of backticks
  let lastIndex = 0;
  let i = 0;
  
  while (i < backtickPositions.length - 1) {
    const openPos = backtickPositions[i];
    const closePos = backtickPositions[i + 1];
    
    // Add text before this code block
    if (openPos > lastIndex) {
      const textContent = content.substring(lastIndex, openPos);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Parse the code block
    const blockContent = content.substring(openPos + 3, closePos);
    const firstLineEnd = blockContent.indexOf('\n');
    const header = firstLineEnd !== -1 ? blockContent.substring(0, firstLineEnd) : blockContent;
    
    // Parse language and filename from header
    const headerMatch = header.match(/^(\w+)?(?::([^\n]+))?/);
    const language = (headerMatch?.[1] || 'text').toLowerCase();
    const filename = headerMatch?.[2]?.trim();
    
    // Get code content (everything after the header)
    const code = firstLineEnd !== -1 
      ? blockContent.substring(firstLineEnd + 1)
      : '';
    
    parts.push({
      type: 'code',
      content: '',
      codeBlock: {
        code: code.trim(),
        language,
        filename,
      },
    });
    
    lastIndex = closePos + 3;
    i += 2; // Move to next pair
  }
  
  // Check if there's an incomplete code block at the end
  if (backtickPositions.length % 2 === 1) {
    // Odd number of backticks means there's an unclosed block
    const lastOpenPos = backtickPositions[backtickPositions.length - 1];
    
    // Add text before the incomplete block
    if (lastOpenPos > lastIndex) {
      const textContent = content.substring(lastIndex, lastOpenPos);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Parse the incomplete code block
    const blockContent = content.substring(lastOpenPos + 3);
    const firstLineEnd = blockContent.indexOf('\n');
    const header = firstLineEnd !== -1 ? blockContent.substring(0, firstLineEnd) : '';
    
    // Parse language and filename from header
    const headerMatch = header.match(/^(\w+)?(?::([^\n]+))?/);
    const language = (headerMatch?.[1] || 'text').toLowerCase();
    const filename = headerMatch?.[2]?.trim();
    
    // Get code content (everything after the header, if any)
    const code = firstLineEnd !== -1 
      ? blockContent.substring(firstLineEnd + 1)
      : blockContent;
    
    parts.push({
      type: 'code',
      content: '',
      codeBlock: {
        code: code,
        language,
        filename,
      },
    });
  } else {
    // Add remaining text after last complete block
    if (lastIndex < content.length) {
      const textContent = content.substring(lastIndex);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }
  }
  
  // If no parts were added, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }
  
  return { parts };
}

