export function formatPrice(amount: number, currency: string = 'CNY'): string {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    KRW: '₩',
    THB: '฿',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatAddress(
  province?: string,
  city?: string,
  district?: string,
  street?: string
): string {
  const parts = [province, city, district, street].filter(Boolean);
  return parts.join('');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}小时`;
  }
  
  return `${hours}小时${mins}分钟`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)}${units[unitIndex]}`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function parseCoordinates(coordStr: string): { lat: number; lng: number } | null {
  const match = coordStr.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (!match) return null;

  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[2]),
  };
}

export function formatWeatherIcon(code: string): string {
  const iconMap: Record<string, string> = {
    '100': '☀️',
    '101': '🌤️',
    '102': '⛅',
    '103': '🌥️',
    '104': '☁️',
    '300': '🌦️',
    '301': '🌧️',
    '302': '⛈️',
    '303': '⛈️',
    '400': '🌨️',
    '500': '🌫️',
  };

  return iconMap[code] || '🌡️';
}

export function formatTravelStyle(style: string): string {
  const styleMap: Record<string, string> = {
    relaxed: '休闲',
    moderate: '适中',
    intensive: '紧凑',
  };

  return styleMap[style] || style;
}
