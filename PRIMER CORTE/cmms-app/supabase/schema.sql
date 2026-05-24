-- ============================================================
--  MaintPro CMMS — Esquema Supabase (Postgres)
--  Migración desde Firebase Firestore.
--  Modelo: un documento JSON por estudiante (clave = cédula),
--  igual que en Firestore, pero con concurrencia segura y SIN
--  regeneración destructiva. Esto elimina el bug de "tareas
--  que se borran".
--  Ejecuta este archivo en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── Tabla principal: estado completo del CMMS por estudiante ──
create table if not exists public.students (
    cedula      text primary key,
    nombre      text,
    data        jsonb not null default '{}'::jsonb,
    updated_at  timestamptz not null default now(),
    created_at  timestamptz not null default now()
);

-- ── Bloqueos de parcial (equivalente a la colección parcial_*_locks) ──
create table if not exists public.parcial_locks (
    cedula      text not null,
    tipo        text not null default 'cmms',   -- 'cmms' | 'teorico'
    nombre      text,
    submit_time text,
    created_at  timestamptz not null default now(),
    primary key (cedula, tipo)
);

-- ── Actualiza updated_at automáticamente en cada UPDATE ──
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
    before update on public.students
    for each row execute function public.set_updated_at();

-- ============================================================
--  Row Level Security
--  Login es solo por cédula (sin Supabase Auth), así que usamos
--  la anon key. Permitimos lectura/escritura anónima pero SIN
--  permitir DELETE (clave para que nunca se borren datos).
--  NOTA: con login-solo-cédula no hay aislamiento criptográfico
--  por alumno; cualquiera con la cédula puede ver/editar esos
--  datos (igual que el sistema actual). Si más adelante quieres
--  aislamiento real, se migra a cédula+contraseña con Auth.
-- ============================================================
alter table public.students       enable row level security;
alter table public.parcial_locks  enable row level security;

-- students: leer, insertar y actualizar permitido a anon; borrar NO.
drop policy if exists students_select on public.students;
create policy students_select on public.students
    for select using (true);

drop policy if exists students_insert on public.students;
create policy students_insert on public.students
    for insert with check (true);

drop policy if exists students_update on public.students;
create policy students_update on public.students
    for update using (true) with check (true);
-- (sin policy de DELETE → los borrados quedan bloqueados por defecto)

-- parcial_locks: el docente crea bloqueos; lectura abierta.
drop policy if exists locks_select on public.parcial_locks;
create policy locks_select on public.parcial_locks
    for select using (true);

drop policy if exists locks_insert on public.parcial_locks;
create policy locks_insert on public.parcial_locks
    for insert with check (true);

drop policy if exists locks_delete on public.parcial_locks;
create policy locks_delete on public.parcial_locks
    for delete using (true);

-- ── Realtime: habilitar para detectar inyección de averías del docente ──
alter publication supabase_realtime add table public.students;
