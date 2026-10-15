import { z } from 'zod';
import { CATEGORIES } from '@/types/expense';

const categoryValues = [...CATEGORIES] as [typeof CATEGORIES[number], ...typeof CATEGORIES];

export const expenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Ingresa un monto')
    .refine((value) => !Number.isNaN(parseFloat(value)) && parseFloat(value) > 0, 'El monto debe ser mayor que 0'),
  category: z.enum(categoryValues, { error: 'Elige una categoría' }),
  description: z.string().max(120, 'Máximo 120 caracteres').optional(),
  receiptUri: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
