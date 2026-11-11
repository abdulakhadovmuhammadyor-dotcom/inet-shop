import { Language } from '@/types';

export function formatPriceUZS(amount: number, lang: Language = 'ru'): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(amount);

  return lang === 'uz' ? `${formatted} so'm` : `${formatted} сўм`;
}

export function formatDate(isoDate: string, lang: Language = 'ru'): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoDate;
  }
}
