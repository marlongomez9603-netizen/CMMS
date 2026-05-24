# Migración Firebase → Supabase — MaintPro CMMS

## Qué se hizo
- Se reemplazó Firebase Firestore por **Supabase** como base de datos en la nube.
- Se conservó la **misma API del DataStore**, así que `app.js` no cambió su lógica.
- Se corrigió el **bug de borrado de tareas**: ya no se regeneran datos en blanco
  cuando la nube falla; solo se generan cuando Supabase confirma que el estudiante
  no existe todavía.
- Login sigue siendo **por cédula** (sin contraseña), igual que antes.

## Pasos para activar (una sola vez)

1. **Crear proyecto en Supabase** → https://supabase.com (plan gratis sirve).

2. **Crear las tablas:** Dashboard → *SQL Editor* → pegar y ejecutar el contenido de
   [`schema.sql`](./schema.sql).

3. **Copiar las llaves:** Dashboard → *Project Settings → API*. Copiar:
   - `Project URL`
   - `anon` / `public` key

4. **Pegarlas en** [`../js/config.js`](../js/config.js):
   ```js
   const SUPABASE_CONFIG = {
       url:     "https://xxxx.supabase.co",
       anonKey: "eyJhbGci..."
   };
   ```
   > La `anon key` es pública (va en el navegador), no hay problema en publicarla.
   > **Nunca** pongas aquí la `service_role` key.

5. **Subir a GitHub Pages** (commit + push) y probar con una cédula.

## Notas de seguridad
- Con login solo por cédula no hay aislamiento real por estudiante: cualquiera con
  la cédula puede ver/editar esos datos (igual que el sistema actual).
- Las reglas (RLS) en `schema.sql` permiten leer/insertar/actualizar pero **bloquean
  DELETE** sobre `students`, para que los datos no se puedan borrar accidentalmente.
- Si más adelante quieres seguridad real, el siguiente paso es migrar a
  **cédula + contraseña** usando Supabase Auth.
