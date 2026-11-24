import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPHP(amount: number | string): string {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(numeric);
}

// Fallback high-resolution architectural photography for property types
export const PROPERTY_IMAGES: Record<string, string[]> = {
  CONDOMINIUM: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  ],
  HOUSE: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  ],
  TOWNHOUSE: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  ],
  APARTMENT: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502005229762-ee152d87e07a?auto=format&fit=crop&w=1200&q=80',
  ],
  COMMERCIAL: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  ],
  LAND: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  ],
};

/**
 * Flexible property photo retriever supporting either (id, type) or (type, id)
 */
export function getPropertyImage(first: string | number, second?: string | number): string {
  let type = 'HOUSE';
  let id = 1;

  if (typeof first === 'number') {
    id = first;
    if (typeof second === 'string') type = second;
  } else if (typeof first === 'string') {
    if (PROPERTY_IMAGES[first]) {
      type = first;
      if (typeof second === 'number') id = second;
    } else if (typeof second === 'string' && PROPERTY_IMAGES[second]) {
      type = second;
      id = parseInt(first, 10) || 1;
    } else {
      id = parseInt(first, 10) || 1;
      if (typeof second === 'string') type = second;
    }
  }

  const images = PROPERTY_IMAGES[type] || PROPERTY_IMAGES.HOUSE;
  const index = Math.abs(id) % images.length;
  return images[index];
}
