
export const getMonthName = (monthNumber: number): string => {
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  // Month number cycles from 1-12, so we use modulo to handle cases beyond 12
  const index = ((monthNumber - 1) % 12);
  return monthNames[index];
};
