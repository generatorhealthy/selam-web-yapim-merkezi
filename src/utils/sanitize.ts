
import DOMPurify from 'dompurify';

// Enhanced input sanitization for security
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized.substring(0, 100); // Reasonable email length limit
};

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    // Stricter HTML sanitization for security
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'], // Removed potentially dangerous attributes
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  });
};

export const stripHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

// Rich but safe sanitizer for blog/contract/test content.
// Keeps formatting (links, images, tables, lists) while removing
// scripts, event handlers and other dangerous markup.
export const sanitizeRichHtml = (html: string): string => {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
      'span', 'div', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'width', 'height'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
    ALLOW_DATA_ATTR: false,
  });
};

// Sanitize phone numbers
export const sanitizePhone = (phone: string): string => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+\s()-]/g, '').substring(0, 20);
};

// Sanitize names (only letters, spaces, some special characters)
export const sanitizeName = (name: string): string => {
  if (typeof name !== 'string') return '';
  
  return name
    .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s\-'\.]/g, '') // Allow Turkish characters
    .trim()
    .substring(0, 100);
};
