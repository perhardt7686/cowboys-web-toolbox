begin;
create table public.community_power_roles(
 id text primary key check(id ~ '^[a-z][a-z0-9_-]{1,29}$'),name text not null check(char_length(name) between 2 and 40),
 level integer not null unique check(level between 1 and 900),color text not null default 'violet' check(color in ('violet','gold','teal','rose','blue','ember')),
 description text not null default '' check(char_length(description)<=200),capabilities text[] not null default '{}',active boolean not null default true,
 revision integer not null default 1,updated_at timestamptz not null default now(),
 check(cardinality(capabilities)<=16 and capabilities <@ array['posts.edit','posts.note','posts.style','posts.label','topics.organize','topics.pin','topics.close','topics.spotlight','topics.move','topics.split','answers.choose','posts.review','members.honor','members.style','history.undo','ranks.delegate']::text[])
);
create table public.community_power_grants(
 user_id uuid primary key references public.community_members(user_id) on delete cascade,role_id text not null references public.community_power_roles(id),
 scopes text[] not null default '{}' check(cardinality(scopes)<=5 and scopes <@ array['discoveries','help','repair','creative','feedback']::text[]),
 expires_at timestamptz,granted_by uuid not null references public.community_members(user_id),revision integer not null default 1,updated_at timestamptz not null default now()
);
create index community_power_grant_role on public.community_power_grants(role_id);
create table public.community_member_honors(
 user_id uuid primary key references public.community_members(user_id) on delete cascade,title text not null default '' check(char_length(title)<=48),badge text not null default '' check(char_length(badge)<=32),
 accent text not null default 'violet' check(accent in ('violet','gold','teal','rose','blue','ember')),aura text not null default 'plain' check(aura in ('plain','halo','sparkle')),
 rank_label text not null default '' check(char_length(rank_label)<=40),rank_color text not null default 'violet' check(rank_color in ('violet','gold','teal','rose','blue','ember')),rank_expires_at timestamptz,
 member_opt_out boolean not null default false,member_active boolean not null default true,power_revision bigint not null default 0,updated_at timestamptz not null default now()
);
create table public.community_power_history(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references public.community_members(user_id),actor_name text not null,
 kind text not null,target_kind text not null check(target_kind in ('thread','reply','member','move')),target_id uuid not null,capability text not null,
 before_data jsonb not null,after_data jsonb not null,reason text not null check(char_length(reason) between 3 and 240),created_at timestamptz not null default now(),undone_at timestamptz,undone_by uuid references public.community_members(user_id),
 check(octet_length(before_data::text)<=20000 and octet_length(after_data::text)<=20000)
);
create index community_power_history_actor on public.community_power_history(actor_id,created_at desc);
create index community_power_history_target on public.community_power_history(target_id,created_at desc);
-- No browser can change ranks, grants, history or public honors directly.
alter table public.community_power_roles enable row level security;
alter table public.community_power_grants enable row level security;
alter table public.community_power_history enable row level security;
alter table public.community_member_honors enable row level security;
revoke all on public.community_power_roles,public.community_power_grants,public.community_power_history,public.community_member_honors from public,anon,authenticated;
grant all on public.community_power_roles,public.community_power_grants,public.community_power_history,public.community_member_honors to service_role;
grant select on public.community_member_honors to anon,authenticated;
create policy public_chosen_honors on public.community_member_honors for select to anon,authenticated using(
 not member_opt_out and member_active and (
 exists(select 1 from public.community_profiles p where p.user_id=community_member_honors.user_id and p.published and p.account_active)
 or exists(select 1 from public.community_threads t where t.author_id=community_member_honors.user_id and t.status='published')
 or exists(select 1 from public.community_replies r join public.community_threads t on t.id=r.thread_id where r.author_id=community_member_honors.user_id and r.status='published' and t.status='published')
 ));
-- Members can inspect their own presentation choices even when hidden.
create policy own_honors on public.community_member_honors for select to authenticated using(user_id=(select auth.uid()));
alter table public.community_threads add column enhancements jsonb not null default '{}' check(jsonb_typeof(enhancements)='object' and octet_length(enhancements::text)<=4096),add column edited_at timestamptz,add column power_revision bigint not null default 0;
alter table public.community_replies add column enhancements jsonb not null default '{}' check(jsonb_typeof(enhancements)='object' and octet_length(enhancements::text)<=4096),add column power_revision bigint not null default 0;
create function community_private.bump_power_revision() returns trigger language plpgsql security invoker set search_path='' as $$begin new.power_revision:=old.power_revision+1;return new;end;$$;
create trigger community_thread_power_revision before update on public.community_threads for each row execute function community_private.bump_power_revision();
create trigger community_reply_power_revision before update on public.community_replies for each row execute function community_private.bump_power_revision();
create trigger community_honor_power_revision before update on public.community_member_honors for each row execute function community_private.bump_power_revision();
create function community_private.sync_power_optout() returns trigger language plpgsql security invoker set search_path='' as $$begin update public.community_member_honors set member_opt_out=coalesce((new.details->>'accept_flair')::boolean,true)=false where user_id=new.user_id;return new;end;$$;
create function community_private.sync_power_memberstatus() returns trigger language plpgsql security invoker set search_path='' as $$begin update public.community_member_honors set member_active=new.status='approved' where user_id=new.user_id;return new;end;$$;
create trigger community_power_memberstatus after update of status on public.community_members for each row execute function community_private.sync_power_memberstatus();
create trigger community_power_optout after insert or update on public.community_profile_preferences for each row execute function community_private.sync_power_optout();

insert into public.community_power_roles(id,name,level,color,description,capabilities) values
 ('guide','Guide',100,'teal','Welcome people and recognize useful contributions.',array['posts.note','posts.label','members.honor']),
 ('curator','Curator',300,'violet','Organize good finds and make them shine.',array['posts.note','posts.label','posts.style','topics.organize','topics.pin','topics.spotlight','answers.choose','members.honor','members.style']),
 ('moderator','Moderator',500,'blue','Care for discussions and preserve their context.',array['posts.edit','posts.note','posts.style','posts.label','topics.organize','topics.pin','topics.close','topics.spotlight','topics.move','topics.split','answers.choose','posts.review','members.honor','members.style','history.undo']),
 ('steward','Steward',750,'gold','All listed powers, including carefully bounded delegation.',array['posts.edit','posts.note','posts.style','posts.label','topics.organize','topics.pin','topics.close','topics.spotlight','topics.move','topics.split','answers.choose','posts.review','members.honor','members.style','history.undo','ranks.delegate']);
-- No rank is assigned to any member by this migration.
create function public.community_power_state(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare m public.community_members%rowtype;g public.community_power_grants%rowtype;r public.community_power_roles%rowtype;caps text[]:=array['posts.edit','posts.note','posts.style','posts.label','topics.organize','topics.pin','topics.close','topics.spotlight','topics.move','topics.split','answers.choose','posts.review','members.honor','members.style','history.undo','ranks.delegate'];
begin
 select * into m from public.community_members where user_id=p_actor for share;
 if m.user_id is null or m.status<>'approved' then return jsonb_build_object('owner',false,'rank',jsonb_build_object('id','member','name','Member','level',0,'color','violet','capabilities','[]'::jsonb),'scopes','[]'::jsonb,'expires_at',null);end if;
 if m.role='owner' then return jsonb_build_object('owner',true,'rank',jsonb_build_object('id','owner','name','Cowboy · Owner','level',1000,'color','gold','capabilities',to_jsonb(caps)),'scopes','[]'::jsonb,'expires_at',null);end if;
 select * into g from public.community_power_grants where user_id=p_actor for share;
 if g.user_id is not null and (g.expires_at is null or g.expires_at>statement_timestamp()) then select * into r from public.community_power_roles where id=g.role_id and active for share;end if;
 if r.id is null then return jsonb_build_object('owner',false,'rank',jsonb_build_object('id','member','name','Member','level',0,'color','violet','capabilities','[]'::jsonb),'scopes','[]'::jsonb,'expires_at',g.expires_at);end if;
 return jsonb_build_object('owner',false,'rank',to_jsonb(r),'scopes',to_jsonb(g.scopes),'expires_at',g.expires_at);
end;$$;
create function community_private.require_power(p_actor uuid,p_cap text,p_author uuid default null,p_category text default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb:=public.community_power_state(p_actor);other_state jsonb;
begin
 if not (s->'rank'->'capabilities' ? p_cap) then raise exception 'Power unavailable' using errcode='42501';end if;
 if p_cap not in ('ranks.delegate','history.undo') and jsonb_array_length(s->'scopes')>0 and (p_category is null or not(s->'scopes' ? p_category)) then raise exception 'Board scope unavailable' using errcode='42501';end if;
 if p_author is not null and p_author<>p_actor then other_state:=public.community_power_state(p_author);if (other_state->'rank'->>'level')::integer>=(s->'rank'->>'level')::integer then raise exception 'Higher rank protected' using errcode='42501';end if;end if;
 return s;
end;$$;
create function public.community_power_save_rank(p_actor uuid,p_rank jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb:=public.community_power_state(p_actor);r public.community_power_roles%rowtype;rid text:=nullif(p_rank->>'id','');caps text[];expected integer:=coalesce((p_rank->>'revision')::integer,0);
begin
 if not(s->>'owner')::boolean then raise exception 'Owner only' using errcode='42501';end if;
 select coalesce(array_agg(distinct value),'{}') into caps from jsonb_array_elements_text(p_rank->'capabilities');
 if rid is null then if (select count(*) from public.community_power_roles)>=24 then raise exception 'Rank limit' using errcode='23514';end if;rid:='custom-'||substr(replace(gen_random_uuid()::text,'-',''),1,12);
 insert into public.community_power_roles(id,name,level,color,description,capabilities,active) values(rid,p_rank->>'name',(p_rank->>'level')::integer,p_rank->>'color',p_rank->>'description',caps,(p_rank->>'active')::boolean) returning * into r;
 else select * into r from public.community_power_roles where id=rid for update;if r.id is null then raise exception 'Rank unavailable' using errcode='P0002';end if;if r.revision<>expected then raise exception 'Rank changed' using errcode='40001';end if;
 update public.community_power_roles set name=p_rank->>'name',level=(p_rank->>'level')::integer,color=p_rank->>'color',description=p_rank->>'description',capabilities=caps,active=(p_rank->>'active')::boolean,revision=revision+1,updated_at=now() where id=rid returning * into r;end if;
 update public.community_member_honors h set rank_label=case when r.active then r.name else '' end,rank_color=r.color,updated_at=now() from public.community_power_grants g where g.user_id=h.user_id and g.role_id=rid;
 insert into public.community_audit(actor_id,action,details) values(p_actor,'powers.rank_saved',jsonb_build_object('rank_id',rid,'revision',r.revision));return to_jsonb(r);
end;$$;
create function public.community_power_assign(p_actor uuid,p_user uuid,p_role text,p_scopes text[],p_hours integer,p_expected integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb;target jsonb;g public.community_power_grants%rowtype;r public.community_power_roles%rowtype;sc text[];ending timestamptz;optout boolean;
begin
 s:=community_private.require_power(p_actor,'ranks.delegate');target:=public.community_power_state(p_user);
 if exists(select 1 from public.community_members where user_id=p_user and role='owner') then raise exception 'Owner rank is fixed' using errcode='42501';end if;
 if not exists(select 1 from public.community_members where user_id=p_user and status='approved') then raise exception 'Member unavailable' using errcode='P0002';end if;
 if not(s->>'owner')::boolean and (p_user=p_actor or (target->'rank'->>'level')::integer>=(s->'rank'->>'level')::integer) then raise exception 'Rank protected' using errcode='42501';end if;
 select * into g from public.community_power_grants where user_id=p_user for update;
 if coalesce(g.revision,0)<>p_expected then raise exception 'Grant changed' using errcode='40001';end if;
 if p_role is null then delete from public.community_power_grants where user_id=p_user;update public.community_member_honors set rank_label='',rank_expires_at=null where user_id=p_user;
 else
 select * into r from public.community_power_roles where id=p_role and active for share;if r.id is null then raise exception 'Rank unavailable' using errcode='P0002';end if;
 if not(s->>'owner')::boolean and (r.level>=(s->'rank'->>'level')::integer or not(to_jsonb(r.capabilities)<@(s->'rank'->'capabilities'))) then raise exception 'Cannot grant greater powers' using errcode='42501';end if;
 sc:=coalesce(p_scopes,'{}'::text[]);
 if cardinality(sc)>5 or not(sc<@array['discoveries','help','repair','creative','feedback']::text[]) or p_hours not between 0 and 2160 then raise exception 'Invalid grant' using errcode='23514';end if;
 if jsonb_array_length(s->'scopes')>0 and (cardinality(sc)=0 or not(to_jsonb(sc)<@(s->'scopes'))) then raise exception 'Cannot broaden scope' using errcode='42501';end if;
 ending:=case when p_hours=0 then null else statement_timestamp()+make_interval(hours=>p_hours) end;
 if s->>'expires_at' is not null and (ending is null or ending>(s->>'expires_at')::timestamptz) then raise exception 'Cannot extend own expiry' using errcode='42501';end if;
 insert into public.community_power_grants(user_id,role_id,scopes,expires_at,granted_by) values(p_user,p_role,sc,ending,p_actor) on conflict(user_id) do update set role_id=excluded.role_id,scopes=excluded.scopes,expires_at=excluded.expires_at,granted_by=p_actor,revision=public.community_power_grants.revision+1,updated_at=now();
 select coalesce((details->>'accept_flair')::boolean,true)=false into optout from public.community_profile_preferences where user_id=p_user;
 insert into public.community_member_honors(user_id,rank_label,rank_color,rank_expires_at,member_opt_out) values(p_user,r.name,r.color,ending,coalesce(optout,false)) on conflict(user_id) do update set rank_label=excluded.rank_label,rank_color=excluded.rank_color,rank_expires_at=ending,updated_at=now();
 end if;
 insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'powers.rank_assigned',p_user,jsonb_build_object('rank_id',p_role,'previous_rank',g.role_id));return public.community_power_state(p_user);
end;$$;
create function community_private.power_topic_counts(p_tid uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.community_threads t set visible_reply_count=(select count(*) from public.community_replies where thread_id=p_tid and status='published'),human_reply_count=(select count(*) from public.community_replies where thread_id=p_tid and status='published' and author_kind='member'),last_reply_at=(select max(created_at) from public.community_replies where thread_id=p_tid and status='published'),activity_at=coalesce((select max(created_at) from public.community_replies where thread_id=p_tid and status='published'),t.created_at),accepted_reply_id=case when exists(select 1 from public.community_replies where id=t.accepted_reply_id and thread_id=p_tid and status='published') then accepted_reply_id else null end where id=p_tid;
 update public.community_badges b set active=false where b.thread_id=p_tid and b.badge='Helpful Hand' and not exists(select 1 from public.community_threads where id=p_tid and accepted_reply_id is not null);
end;$$;
create function community_private.power_answer_badge(p_tid uuid) returns void language plpgsql security invoker set search_path='' as $$
declare u uuid;
begin
 update public.community_badges set active=false where thread_id=p_tid and badge='Helpful Hand';
 select r.author_id into u from public.community_threads t join public.community_replies r on r.id=t.accepted_reply_id where t.id=p_tid and r.thread_id=t.id and r.status='published' and r.author_kind='member' and r.author_id is distinct from t.author_id;
 if u is not null then insert into public.community_badges(user_id,badge,thread_id,reason) values(u,'Helpful Hand',p_tid,'An answer was recognized in a tool request.') on conflict(user_id,badge,thread_id) do update set active=true;end if;
end;$$;
create function public.community_power_apply(p_actor uuid,p_change jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare k text:=p_change->>'kind';target_kind text:=p_change->>'targetKind';tid uuid:=(p_change->>'targetId')::uuid;d jsonb:=p_change->'data';why text:=p_change->>'reason';expected bigint:=coalesce((p_change->>'revision')::bigint,0);cap text;
 t public.community_threads%rowtype;r public.community_replies%rowtype;h public.community_member_honors%rowtype;actor public.community_members%rowtype;before_json jsonb;after_json jsonb;enh jsonb;result_id uuid;dest public.community_threads%rowtype;ids uuid[];item public.community_replies%rowtype;created boolean:=false;new_id uuid;old_answer uuid;optout boolean;
begin
 cap:=case k when 'edit' then 'posts.edit' when 'note' then 'posts.note' when 'style' then 'posts.style' when 'label' then 'posts.label' when 'organize' then 'topics.organize' when 'pin' then 'topics.pin' when 'close' then 'topics.close' when 'spotlight' then 'topics.spotlight' when 'answer' then 'answers.choose' when 'review' then 'posts.review' when 'honor' then 'members.honor' when 'member_style' then 'members.style' when 'move' then 'topics.move' when 'split' then 'topics.split' end;
 if cap is null or char_length(why) not between 3 and 240 then raise exception 'Invalid power' using errcode='23514';end if;
 select * into actor from public.community_members where user_id=p_actor;
 if target_kind='member' then
  if k not in ('honor','member_style') then raise exception 'Invalid member power' using errcode='23514';end if;
  perform community_private.require_power(p_actor,cap,tid,null);
  if not exists(select 1 from public.community_members where user_id=tid and status='approved') then raise exception 'Member unavailable' using errcode='P0002';end if;
  select * into h from public.community_member_honors where user_id=tid for update;
  if coalesce(h.power_revision,0)<>expected then raise exception 'Member presentation changed' using errcode='40001';end if;
  select coalesce((details->>'accept_flair')::boolean,true)=false into optout from public.community_profile_preferences where user_id=tid;
  insert into public.community_member_honors(user_id,member_opt_out) values(tid,coalesce(optout,false)) on conflict(user_id) do nothing;
  select * into h from public.community_member_honors where user_id=tid for update;before_json:=to_jsonb(h);
  if k='honor' then update public.community_member_honors set title=d->>'title',badge=d->>'badge',updated_at=now() where user_id=tid returning * into h;
  else update public.community_member_honors set accent=d->>'accent',aura=d->>'aura',updated_at=now() where user_id=tid returning * into h;end if;
  after_json:=to_jsonb(h);
 else
  if target_kind='reply' then select * into r from public.community_replies where id=tid and status='published' for update;if r.id is null then raise exception 'Reply unavailable' using errcode='P0002';end if;select * into t from public.community_threads where id=r.thread_id and status='published' for update;
  elsif target_kind='thread' then select * into t from public.community_threads where id=tid and status='published' for update;
  else raise exception 'Invalid target' using errcode='23514';end if;
  if t.id is null then raise exception 'Topic unavailable' using errcode='P0002';end if;
  perform community_private.require_power(p_actor,cap,case when target_kind='reply' then r.author_id else t.author_id end,t.category);
  if (case when target_kind='reply' then r.power_revision else t.power_revision end)<>expected then raise exception 'Post changed' using errcode='40001';end if;
  if k in ('move','split') then
   if target_kind<>'thread' then raise exception 'Choose a source topic' using errcode='23514';end if;
   select array_agg(distinct value::uuid) into ids from jsonb_array_elements_text(d->'replyIds');
   if cardinality(ids) not between 1 and 20 then raise exception 'Choose replies' using errcode='23514';end if;
   if (select count(*) from public.community_replies where id=any(ids) and thread_id=t.id and status='published')<>cardinality(ids) then raise exception 'Replies changed' using errcode='40001';end if;
   for item in select * from public.community_replies where id=any(ids) order by id for update loop perform community_private.require_power(p_actor,cap,item.author_id,t.category);end loop;
   old_answer:=t.accepted_reply_id;
   if k='split' then
    perform community_private.require_power(p_actor,cap,null,d->>'category');
    insert into public.community_threads(author_id,author_name,title,body,category,enhancements) values(p_actor,actor.display_name,d->>'title','This discussion was split into its own topic. Original reply authors and times are preserved.',d->>'category',jsonb_build_object('split_from',t.id,'split_by',actor.display_name)) returning * into dest;created:=true;
   else select * into dest from public.community_threads where id=(d->>'toThreadId')::uuid and status='published' for update;
    if dest.id is null or dest.id=t.id or dest.locked then raise exception 'Destination unavailable' using errcode='23514';end if;perform community_private.require_power(p_actor,cap,dest.author_id,dest.category);
   end if;
   before_json:=jsonb_build_object('from',t.id,'to',dest.id,'replyIds',to_jsonb(ids),'created',created,'sourceAccepted',old_answer);
   update public.community_replies set thread_id=dest.id where id=any(ids);
   perform community_private.power_topic_counts(t.id);perform community_private.power_topic_counts(dest.id);perform community_private.power_answer_badge(t.id);
   after_json:=jsonb_build_object('replies',(select jsonb_agg(jsonb_build_object('id',id,'power_revision',power_revision)) from public.community_replies where id=any(ids)),'source_revision',(select power_revision from public.community_threads where id=t.id),'target_revision',(select power_revision from public.community_threads where id=dest.id));
   target_kind:='move';new_id:=dest.id;
  else
   if target_kind='reply' and k not in ('edit','note','style','label','review') then raise exception 'Topic power requires a topic' using errcode='23514';end if;
   before_json:=case when target_kind='reply' then jsonb_build_object('body',r.body,'status',r.status,'enhancements',r.enhancements,'edited_at',r.edited_at,'power_revision',r.power_revision) else jsonb_build_object('title',t.title,'body',t.body,'category',t.category,'status',t.status,'pinned',t.pinned,'locked',t.locked,'featured',t.featured,'accepted_reply_id',t.accepted_reply_id,'enhancements',t.enhancements,'edited_at',t.edited_at,'power_revision',t.power_revision) end;
   enh:=case when target_kind='reply' then r.enhancements else t.enhancements end;
   if k='note' then enh:=enh||jsonb_build_object('note',d->>'note','note_by',actor.display_name,'note_at',now());
   elsif k='style' then enh:=enh||jsonb_build_object('accent',d->>'accent','frame',d->>'frame');
   elsif k='label' then enh:=enh||jsonb_build_object('label',d->>'label');
   elsif k='edit' then enh:=enh||jsonb_build_object('edited_by',actor.display_name);
   elsif k='spotlight' then enh:=enh||jsonb_build_object('featured_by',actor.display_name);end if;
   if target_kind='reply' then
    update public.community_replies set body=case when k='edit' then d->>'body' else body end,status=case when k='review' then 'held' else status end,enhancements=enh,edited_at=case when k='edit' then now() else edited_at end where id=tid returning * into r;
    after_json:=to_jsonb(r);
   else
    if k='organize' then perform community_private.require_power(p_actor,cap,t.author_id,d->>'category');end if;
    if k='answer' and (t.post_kind<>'request' or (d->>'replyId' is not null and not exists(select 1 from public.community_replies where id=(d->>'replyId')::uuid and thread_id=t.id and status='published' and author_kind='member' and author_id is distinct from t.author_id))) then raise exception 'Choose an eligible answer' using errcode='23514';end if;
    update public.community_threads set body=case when k='edit' then d->>'body' else body end,title=case when k in ('edit','organize') and d ? 'title' then d->>'title' else title end,category=case when k='organize' then d->>'category' else category end,status=case when k='review' then 'held' else status end,pinned=case when k='pin' then (d->>'enabled')::boolean else pinned end,locked=case when k='close' then (d->>'enabled')::boolean else locked end,featured=case when k='spotlight' then (d->>'enabled')::boolean else featured end,accepted_reply_id=case when k='answer' then (d->>'replyId')::uuid else accepted_reply_id end,enhancements=enh,edited_at=case when k='edit' then now() else edited_at end where id=tid returning * into t;
    after_json:=jsonb_build_object('title',t.title,'body',t.body,'category',t.category,'status',t.status,'pinned',t.pinned,'locked',t.locked,'featured',t.featured,'accepted_reply_id',t.accepted_reply_id,'enhancements',t.enhancements,'edited_at',t.edited_at,'power_revision',t.power_revision);
    if k='answer' then perform community_private.power_answer_badge(t.id);end if;
   end if;
  end if;
 end if;
 insert into public.community_power_history(actor_id,actor_name,kind,target_kind,target_id,capability,before_data,after_data,reason) values(p_actor,actor.display_name,k,target_kind,tid,cap,before_json,after_json,why) returning id into result_id;
 insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'powers.'||k,tid,jsonb_build_object('receipt',result_id));
 return jsonb_build_object('receipt',result_id,'target',after_json,'toThreadId',new_id,'held',k='review');
end;$$;
create function public.community_power_undo(p_actor uuid,p_receipt uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.community_power_history%rowtype;s jsonb;before_json jsonb;t public.community_threads%rowtype;r public.community_replies%rowtype;h public.community_member_honors%rowtype;dest public.community_threads%rowtype;entry jsonb;source_id uuid;dest_id uuid;
begin
 s:=community_private.require_power(p_actor,'history.undo');select * into e from public.community_power_history where id=p_receipt for update;
 if e.id is null then raise exception 'History unavailable' using errcode='P0002';end if;
 if e.kind='review' and not(s->>'owner')::boolean then raise exception 'Owner release required' using errcode='42501';end if;
 if e.undone_at is not null then raise exception 'Already undone' using errcode='40001';end if;
 if not(s->>'owner')::boolean and e.actor_id<>p_actor then raise exception 'Own actions only' using errcode='42501';end if;before_json:=e.before_data;
 if e.target_kind='member' then
  perform community_private.require_power(p_actor,e.capability,e.target_id,null);select * into h from public.community_member_honors where user_id=e.target_id for update;
  if h.power_revision<>(e.after_data->>'power_revision')::bigint then raise exception 'Presentation changed' using errcode='40001';end if;
  update public.community_member_honors set title=before_json->>'title',badge=before_json->>'badge',accent=before_json->>'accent',aura=before_json->>'aura',updated_at=now() where user_id=e.target_id;
 elsif e.target_kind='move' then
  source_id:=(before_json->>'from')::uuid;dest_id:=(before_json->>'to')::uuid;
  select * into t from public.community_threads where id=source_id for update;select * into dest from public.community_threads where id=dest_id for update;
  perform community_private.require_power(p_actor,e.capability,t.author_id,t.category);perform community_private.require_power(p_actor,e.capability,dest.author_id,dest.category);
  if t.status<>'published' or dest.status<>'published' or t.power_revision<>(e.after_data->>'source_revision')::bigint or dest.power_revision<>(e.after_data->>'target_revision')::bigint then raise exception 'Conversations changed' using errcode='40001';end if;
  for entry in select value from jsonb_array_elements(e.after_data->'replies') loop
   select * into r from public.community_replies where id=(entry->>'id')::uuid for update;
   if r.thread_id<>dest_id or r.power_revision<>(entry->>'power_revision')::bigint then raise exception 'Reply changed' using errcode='40001';end if;
   perform community_private.require_power(p_actor,e.capability,r.author_id,dest.category);
  end loop;
  update public.community_replies set thread_id=source_id where id in (select (value->>'id')::uuid from jsonb_array_elements(e.after_data->'replies'));
  perform community_private.power_topic_counts(source_id);perform community_private.power_topic_counts(dest_id);
  if before_json->>'sourceAccepted' is not null then update public.community_threads set accepted_reply_id=(before_json->>'sourceAccepted')::uuid where id=source_id;perform community_private.power_answer_badge(source_id);end if;
  if (before_json->>'created')::boolean then update public.community_threads set status='hidden' where id=dest_id;end if;
 else
  if e.target_kind='thread' then select * into t from public.community_threads where id=e.target_id for update;perform community_private.require_power(p_actor,e.capability,t.author_id,t.category);
   if e.kind='organize' then perform community_private.require_power(p_actor,e.capability,t.author_id,before_json->>'category');end if;
   if t.power_revision<>(e.after_data->>'power_revision')::bigint then raise exception 'Topic changed' using errcode='40001';end if;
   update public.community_threads set title=before_json->>'title',body=before_json->>'body',category=before_json->>'category',status=before_json->>'status',pinned=(before_json->>'pinned')::boolean,locked=(before_json->>'locked')::boolean,featured=(before_json->>'featured')::boolean,accepted_reply_id=(before_json->>'accepted_reply_id')::uuid,enhancements=before_json->'enhancements',edited_at=(before_json->>'edited_at')::timestamptz where id=e.target_id;
   perform community_private.power_answer_badge(e.target_id);
  else select * into r from public.community_replies where id=e.target_id for update;select * into t from public.community_threads where id=r.thread_id for share;perform community_private.require_power(p_actor,e.capability,r.author_id,t.category);
   if r.power_revision<>(e.after_data->>'power_revision')::bigint then raise exception 'Reply changed' using errcode='40001';end if;
   update public.community_replies set body=before_json->>'body',status=before_json->>'status',enhancements=before_json->'enhancements',edited_at=(before_json->>'edited_at')::timestamptz where id=e.target_id;
  end if;
 end if;
 update public.community_power_history set undone_at=now(),undone_by=p_actor where id=e.id;
 insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'powers.undo',e.target_id,jsonb_build_object('receipt',e.id));
 return jsonb_build_object('undone',true,'receipt',e.id);
end;$$;
create function public.community_power_console(p_actor uuid,p_search text default '',p_offset integer default 0) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb:=public.community_power_state(p_actor);members jsonb;roles jsonb;history jsonb;total integer;people boolean;
begin
 if jsonb_array_length(s->'rank'->'capabilities')=0 then raise exception 'No staff powers' using errcode='42501';end if;
 people:=(s->>'owner')::boolean or s->'rank'->'capabilities' ?| array['members.honor','members.style','ranks.delegate'];
 select coalesce(jsonb_agg(to_jsonb(r) order by level),'[]') into roles from public.community_power_roles r where (s->>'owner')::boolean or (r.active and r.level<(s->'rank'->>'level')::integer and to_jsonb(r.capabilities)<@(s->'rank'->'capabilities'));
 if people then
 select count(*) into total from public.community_members where status='approved' and position(lower(left(p_search,80)) in lower(display_name))>0;
 select coalesce(jsonb_agg(x),'[]') into members from (select m.user_id,m.display_name,m.role,public.community_power_state(m.user_id)->'rank' as rank,g.role_id,g.scopes,g.expires_at,coalesce(g.revision,0) as grant_revision,coalesce(h.power_revision,0) as honor_revision,coalesce(to_jsonb(h),'{}') as honors from public.community_members m left join public.community_power_grants g on g.user_id=m.user_id left join public.community_member_honors h on h.user_id=m.user_id where m.status='approved' and position(lower(left(p_search,80)) in lower(m.display_name))>0 order by m.display_name,m.user_id limit 25 offset greatest(0,least(p_offset,5000)))x;
 else members:='[]';total:=0;end if;
 select coalesce(jsonb_agg(x),'[]') into history from (select id,actor_name,kind,target_kind,target_id,capability,reason,created_at,undone_at,(s->'rank'->'capabilities' ? 'history.undo' and s->'rank'->'capabilities' ? capability and (actor_id=p_actor or (s->>'owner')::boolean) and (kind<>'review' or (s->>'owner')::boolean)) as can_undo from public.community_power_history where actor_id=p_actor or (s->>'owner')::boolean order by created_at desc,id desc limit 40)x;
 return jsonb_build_object('state',s,'roles',roles,'members',members,'memberTotal',total,'offset',p_offset,'history',history);
end;$$;
create function public.community_power_compare(p_actor uuid,p_receipt uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s jsonb:=public.community_power_state(p_actor);e public.community_power_history%rowtype;
begin
 if not(s->>'owner')::boolean then raise exception 'Owner comparison only' using errcode='42501';end if;
 select * into e from public.community_power_history where id=p_receipt;if e.id is null then raise exception 'History unavailable' using errcode='P0002';end if;
 return jsonb_build_object('before',e.before_data,'after',e.after_data,'kind',e.kind,'reason',e.reason,'actor',e.actor_name);
end;$$;
create or replace function public.community_edit_reply(p_actor uuid,p_reply uuid,p_body text,p_status text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare target public.community_replies%rowtype;who public.community_members%rowtype;
begin
  select * into who from public.community_members where user_id=p_actor;
  if who.status is distinct from 'approved' then raise exception 'Posting access unavailable';end if;
  select * into target from public.community_replies where id=p_reply for update;
  if target.id is null or target.status<>'published' or target.author_kind<>'member' or (target.author_id is distinct from p_actor and who.role<>'owner') then raise exception 'Reply unavailable';end if;
  if not exists(select 1 from public.community_threads where id=target.thread_id and status='published' and not locked) then raise exception 'Conversation closed';end if;
  if char_length(p_body) not between 2 and 6000 or p_status not in ('published','held') then raise exception 'Invalid reply';end if;
  update public.community_replies set body=p_body,status=p_status,edited_at=now(),enhancements=case when target.author_id=p_actor then enhancements-'edited_by' else enhancements||jsonb_build_object('edited_by',who.display_name) end where id=p_reply returning * into target;
  insert into public.community_audit(actor_id,action,subject_id) values(p_actor,'reply.edited',p_reply);
  return to_jsonb(target);
end;$$;

-- Invoker functions remain service-only, including every private helper.
revoke all on function public.community_power_state(uuid),public.community_power_save_rank(uuid,jsonb),public.community_power_assign(uuid,uuid,text,text[],integer,integer),public.community_power_apply(uuid,jsonb),public.community_power_undo(uuid,uuid),public.community_power_console(uuid,text,integer),public.community_power_compare(uuid,uuid) from public,anon,authenticated;
grant execute on function public.community_power_state(uuid),public.community_power_save_rank(uuid,jsonb),public.community_power_assign(uuid,uuid,text,text[],integer,integer),public.community_power_apply(uuid,jsonb),public.community_power_undo(uuid,uuid),public.community_power_console(uuid,text,integer),public.community_power_compare(uuid,uuid) to service_role;
revoke all on function community_private.bump_power_revision(),community_private.sync_power_optout(),community_private.sync_power_memberstatus(),community_private.require_power(uuid,text,uuid,text),community_private.power_topic_counts(uuid),community_private.power_answer_badge(uuid) from public,anon,authenticated;
grant execute on function community_private.bump_power_revision(),community_private.sync_power_optout(),community_private.sync_power_memberstatus(),community_private.require_power(uuid,text,uuid,text),community_private.power_topic_counts(uuid),community_private.power_answer_badge(uuid) to service_role;
commit;
