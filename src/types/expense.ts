/**
 * Tipos para el sistema de gesti?n de gastos
 */

export type Category =
  | 'Transporte'
  | 'Alimentación'
  | 'Material académico'
  | 'Entretenimiento'
  | 'Salud'
  | 'Otros';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: Date;
  description?: string;
  receiptUri?: string;
}

export const CATEGORIES: Category[] = [
  'Transporte',
  'Alimentación',
  'Material académico',
  'Entretenimiento',
  'Salud',
  'Otros',
];

export const CATEGORY_ICONS: Record<Category, string> = {
  'Transporte': '\u{1F697}',
  'Alimentación': '\u{1F354}',
  'Material académico': '\u{1F4DA}',
  'Entretenimiento': '\u{1F3AE}',
  'Salud': '\u{1F48A}',
  'Otros': '\u{1F4E6}',
};

export type SortOrder = 'desc' | 'asc';

export const sortExpenses = (list: Expense[], order: SortOrder): Expense[] =>
  [...list].sort((a, b) =>
    order === 'desc'
      ? b.amount - a.amount || b.date.getTime() - a.date.getTime()
      : a.amount - b.amount || b.date.getTime() - a.date.getTime()
  );

export function formatExpenseDate(date: Date, includePrefix = false): string {
  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const normalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return includePrefix ? `Hoy ? ${normalized}` : normalized;
}
