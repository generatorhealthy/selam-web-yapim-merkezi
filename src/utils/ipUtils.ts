
export const getClientIP = async (): Promise<string> => {
  try {
    // Try to get IP from ipify service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Could not fetch IP:', error);
    // Fallback IP
    return '127.0.0.1';
  }
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
