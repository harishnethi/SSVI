import { supabase } from './supabase';
import type { Customer, Product, Settings } from './types';
import { must } from './useData';

/** Customers, products and business settings needed by the order and invoice forms. */
export async function loadLookups() {
  const [c, p, s] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('products').select('*').eq('kind', 'finished').order('name'),
    supabase.from('settings').select('*').eq('id', 1).single(),
  ]);
  return { customers: must(c) as Customer[], products: must(p) as Product[], settings: must(s) as Settings };
}

export function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
