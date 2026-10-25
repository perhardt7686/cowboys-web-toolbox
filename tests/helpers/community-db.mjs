import {readFile,readdir} from 'node:fs/promises';
export function adapter(pg){
  const ident=value=>{if(!/^[a-z_]+$/u.test(value))throw new Error('Unsafe identifier');return '"'+value+'"'};
  return {
    rpc:async(name,args)=>{
      try{const fields=Object.entries(args);const q=`select public.${ident(name)}(${fields.map(([k],i)=>`${ident(k)} => $${i+1}`).join(',')}) as result`;
        return {data:(await pg.query(q,fields.map(([,v])=>v))).rows[0].result,error:null};
      }catch(error){return {data:null,error:{code:error.code,message:error.message}}}
    },
    from(table){
      const state={action:'select',filters:[],values:null,columns:'*',single:false,limit:null,order:null};
      const builder={
        select(columns='*'){state.columns=columns;return this},
        insert(values){state.action='insert';state.values=values;return this},
        update(values){state.action='update';state.values=values;return this},
        upsert(values,options={}){state.action='upsert';state.values=values;state.options=options;return this},
        eq(key,value){state.filters.push([key,'=',value]);return this},
        neq(key,value){state.filters.push([key,'<>',value]);return this},
        order(key,options={}){state.order=[key,options.ascending===false?'desc':'asc'];return this},
        limit(value){state.limit=value;return this},
        single(){state.single=true;return this},maybeSingle(){state.single=true;return this},
        then(resolve,reject){return run().then(resolve,reject)}
      };
      async function run(){try{
        const params=[];const bind=value=>{params.push(value);return '$'+params.length};
        const columns=state.columns==='*'?'*':state.columns.split(',').map(ident).join(',');
        const where=()=>state.filters.length?' where '+state.filters.map(([k,op,v])=>`${ident(k)} ${op} ${bind(v)}`).join(' and '):'';
        let sql;
        if(state.action==='select')sql=`select ${columns} from public.${ident(table)}${where()}`;
        else if(state.action==='update')sql=`update public.${ident(table)} set ${Object.entries(state.values).map(([k,v])=>`${ident(k)}=${bind(v)}`).join(',')}${where()} returning ${columns}`;
        else {
          const entries=Object.entries(state.values);
          sql=`insert into public.${ident(table)} (${entries.map(([k])=>ident(k)).join(',')}) values (${entries.map(([,v])=>bind(v)).join(',')})`;
          if(state.action==='upsert')sql+=` on conflict (${ident(state.options.onConflict)}) `+(state.options.ignoreDuplicates?'do nothing':'do update set '+entries.map(([k])=>`${ident(k)}=excluded.${ident(k)}`).join(','));
          sql+=` returning ${columns}`;
        }
        if(state.order)sql+=` order by ${ident(state.order[0])} ${state.order[1]}`;
        if(state.limit)sql+=' limit '+Number(state.limit);
        const {rows}=await pg.query(sql,params);return {data:state.single?(rows[0]||null):rows,error:null};
      }catch(error){return {data:null,error:{code:error.code,message:error.message}}}}
      return builder;
    }
  };
}
export async function installUpgradeSchema(pg){
  await pg.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,owner_id text,metadata jsonb default '{}',unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role;grant select on storage.objects to anon;grant select,insert,update,delete on storage.objects to authenticated;grant all on storage.objects,storage.buckets to service_role;`);
  const files=await readdir(new URL('../../supabase/migrations/',import.meta.url));
  for(const suffix of ['_community_scheduled_moderation.sql','_community_profiles.sql','_community_owner_controls.sql','_community_click_schema.sql','_community_owner_overview.sql','_community_bounded_clicks.sql']){
    const file=files.find(f=>f.endsWith(suffix));if(!file)throw new Error('Missing upgrade migration');
    await pg.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
  }
}
