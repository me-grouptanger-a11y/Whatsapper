-- Etape 1 : Créer la table des réponses
create table
  public.responses (
    id uuid not null default gen_random_uuid (),
    category text not null,
    title text not null,
    content text not null,
    keywords jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone not null default now(),
    constraint responses_pkey primary key (id)
  ) tablespace pg_default;

-- Etape 2 : Configurer la Sécurité (RLS - Row Level Security)
-- On active le RLS sur la table
alter table public.responses enable row level security;

-- 2.A : Lecture Publique (Les agents peuvent lire les réponses sans se connecter)
create policy "Allow public read access" 
  on public.responses 
  for select 
  using (true);

-- 2.B : Insertion, Modification et Suppression réservées aux utilisateurs connectés (Admin)
create policy "Allow authenticated insert" 
  on public.responses 
  for insert 
  to authenticated 
  with check (true);

create policy "Allow authenticated update" 
  on public.responses 
  for update 
  to authenticated 
  using (true);

create policy "Allow authenticated delete" 
  on public.responses 
  for delete 
  to authenticated 
  using (true);
