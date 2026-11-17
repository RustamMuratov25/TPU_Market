import { MOCK } from '../data/mock';
import type { Filters, Listing } from '../types';

export const PAGE_SIZE = 9;
export interface ListingsPage { items: Listing[]; total: number }

export async function fetchListings(f: Filters): Promise<ListingsPage> {
  try {
    const params = new URLSearchParams();
    if (f.search && f.search.trim()) {
      params.append('search', f.search.trim());
    }
    if (f.categories && f.categories.length > 0) {
      f.categories.forEach((c) => params.append('categories[]', c));
    }
    if (f.dorms && f.dorms.length > 0) {
      f.dorms.forEach((d) => params.append('dorms[]', d));
    }
    if (f.priceMin > 0) {
      params.append('price_min', f.priceMin.toString());
    }
    if (f.priceMax < 15000) {
      params.append('price_max', f.priceMax.toString());
    }
    if (f.offerTypes && f.offerTypes.length > 0) {
      f.offerTypes.forEach((o) => params.append('offer_types[]', o));
    }
    if (f.conditions && f.conditions.length > 0) {
      f.conditions.forEach((c) => params.append('conditions[]', c));
    }
    if (f.onlyAvailable) {
      params.append('only_available', '1');
    }
    params.append('sort', f.sort);
    params.append('page', f.page.toString());
    params.append('per_page', PAGE_SIZE.toString());

    const endpoint = f.search && f.search.trim() ? '/api/search' : '/api/products';
    const res = await fetch(`${endpoint}?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        return { items: data.items, total: data.total ?? data.items.length };
      }
    }
  } catch (err) {
    console.warn('API error in fetchListings, using local fallback:', err);
  }

  // Локальный фолбек на случай недоступности сервера
  const q = f.search.trim().toLowerCase();
  const rows = MOCK.filter((l) =>
    (!f.dorms.length || f.dorms.includes(l.dorm)) &&
    (!f.categories.length || f.categories.includes(l.category)) &&
    l.price >= f.priceMin && l.price <= f.priceMax &&
    (!f.offerTypes.length || f.offerTypes.includes(l.offerType)) &&
    (!f.conditions.length || f.conditions.includes(l.condition)) &&
    (!f.onlyAvailable || l.status !== 'reserved') &&
    l.title.toLowerCase().includes(q),
  );
  rows.sort((a, b) =>
    f.sort === 'cheap' ? a.price - b.price : f.sort === 'expensive' ? b.price - a.price : b.createdAt - a.createdAt,
  );
  const start = (f.page - 1) * PAGE_SIZE;
  return { items: rows.slice(start, start + PAGE_SIZE), total: rows.length };
}
