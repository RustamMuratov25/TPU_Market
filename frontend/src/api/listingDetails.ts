import { MOCK } from '../data/mock';
import type { Condition, Listing } from '../types';

export interface Review { id: number; author: string; unit: string; stars: number; text: string; when: string; subject: string }
export interface Spec { label: string; value: string; note: string }
export interface SellerInfo { program: string; deals: number; reviewsCount: number; emailMasked: string; address: string; since: string }
export interface ListingDetails extends Listing {
  sku: string; images: string[]; longDescription: string; pickupNote: string;
  moderation: string; specs: Spec[]; sellerInfo: SellerInfo; reviews: Review[];
}

const CONDITION_RU: Record<Condition, string> = { new: 'Новое', excellent: 'Отличное', good: 'Хорошее', parts: 'На запчасти' };

export async function fetchListingDetails(id: number, pool: Listing[] = MOCK): Promise<ListingDetails | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        return data.item;
      }
    }
  } catch (err) {
    console.warn('API error in fetchListingDetails:', err);
  }

  // Фолбек
  const l = pool.find((x) => x.id === id);
  if (!l) return null;
  const base: ListingDetails = {
    ...l,
    sku: `ТПУ-13-${8940 + l.id}`,
    images: l.images && l.images.length > 0 ? l.images : (l.image ? [l.image] : []),
    longDescription: l.description,
    pickupNote: `Самовывоз: ${l.dorm}. Могу донести до вахты или до вашей комнаты в этом же общежитии.`,
    moderation: 'Запрещённые правилами проживания предметы отсутствуют.',
    specs: [
      { label: 'Состояние', value: CONDITION_RU[l.condition] || 'Хорошее', note: 'Без посторонних запахов, чистая' },
      { label: 'Тип сделки', value: l.offerType === 'free' ? 'Отдам даром' : 'Прямая продажа', note: 'Передача из рук в руки без скрытых наценок' },
      { label: 'Категория', value: l.category, note: 'Оснащение студенческой комнаты' },
    ],
    sellerInfo: { program: `Студент ТПУ (${l.seller.institute})`, deals: l.seller.reviews, reviewsCount: l.seller.reviews, emailMasked: '***@tpu.ru', address: l.dorm, since: '2024 года' },
    reviews: [],
  };
  return base;
}
