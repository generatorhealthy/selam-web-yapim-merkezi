import { useCallback } from 'react';
import { sanitizeInput, sanitizeEmail, sanitizeName, sanitizePhone } from '@/utils/sanitize';

export const useSecurity = () => {
  // CSRF token generator (simplified for demo)
  const generateCSRFToken = useCallback((): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }, []);

  // Validate and sanitize form data
  const validateAndSanitizeForm = useCallback((data: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        switch (key) {
          case 'email':
            try {
              sanitized[key] = sanitizeEmail(value);
            } catch (error) {
              throw new Error(`Invalid email format`);
            }
            break;
          case 'name':
          case 'customer_name':
          case 'patient_name':
          case 'first_name':
          case 'last_name':
            sanitized[key] = sanitizeName(value);
            if (sanitized[key].length < 2) {
              throw new Error(`${key} must be at least 2 characters long`);
            }
            break;
          case 'phone':
          case 'customer_phone':
          case 'patient_phone':
            sanitized[key] = sanitizePhone(value);
            break;
          case 'password':
            // Don't sanitize passwords, just validate
            if (value.length < 8) {
              throw new Error('Password must be at least 8 characters long');
            }
            sanitized[key] = value;
            break;
          default:
            sanitized[key] = sanitizeInput(value);
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }, []);

  // Check for suspicious patterns
  const detectSuspiciousActivity = useCallback((data: Record<string, any>): boolean => {
    const suspiciousPatterns = [
      /script/gi,
      /javascript:/gi,
      /onclick/gi,
      /onerror/gi,
      /onload/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ];

    const dataString = JSON.stringify(data).toLowerCase();
    
    return suspiciousPatterns.some(pattern => pattern.test(dataString));
  }, []);

  return {
    generateCSRFToken,
    validateAndSanitizeForm,
    detectSuspiciousActivity,
  };
};