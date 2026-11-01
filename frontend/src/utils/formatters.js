// Formatters for Currency, Timestamps, Hashes, and Numbers

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'INR 0.00';
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  return 'INR ' + numeric.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTimestamp(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return isoString;
  }
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    });
  } catch (e) {
    return isoString;
  }
}

export function truncateHash(hash, head = 8, tail = 8) {
  if (!hash) return '--';
  if (hash.length <= head + tail) return hash;
  return `${hash.substring(0, head)}...${hash.substring(hash.length - tail)}`;
}

export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function computeSha256(text) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback pseudo-hash if SubtleCrypto unavailable
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

