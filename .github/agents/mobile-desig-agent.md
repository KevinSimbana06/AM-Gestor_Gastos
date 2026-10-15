---
name: mobile-desig-agent
description: >
  Agente de diseño e interfaz del Gestor de Gastos para Poliestudiantes, sujeto a
  .github/copilot-instruccion.md. Implementa: campo de fecha obligatorio del día de registro,
  comprobante/factura adjunto opcional (cámara o galería), edición y eliminación de gastos, y
  ordenamiento por monto. Úsalo cuando el pedido incluya: "campo de fecha", "fecha del gasto",
  "factura", "comprobante", "recibo", "editar gasto", "eliminar gasto", "borrar gasto",
  "long press", "ordenar por monto", "gastos más altos", "filtrar", "ordenar", "react-hook-form",
  "zod", "formulario".
tools: ['codebase', 'editFiles', 'search', 'problems', 'runCommands']
---

# Agente: Diseño de interfaz (fecha, comprobante, editar/eliminar, ordenar)

> **Este agente es subordinado a `.github/copilot-instruccion.md`.** Si algo de este documento
> contradice esas instrucciones, **manda `copilot-instruccion.md`**. Léelo completo antes de
> escribir código.

## 1. Objetivo

Implementar cuatro mejoras de UX sobre el Gestor de Gastos para Poliestudiantes (Expo SDK 57,
React Native 0.86, TypeScript `strict`, expo-router, expo-sqlite, Liquid Glass):

- **a. Fecha obligatoria:** cada gasto queda asociado al **día en que se registra**. Es
  **automática e informativa**: se muestra en el formulario y se guarda, pero el usuario **no la
  edita**.
- **b. Comprobante / factura adjunto:** campo **opcional** para subir la foto del ticket,
  **tomándola con la cámara** o **eligiéndola de la galería**.
- **c. Editar y eliminar:** el usuario puede corregir o borrar un gasto existente.
- **d. Ordenar:** la lista se puede ordenar por monto (mayor→menor y menor→mayor).

Decisiones ya acordadas con el usuario (no las re-preguntes):

| Decisión | Valor |
|---|---|
| Campo fecha | Automática, **no editable**, precargada con hoy |
| Comprobante | Lo define `camera-implementation.agent.md` |
| Editar / eliminar | **Long press** sobre el item de la lista |
| Ordenamiento | **Solo por monto** |

## 2. Reglas obligatorias (de `.github/copilot-instruccion.md`)

| Regla | Cómo se cumple aquí |
|---|---|
| §2.1 Idioma | Comentarios, `Alert`, textos de UI y validaciones en **español** |
| §2.2 Diseño | Colores/espaciado **solo** desde `@/constants/theme`; inputs `rgba(255,255,255,0.5)`, `glassBorder`, `Spacing.two` |
| §2.3 Teclado | `KeyboardAvoidingView` + `ScrollView` con `keyboardShouldPersistTaps="handled"` |
| §2.4 TypeScript | `strict`, **sin `any` ni `@ts-ignore`**; tipos nuevos en `src/types/` |
| §2.6 Librerías | **Solo** las autorizadas: `react-hook-form`, `zod`, `@hookform/resolvers`, `expo-image-picker`. Nada de `expo-haptics`, `datepicker` ni swipe gestures |
| §2.7 No tocar código existente | **`AddExpenseModal.tsx` NO se modifica ni se migra** (§3.1 y checklist). Cambios en `ExpenseContext.tsx` y `src/database/`: **solo aditivos**. Ante la duda, **preguntar** |
| §2.8 Verificación | `npm run lint` **y** `npx tsc --noEmit` sin errores |
| §3.1 Formularios nuevos | El formulario nuevo se hace con **react-hook-form + zod**, schema en `src/schemas/<NombreForm>Schema.ts`, `mode: 'onChange'`, `Controller` para los `TextInput`, `z.infer` para los tipos |
| §3.2 expo-image-picker | Permisos, `mediaTypes: ['images']`, `quality` ≈ 0.7, `expo-image` para previsualizar, alertas en español |
| §1 Estructura / alias | Carpetas de §1 (`app`, `components`, `context`, `database`, `constants`, `types`, `schemas`). Imports con `@/...`, nunca rutas relativas largas |

**Diseño del sistema:** vive en `.github/skills/DESIGN_SYSTEM.md` (léelo antes de escribir UI).
Ejemplos reales en `src/components/` y `src/app/index.tsx`.

**Dependencia de otro agente:** el bloque **b** depende de `camera-implementation.agent.md`.
Verifica que exista `src/components/ExpenseImagePicker.tsx` y, si el usuario eligió persistencia
permanente, las funciones de archivo y la columna `receipt_uri`. **Si falta algo, no lo
reimplementes a medias:** impleméntalo primero siguiendo ese agente o informa al usuario.

## 3. Decisión que debes preguntar antes de codificar

`copilot-instruccion.md` prohíbe tocar `AddExpenseModal.tsx`, así que el formulario de estos
campos **nace nuevo** (`ExpenseFormModal.tsx`) y queda el modal viejo sin usar. **Pregunta:**

> El formulario nuevo (react-hook-form + zod) reemplaza al actual `AddExpenseModal` en el botón
> `+` de la pantalla principal. ¿Qué hago con el modal antiguo?
> **a)** Dejarlo en el código sin usar, **b)** borrarlo, **c)** dejarlo accesible en otro sitio.

No borres nada sin respuesta. **Implementa el resto solo después de despejar esta duda.**

## 4. Especificación A — Fecha obligatoria (automática)

**Datos**

- El campo `date` **siempre** está presente: obligatorio, pero **lo genera el sistema**, no el
  usuario. Se crea con `new Date()` (fecha local) al guardar.
- **Nunca** guardes solo `YYYY-MM-DD` ni `toISOString().split('T')[0]`: rompe el filtro por mes al
  cambiar de zona horaria.
- **Al editar se conserva la fecha original** del gasto (el día en que se registró).
- Sin migración de esquema: la columna `date` ya existe.

**UI (formulario nuevo)**

- Campo de **solo lectura** con el estilo de input oficial: fondo `rgba(255,255,255,0.5)`,
  `borderWidth: 1`, `glassBorder`, `borderRadius: Spacing.two`.
- Alta: `Hoy · martes 15 de octubre`
  (`toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })`).
- Edición: la fecha original + `Fecha de registro` en `glassTextSecondary`.
- Formato desde una función compartida (no dupliques `toLocaleDateString` en varios sitios).
- `accessibilityLabel="Fecha del gasto"` y
  `accessibilityHint="Se registra automáticamente con el día de hoy"`.
- No es editable: no pongas `TextInput`, no lo metas en el schema como campo que el usuario escriba.

## 5. Especificación B — Comprobante adjunto (opcional)

- Campo opcional `receiptUri` (columna `receipt_uri`), **nunca** condición para poder guardar.
- Reusa `ExpenseImagePicker` dentro del formulario nuevo, después de la descripción.
- El componente es controlado: con react-hook-form usa `setValue('receiptUri', uri,
  { shouldValidate: true })` + `watch('receiptUri')`, o envuélvelo en un `Controller`.
  **No dupliques estado** con un `useState` para lo que ya maneja el formulario.
- Con imagen: miniatura con `expo-image` + botón **Quitar**. Sin imagen:
  `Sin comprobante adjunto` en `glassTextSecondary`.
- Al reemplazar o quitar la imagen, borra el archivo anterior (si el agente de cámara dejó
  `deleteReceiptImage`): nada de archivos huérfanos.

## 6. Especificación C — Editar y eliminar

### C1. Datos (cambios **aditivos**)

`src/database/expenseRepository.ts` — **añade** estas funciones; no edites las actuales
(`getAllExpenses`, `insertExpense`):

```ts
export async function updateExpense(db: SQLiteDatabase, expense: Expense): Promise<void> {
  await db.runAsync(
    'UPDATE expenses SET amount = ?, category = ?, description = ?, receipt_uri = ? WHERE id = ?',
    [expense.amount, expense.category, expense.description ?? null,
     expense.receiptUri ?? null, expense.id]
  );
}

export async function deleteExpense(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}
```

`src/context/ExpenseContext.tsx` — **añade** `updateExpense(expense: Expense)` y
`deleteExpense(id: string)` con **el mismo patrón de `addExpense`**: primero la base, después
el estado; si el `await` lanza, **no** toques el estado y propaga el error.

- `updateExpense`: reemplaza el elemento por `id`. `deleteExpense`: filtra por `id`.
- **No cambies la firma de `addExpense` ni el comportamiento de nada existente.**
- Si crees que hace falta alterar algo existente, **pregunta antes** (§2.7).

### C2. Formulario nuevo en dos modos

`src/components/ExpenseFormModal.tsx` (react-hook-form + zod) y
`src/schemas/ExpenseFormSchema.ts`:

```ts
import { z } from 'zod';

export const expenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Ingresa un monto')
    .refine((v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) > 0, 'El monto debe ser mayor que 0'),
  category: z.enum([/* las 6 categorías de src/types/expense.ts */], {
    errorMap: () => ({ message: 'Elige una categoría' }),
  }),
  description: z.string().max(120, 'Máximo 120 caracteres').optional(),
  receiptUri: z.string().optional(), // opcional: la foto del comprobante
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
```

- `useForm<ExpenseFormValues>({ resolver: zodResolver(expenseFormSchema), mode: 'onChange' })`.
- Modos: `{ expenseToEdit?: Expense }` → **alta** o **edición**. Título `Agregar Gasto` /
  `Editar Gasto`, botón `Agregar` / `Guardar`.
- Precarga los valores del gasto editado y su **fecha original**.
- Errores **debajo de cada campo**, en texto pequeño y en español (el `message` del schema).
- La lógica de guardado va en `handleSubmit(onValid)`, nunca en el render.
- En edición conserva `id` y `date`; reemplaza monto, categoría, descripción y comprobante.
- Reset al cerrar y tras guardar. Mantén `KeyboardAvoidingView` + `ScrollView`
  (`keyboardShouldPersistTaps="handled"`).

### C3. Long press sobre el item

- `ExpenseItem` recibe `onPress`, `onLongPress` y `onReceiptPress` como props opcionales: el
  componente no accede a la base ni al contexto; la pantalla le pasa los handlers.
- **Long press** → menú de acciones: **Ver comprobante** (solo si hay foto), **Editar gasto**,
  **Eliminar gasto**. Usa `Alert.alert` con acciones (robusto y accesible) o un bottom sheet glass
  si ya existe el patrón: **una sola opción**, no ambas.
- **Eliminar** siempre pide confirmación, con el estilo destructivo de `Alert`:

```ts
Alert.alert(
  'Eliminar gasto',
  'Se eliminará este gasto. Esta acción no se puede deshacer.',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: confirmar },
  ]
);
```

- Al confirmar: borra la fila y el archivo de la imagen (si existe `deleteReceiptImage`) y avisa
  con un `Alert` breve: `Gasto eliminado`.
- **Feedback de long press:** comprime la tarjeta con `Animated` (`useSharedValue` + `withTiming`).
  `GlassCard` ya acepta `animated` y `animatedValue`: reúsalos, no crees un componente de animación.
- **Accesibilidad:** `accessibilityLabel="<categoría>, <monto>, <fecha>"`,
  `accessibilityHint="Mantén pulsado para editar o eliminar"` y `accessibilityActions` con `activate`.

## 7. Especificación D — Ordenar por monto

**Datos** — `src/types/expense.ts`:

```ts
export type SortOrder = 'desc' | 'asc'; // desc = del gasto más alto al más bajo

// Ordena por monto y, a igualdad, por fecha descendente. Devuelve una copia.
export const sortExpenses = (list: Expense[], order: SortOrder): Expense[] =>
  [...list].sort((a, b) =>
    order === 'desc'
      ? b.amount - a.amount || b.date.getTime() - a.date.getTime()
      : a.amount - b.amount || b.date.getTime() - a.date.getTime()
  );
```

- El estado del orden vive **en la pantalla** (`useState<SortOrder>('desc')` en
  `src/app/index.tsx`): así **no hay que tocar `ExpenseContext.tsx`** (§2.7).
- **Los totales no cambian** con el orden: `getMonthlyTotal()` y `MonthlyHeader` siguen operando
  sobre la lista sin ordenar.
- No persistas la preferencia: es estado de sesión, sin `AsyncStorage`.

**UI**

- Nuevo componente `src/components/SortToggle.tsx`, **debajo de `MonthlyHeader`** en
  `src/app/index.tsx`, dentro del `paddingHorizontal: Spacing.four` del contenido.
- Dos chips glass: **⬇ Mayor a menor** (activo por defecto) y **⬆ Menor a mayor**.
- Chip activo con `LinearGradient` `primary → secondary` y texto `glassTextLight`; chip inactivo
  con fondo translúcido, borde `glassBorder` y texto `glassText`.
- `accessibilityRole="tab"` y `accessibilityState={{ selected: esActivo }}`.
- `FlatList` con `extraData={sortOrder}` para que el reordenado se pinte.
- El estado vacío ("No hay gastos registrados") se mantiene igual.

## 8. Orden de ejecución

1. Leer `copilot-instruccion.md`, `.github/skills/DESIGN_SYSTEM.md`,
   `camera-implementation.agent.md` y los archivos que vas a tocar.
2. **Preguntar** la decisión de la sección 3 (qué hacer con `AddExpenseModal`) y resolver el Paso 0
   del agente de cámara (persistencia sí/no) si aún no está resuelto.
3. **Dependencias autorizadas:** `npm install react-hook-form zod @hookform/resolvers`
   (y `npx expo install expo-image-picker` si el comprobante aún no está).
4. **Datos:** `SortOrder` + `sortExpenses` → `updateExpense` / `deleteExpense` (aditivos).
5. **Formulario:** `ExpenseFormSchema` → `ExpenseFormModal` (fecha + comprobante + modo edición).
6. **Componentes:** `SortToggle` → long press en `ExpenseItem` → conectar en `index.tsx`.
7. **Documentación:** actualizar `.github/skills/DESIGN_SYSTEM.md` con el patrón del control de
   orden, del long press y del campo de solo lectura.

## 9. Verificación (obligatoria)

```bash
npm run lint
npx tsc --noEmit
```

- Ambos sin errores. Si `npm run lint` falla **porque eslint no está instalado**, **no instales
  nada** (§2.6): repórtalo como bloqueo y sigue con `tsc`.

Pruebas manuales:

- [ ] Alta sin comprobante y con foto (cámara y galería) funcionan.
- [ ] El formulario muestra la fecha de hoy y el gasto se guarda con esa fecha.
- [ ] Editar cambia monto, categoría, descripción y comprobante, y **conserva** la fecha original.
- [ ] Reemplazar el comprobante no deja el archivo viejo en el dispositivo.
- [ ] Long press muestra el menú; **Editar** abre el formulario con los datos cargados.
- [ ] **Eliminar** pide confirmación; al confirmar desaparece de la lista y del total del mes.
- [ ] Cancelar la confirmación no borra nada.
- [ ] Orden mayor→menor / menor→mayor funciona; **el total del mes no cambia** al ordenar.
- [ ] Reiniciar la app: los datos y los comprobantes persisten.

## 10. Archivos a tocar

```
src/types/expense.ts                      # receiptUri?, SortOrder, sortExpenses, formato de fecha
src/database/expenseRepository.ts         # AÑADIR updateExpense, deleteExpense
src/context/ExpenseContext.tsx            # AÑADIR updateExpense, deleteExpense (sin tocar lo demás)
src/schemas/ExpenseFormSchema.ts          # NUEVO: schema zod (carpetaschemas)
src/components/ExpenseFormModal.tsx       # NUEVO: react-hook-form + zod, alta y edición
src/components/ExpenseImagePicker.tsx     # del agente de cámara (no lo reimplementes)
src/components/ExpenseItem.tsx            # long press, miniatura, handlers por props
src/components/SortToggle.tsx             # NUEVO: control segmentado de orden
src/app/index.tsx                         # estado del orden, long press, formulario nuevo
.github/skills/DESIGN_SYSTEM.md           # documentar los 3 patrones nuevos
```

**No modificar:** `AddExpenseModal.tsx` (§2.7 y §3.1) ni `src/app/_layout.tsx` salvo que el
usuario lo pida.

Al terminar reporta: decisión sobre `AddExpenseModal`, archivos modificados, salida de
`npm run lint` y `npx tsc --noEmit`, y qué queda pendiente de validar en un dispositivo real.