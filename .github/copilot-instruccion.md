# Instrucciones generales para Copilot

Documento de referencia para cualquier asistente de código que trabaje en este repositorio. Lee este archivo antes de proponer cambios.

> Última actualización: 15/10/2026 — se agregan las librerías nuevas pendientes de instalar (sección 3).

## 1. Contexto del proyecto

- App móvil **Gestor de gastos** construida con **Expo SDK 57** (React Native 0.86, React 19.2, TypeScript `strict`).
- Navegación con **expo-router**; las rutas viven en `src/app/`.
- Persistencia local con **expo-sqlite** (`src/database/`) y estado global con Context API (`src/context/ExpenseContext.tsx`).
- Compilador de React activo (`experiments.reactCompiler: true` en `app.json`).
- Alias de rutas: `@/` → `src/` y `@/assets/` → `assets/`. **Usar siempre el alias**, nunca rutas relativas largas (`../../../`).

### Estructura

| Carpeta | Contenido |
|---------|-----------|
| `src/app/` | Pantallas (rutas de expo-router) |
| `src/components/` | Componentes reutilizables (`GlassCard`, modales, items) |
| `src/context/` | Providers de React Context |
| `src/database/` | Conexión y repositorios de SQLite |
| `src/constants/` | `theme.ts` (colores y espaciado) |
| `src/types/` | Tipos e interfaces compartidas |

## 2. Reglas generales

1. **Idioma**: comentarios, mensajes de `Alert`, textos de UI y mensajes de validación en **español**.
2. **Estilo visual**: seguir `DESIGN_SYSTEM.md`. Colores y espaciado **siempre** desde `@/constants/theme` (`LiquidGlassColors`, `Spacing`), sin valores sueltos. Inputs con fondo `rgba(255,255,255,0.5)`, borde `glassBorder` y `borderRadius: Spacing.two`.
3. **Teclado**: todo formulario o modal con inputs usa `KeyboardAvoidingView` + `ScrollView` con `keyboardShouldPersistTaps="handled"`.
4. **TypeScript**: modo `strict`, sin `any` ni `ts-ignore`. Tipos nuevos en `src/types/`.
5. **Comentarios**: al estilo del código existente (explicativos, en español, no sobreescribir lo obvio).
6. **No instalar librerías** que no estén autorizadas en la sección 3 ni en la tarea actual.
7. **No modificar código existente** (en especial `AddExpenseModal.tsx`, `ExpenseContext.tsx` y el módulo `database/`) salvo que la tarea lo pida explícitamente. Ante la duda, preguntar.
8. **Verificación**: antes de terminar, correr `npm run lint` y `npx tsc --noEmit` y dejar ambos sin errores.

## 3. Librerías nuevas a implementar

| Librería | Para qué | Estado |
|----------|----------|--------|
| `react-hook-form` + `zod` + `@hookform/resolvers` | Validación y manejo de **formularios nuevos** | **Pendiente de instalar** |
| `expo-image-picker` | Sacar/elegir la **foto del comprobante** (ticket) de un gasto | **Pendiente de instalar** |

### 3.1 react-hook-form + zod

**Alcance importante**: se usa **únicamente en formularios nuevos**. El `AddExpenseModal.tsx` actual **NO se migra**; conserva sus `useState` y su validación manual. No refactorizarlo para "unificar".

Instalación:

```bash
npm install react-hook-form zod @hookform/resolvers
```

Reglas de uso:

- Un schema de Zod por formulario, en `src/schemas/<NombreForm>Schema.ts` (crear la carpeta cuando se necesite).
- Inferir el tipo del formulario con `z.infer<typeof ...>` y pasarlo a `useForm<FormValues>`.
- Usar `mode: 'onChange'` para que el botón de envío se habilite conforme el usuario escribe (consistente con el patrón de botón deshabilitado que ya existe en la app).
- Para `TextInput` de React Native usar `Controller` de react-hook-form; no aplicar `register` directamente sobre componentes de terceros.
- Mostrar cada error debajo de su campo, en texto pequeño y en español (`message` del schema).
- La lógica de guardado (contexto/base de datos) va dentro del callback de `handleSubmit(onValid)`, no en el render.
- No duplicar estado: si `react-hook-form` maneja un campo, no crear un `useState` para lo mismo.

Ejemplo base a seguir:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  amount: z.string().min(1, 'Ingresa un monto'),
  description: z.string().max(120, 'Máximo 120 caracteres').optional(),
});

type FormValues = z.infer<typeof schema>;

const { control, handleSubmit, formState: { errors, isValid } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onChange',
  defaultValues: { amount: '', description: '' },
});
```

### 3.2 expo-image-picker

**Para qué**: adjuntar la foto del comprobante/ticket a un gasto, eligiendo entre **cámara o galería**.

Instalación (usar `npx expo install` para que respete la versión compatible con el SDK 57):

```bash
npx expo install expo-image-picker
```

Permisos: agregar el plugin en `app.json` dentro de `"plugins"`, con los textos de permiso en español:

```json
[
  "expo-image-picker",
  {
    "photosPermission": "La app accede a tus fotos para adjuntar el comprobante de un gasto.",
    "cameraPermission": "La app usa la cámara para fotografiar el comprobante de un gasto."
  }
]
```

Reglas de uso:

- **Pedir permiso antes de abrir** el picker (`requestCameraPermissionsAsync` / `requestMediaLibraryPermissionsAsync`) y manejar la negación con un `Alert` en español; no seguir intentando abrir si fue denegado.
- Usar `launchCameraAsync` o `launchImageLibraryAsync` según la opción que elija el usuario; `mediaTypes: ['images']` (no usar el enum `MediaTypeOptions`, está deprecado).
- Limitar el peso de la imagen (`quality` ≈ 0.7) y no pedir más resolución de la necesaria para ver un ticket.
- El resultado es un `asset.uri` **temporal**; no asumir que persiste entre reinicios.
- La previsualización de la foto elegida se muestra con **`expo-image`** (ya instalado), no con `Image` de React Native.
- El disparador del picker vive en un botón dentro del formulario/modal nuevo, con el mismo estilo glass del resto (`Spacing`, `LiquidGlassColors`).
- Manejar el caso en que el usuario cancele: no borrar lo que ya estaba cargado.

**Decisión pendiente (confirmar antes de implementar):**

- Si la foto del comprobante debe **guardarse de forma permanente**, hace falta `expo-file-system` (todavía no instalado) para copiar el archivo a un directorio propio de la app, y una columna nueva en SQLite (p. ej. `receipt_uri` en `initDatabase` + `ALTER TABLE` para bases existentes). Si la foto solo se muestra durante la sesión, con el `uri` temporal alcanza. **Preguntar al usuario qué necesita antes de escribir código.**

## 4. Checklist antes de entregar un cambio

- [ ] Se respetó `DESIGN_SYSTEM.md` (colores y espaciado desde `theme.ts`).
- [ ] Textos, comentarios y mensajes de error en español.
- [ ] Formularios nuevos con `react-hook-form` + `zod`; `AddExpenseModal` sin tocar.
- [ ] `expo-image-picker` con permisos pedidos y caso denegado manejado.
- [ ] Sin librerías nuevas fuera de las autorizadas en este documento.
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores.
