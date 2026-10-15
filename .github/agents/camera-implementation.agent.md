---
name: camera-implementation
description: >
  Implementa el comprobante/factura adjunto (foto) en los gastos del Gestor de Gastos para
  Poliestudiantes, con cámara o galería, siguiendo .github/copilot-instruccion.md.
  Úsalo cuando el pedido incluya: "adjuntar foto", "subir imagen", "tomar foto", "cámara",
  "galería", "comprobante", "factura", "recibo", "ticket", "receipt", "receipt_uri",
  "expo-image-picker" o "foto del gasto".
tools: ['codebase', 'editFiles', 'search', 'problems', 'runCommands']
---

# Agente: Implementación de cámara (comprobante del gasto)

> **Este agente es subordinado a `.github/copilot-instruccion.md`.** Si algo de este documento
> contradice esas instrucciones, **manda `copilot-instruccion.md`**. Léelo completo antes de
> escribir código.

## 0. Reglas obligatorias (de `.github/copilot-instruccion.md`)

| Regla | Cómo se cumple aquí |
|---|---|
| §2.1 Idioma | Comentarios, `Alert`, textos de UI y validaciones en **español** |
| §2.2 Diseño | Colores/espaciado **solo** desde `@/constants/theme` (`LiquidGlassColors`, `Spacing`); inputs `rgba(255,255,255,0.5)` + `glassBorder` + `Spacing.two` |
| §2.3 Teclado | `KeyboardAvoidingView` + `ScrollView` con `keyboardShouldPersistTaps="handled"` |
| §2.4 TypeScript | `strict`, **sin `any` ni `@ts-ignore`**; tipos nuevos en `src/types/` |
| §2.6 Librerías | **Solo** `expo-image-picker` (+ `expo-file-system` si el usuario lo autoriza, ver Paso 0). Nada de `expo-haptics`, `datepicker`, galerías |
| §2.7 No tocar código existente | `AddExpenseModal.tsx`, `ExpenseContext.tsx` y `src/database/` solo se **modifican si la tarea lo pide**; aquí solo se **añaden** funciones/columnas. Ante la duda, **preguntar** |
| §2.8 Verificación | `npm run lint` **y** `npx tsc --noEmit` sin errores |
| §1 Alias | Imports con `@/...`, **nunca** rutas relativas largas |
| §3.2 expo-image-picker | Permisos con plugin en `app.json`, `mediaTypes: ['images']`, `quality` ≈ 0.7, `expo-image` para previsualizar, alerta en español al denegar |

**Diseño del sistema:** el documento vive en `.github/skills/DESIGN_SYSTEM.md` (léelo antes de
escribir UI). Ejemplos reales en `src/components/` y `src/app/index.tsx`.

## 1. Paso 0 — Pregunta obligatoria ANTES de escribir código

`copilot-instruccion.md` §3.2 lo exige literalmente. **Pide confirmación y no sigas sin respuesta:**

> ¿La foto del comprobante debe seguir ahí **después de cerrar y abrir la app**?
>
> - **a) Sí, permanente (recomendado):** se copia el archivo con `expo-file-system` (aún **no
>   instalado**) a una carpeta propia de la app y se guarda una columna `receipt_uri` en SQLite.
> - **b) Solo durante la sesión:** se guarda el `uri` temporal en el formulario y no se toca la
>   base de datos.

Si eliges **a**, pide además **autorización para instalar `expo-file-system`** (§2.6 solo permite
las librerías autorizadas). Si el usuario dice que no, implements **b** y no inventes nada más.

## 2. Dependencias

Opción **a** (permanente, requiere autorización):

```bash
npx expo install expo-image-picker
npx expo install expo-file-system   # solo con autorización del usuario
```

Opción **b** (sesión): solo `npx expo install expo-image-picker`.

- `expo-image` **ya está instalado**: úsalo para mostrar la foto (regla explícita de §3.2).
- No uses `Image` de `react-native` para la previsualización.
- Verifica que `package.json` quedó actualizado.

## 3. Permisos en `app.json`

Usa **exactamente** el bloque de `copilot-instruccion.md` §3.2 (los textos están aprobados):

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { "backgroundColor": "#208AEF", "image": "./assets/images/splash-icon.png", "imageWidth": 76 }],
  "expo-sqlite",
  [
    "expo-image-picker",
    {
      "photosPermission": "La app accede a tus fotos para adjuntar el comprobante de un gasto.",
      "cameraPermission": "La app usa la cámara para fotografiar el comprobante de un gasto."
    }
  ]
]
```

- No agregues propiedades extra (`microphonePermission`, `colors`) sin preguntar: el documento ya
  define este bloque y §2.7 pide preguntar ante la duda.
- Estos textos son de iOS (`Info.plist`) y requieren rebuild; en Expo Go salen los genéricos.
- `expo-image-picker` declara `CAMERA` en Android, por eso el permiso se pide en runtime.

## 4. Nombres (importan, ya están decididos)

- Tipo: `Expense.receiptUri?: string` en `src/types/expense.ts` (no `imageUri`).
- Columna SQLite: **`receipt_uri`** (el nombre propuesto en `copilot-instruccion.md` §3.2).
- Sin cambios de esquema en la opción **b**.

## 5. Componente y lógica

Un solo archivo nuevo: **`src/components/ExpenseImagePicker.tsx`**, que exporta:

- `ExpenseImagePicker` — el control visual (props: `value?: string`, `onChange(uri?: string)`,
  `disabled?: boolean`).
- `useReceiptPicker()` — hook con la lógica (permisos + picker + guardado del archivo).

Si separas la lógica de archivos, crea `src/services/receiptImages.ts` **solo con aprobación del
usuario** (la estructura de §1 no incluye `services/`); si no, déjalo dentro del propio componente.
No crees otras carpetas nuevas sin preguntar.

### Reglas de la lógica (idénticas a §3.2)

- **Permiso antes de abrir el picker:** `requestCameraPermissionsAsync()` para la cámara,
  `requestMediaLibraryPermissionsAsync()` para la galería. Si no se concede, `Alert.alert` en
  español y **no intentes abrir el picker** de nuevo.
- `launchCameraAsync` / `launchImageLibraryAsync` según el botón que el usuario pulse.
- `mediaTypes: ['images']` — **nunca** `MediaTypeOptions` (deprecado).
- `quality: 0.7`; no pidas más resolución de la necesaria para ver un ticket.
- **Cancelación:** si `result.canceled`, no cambies nada y **no borres** lo que ya estaba cargado.
- Previsualización con `expo-image` (`contentFit="cover"`, `transition={200}`).
- Estilo glass: `Spacing`, `LiquidGlassColors`, inputs `rgba(255,255,255,0.5)`, `glassBorder`,
  `borderRadius: Spacing.two`, gradiente `primary → secondary` para la acción principal.

### Si el usuario eligió la opción (a) — persistencia real

El `asset.uri` del picker es **temporal**: copia el archivo antes de devolver la uri.
Con la API actual de `expo-file-system` (`File`, `Directory`, `Paths`):

```ts
import { Directory, File, Paths } from 'expo-file-system';

// Carpeta propia de la app: los archivos de la app no los borra el sistema.
function receiptsDirectory(): Directory {
  const dir = new Directory(Paths.document, 'receipts');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export async function saveReceiptImage(sourceUri: string, receiptId: string): Promise<string> {
  const source = new File(sourceUri);
  const destination = receiptsDirectory().createFile(
    `${receiptId}-${Date.now()}.${source.extension || 'jpg'}`,
    source.type || 'image/jpeg'
  );
  await source.copy(destination);
  return destination.uri; // esta sí persiste entre reinicios
}

export function deleteReceiptImage(uri?: string): void {
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
```

- En **web** `expo-file-system` no existe: devuelve la uri tal cual (`Platform.OS === 'web'`).
- Si el usuario **reemplaza o quita** la foto, borra el archivo anterior: nada de huérfanos.

## 6. Persistencia en SQLite (solo opción a)

Cambios **aditivos** en `src/database/`, sin reescribir lo existente:

1. Nueva migración con `PRAGMA user_version` (control de versión, `ALTER TABLE` una sola vez):

```sql
ALTER TABLE expenses ADD COLUMN receipt_uri TEXT
```

Las bases ya instaladas en los teléfonos no tienen la columna: sin `user_version` la app crashea.

2. `expenseRepository.ts`: añadir `receipt_uri` al `SELECT`/`INSERT`, `receipt_uri: string | null`
   en la fila, y mapear con `?? undefined`. **No cambies las funciones actuales.**

## 7. Verificación (obligatoria)

```bash
npm run lint
npx tsc --noEmit
```

- Ambos deben quedar sin errores. Si `npm run lint` falla **porque eslint no está instalado**,
  **no instales nada** (§2.6): repórtalo como bloqueo y sigue con `tsc`.
- Prueba manual en dispositivo real (el emulador de iOS no tiene cámara):
  - [ ] Foto con cámara → miniatura visible.
  - [ ] Foto desde galería → miniatura visible.
  - [ ] Cancelar el picker no borra lo ya cargado ni muestra errores.
  - [ ] Permiso denegado → alerta en español y no se reintenta a lo loco.
  - [ ] **(opción a)** Cerrar y reabrir la app: la foto sigue ahí.
  - [ ] **(opción a)** App con base vieja: abre sin crashear y los gastos antigos se ven sin foto.

## 8. Archivos a tocar

```
app.json                                  # plugin expo-image-picker
package.json                              # expo-image-picker (+ expo-file-system si se autorizó)
src/types/expense.ts                      # receiptUri?: string   (solo opción a)
src/database/database.ts                  # migración receipt_uri (solo opción a, aditivo)
src/database/expenseRepository.ts         # columna receipt_uri (solo opción a, aditivo)
src/components/ExpenseImagePicker.tsx     # NUEVO: componente + useReceiptPicker
```

**No modifiques** `AddExpenseModal.tsx` ni `ExpenseContext.tsx`: este agente solo deja el control
listo para que otro formulario lo use (§2.7).

Al terminar reporta: respuesta del usuario en el Paso 0, si se autorizó `expo-file-system`,
archivos modificados, salida de `npm run lint` y `npx tsc --noEmit`, y qué falta probar en un
dispositivo físico. No hagas commit salvo que lo pidan.