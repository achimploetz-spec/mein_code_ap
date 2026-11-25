-- Run in Supabase Dashboard → SQL Editor to create or refresh the Bestand table.
-- Rows are private to the authenticated user who created them.
create schema if not exists "Buchungen";
revoke all on schema "Buchungen" from public, anon;
grant usage on schema "Buchungen" to authenticated;

create table if not exists "Buchungen"."Bestand" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  buchungsdatum date not null default current_date,
  bezeichnung text not null,
  kategorie text not null default 'Allgemein',
  menge numeric(12,3) not null default 1 check (menge > 0),
  einzelpreis numeric(12,2) not null check (einzelpreis >= 0),
  gesamtbetrag numeric(15,2) generated always as (round(menge * einzelpreis, 2)) stored,
  waehrung char(3) not null default 'EUR',
  erstellt_am timestamptz not null default now()
);

revoke all on table "Buchungen"."Bestand" from anon, authenticated;
grant select, insert, update, delete on table "Buchungen"."Bestand" to authenticated;
alter table "Buchungen"."Bestand" enable row level security;

drop policy if exists "Bestand lesen eigene Datensaetze" on "Buchungen"."Bestand";
create policy "Bestand lesen eigene Datensaetze"
  on "Buchungen"."Bestand" for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Bestand anlegen eigene Datensaetze" on "Buchungen"."Bestand";
create policy "Bestand anlegen eigene Datensaetze"
  on "Buchungen"."Bestand" for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Bestand aendern eigene Datensaetze" on "Buchungen"."Bestand";
create policy "Bestand aendern eigene Datensaetze"
  on "Buchungen"."Bestand" for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Bestand loeschen eigene Datensaetze" on "Buchungen"."Bestand";
create policy "Bestand loeschen eigene Datensaetze"
  on "Buchungen"."Bestand" for delete to authenticated
  using ((select auth.uid()) = user_id);
