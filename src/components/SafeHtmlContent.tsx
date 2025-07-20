
import { sanitizeHtml } from '@/utils/sanitize';

interface SafeHtmlContentProps {
  content: string;
  className?: string;
}

export const SafeHtmlContent = ({ content, className }: SafeHtmlContentProps) => {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
