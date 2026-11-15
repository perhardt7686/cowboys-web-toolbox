begin;

insert into community_private.avatar_reward_cosmetic(id,slot,achievement_id,name) values
  ('trail-husky','companion','quest-first-clue','Trail Husky'),
  ('lantern-raccoon','companion','hotrod-first-drag','Lantern Raccoon');

create table community_private.avatar_pet (
  member_id uuid not null references public.community_members(user_id) on delete cascade,
  cosmetic_id text not null references community_private.avatar_reward_cosmetic(id),
  name text not null check (char_length(name) between 1 and 30 and name !~ '[[:cntrl:]]'),
  bond integer not null default 0 check (bond between 0 and 12),
  revision bigint not null default 1 check (revision >= 1),
  primary key (member_id,cosmetic_id)
);
alter table community_private.avatar_pet enable row level security;
revoke all on community_private.avatar_pet from public,anon,authenticated;

create function community_private.avatar_pet_state()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
begin
  return (select coalesce(jsonb_agg(to_jsonb(pet)-'member_id' order by cosmetic_id),'[]'::jsonb)
    from community_private.avatar_pet pet where member_id=viewer);
end;
$$;

create function community_private.avatar_pet_action(
  p_cosmetic text, p_action text, p_revision bigint, p_name text
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  pet community_private.avatar_pet%rowtype;
  pet_name text;
  new_name text := btrim(p_name);
begin
  if p_action is null or p_action not in ('adopt','pet','play','trick','rename') then
    raise exception 'Choose a pet action' using errcode='22023';
  end if;
  select c.name into pet_name from community_private.avatar_reward_cosmetic c
    join community_private.avatar_reward_earned e on e.achievement_id=c.achievement_id
    where c.id=p_cosmetic and c.slot='companion' and e.member_id=viewer;
  if not found then
    raise exception 'Earn this pet before adopting it' using errcode='42501';
  end if;
  if p_action='adopt' then
    insert into community_private.avatar_pet(member_id,cosmetic_id,name)
      values (viewer,p_cosmetic,left(pet_name,30)) on conflict do nothing;
    select * into pet from community_private.avatar_pet where member_id=viewer and cosmetic_id=p_cosmetic;
  else
    select * into pet from community_private.avatar_pet where member_id=viewer and cosmetic_id=p_cosmetic for update;
    if not found then
      raise exception 'Adopt this pet first' using errcode='22023';
    end if;
    if pet.revision is distinct from p_revision then
      raise exception 'Your pet has a newer update. Current progress was reloaded.' using errcode='40001';
    end if;
    if p_action='trick' and pet.bond<6 then
      raise exception 'Build your bond to teach this trick' using errcode='22023';
    end if;
    if p_action='rename' and (new_name is null or char_length(new_name) not between 1 and 30 or new_name ~ '[[:cntrl:]]') then
      raise exception 'Enter a pet name from 1 to 30 characters' using errcode='22023';
    end if;
    update community_private.avatar_pet
      set name=case when p_action='rename' then new_name else name end,
        bond=least(12,bond+case p_action when 'pet' then 1 when 'play' then 2 when 'trick' then 1 else 0 end),
        revision=revision+1
      where member_id=viewer and cosmetic_id=p_cosmetic returning * into pet;
  end if;
  return to_jsonb(pet)-'member_id';
end;
$$;

-- The bound SQL bodies reach the narrow private helpers without granting clients
-- usage of the private schema or direct access to its tables.
create function public.community_avatar_pet_state()
returns jsonb language sql stable security invoker set search_path=''
return community_private.avatar_pet_state();

create function public.community_avatar_pet_action(
  p_cosmetic text, p_action text, p_revision bigint default null, p_name text default null
)
returns jsonb language sql security invoker set search_path=''
return community_private.avatar_pet_action(p_cosmetic,p_action,p_revision,p_name);

revoke all on function community_private.avatar_pet_state(),
  community_private.avatar_pet_action(text,text,bigint,text),
  public.community_avatar_pet_state(), public.community_avatar_pet_action(text,text,bigint,text)
  from public,anon,authenticated;
grant execute on function community_private.avatar_pet_state(),
  community_private.avatar_pet_action(text,text,bigint,text),
  public.community_avatar_pet_state(), public.community_avatar_pet_action(text,text,bigint,text)
  to authenticated;

commit;
