/* Coco's Commons: approved-member artwork only. This script runs on community.html.
   Source images and account mappings stay in a private, row-protected database. */
import {createAuthStorage} from './auth-flow.mjs?v=recovery1';
const cfg=window.COWBOY_COMMUNITY_CONFIG;
if(document.body.classList.contains('community-page')&&cfg?.enabled===true){
  const safeImage=s=>typeof s==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(s)&&s.length<60000;
  let client=null,fetching=false,loaded=false,lastChecked=0,currentUserId=null,timer=0,generation=0;
  const pictures=new Map();
  const byUser=new Map();
  function replaceAvatar(span,src){
    if(!span||!safeImage(src))return;
    const img=span.querySelector('img');
    if(img?.getAttribute('src')===src)return;
    span.replaceChildren();const picture=document.createElement('img');
    picture.src=src;picture.alt='';picture.width=96;picture.height=96;
    picture.decoding='async';span.append(picture);
  }

  function update(){
    const board=document.getElementById('conversations');
    if(!board||board.hidden||!loaded)return;
    for(const button of document.querySelectorAll('[data-member-profile], [data-family-avatar]')){
      const id=button.getAttribute('data-member-profile')||button.dataset.familyAvatar;
      replaceAvatar(button.matches('[data-family-avatar]')?button:button.querySelector('.profile-avatar'),byUser.get(id));
    }
    replaceAvatar(document.querySelector('#account-actions .profile-avatar'),byUser.get(currentUserId));
    replaceAvatar(document.querySelector('#profile-live-preview .profile-avatar'),byUser.get(currentUserId));
    const openMember=document.querySelector('#dialog-content [data-member-posts]')?.getAttribute('data-member-posts');
    if(openMember)replaceAvatar(document.querySelector('#dialog-content .member-card .profile-avatar'),byUser.get(openMember));
    const van=pictures.get('van');if(safeImage(van))document.body.style.setProperty('--coco-van-image','url("'+van+'")');
    document.getElementById('coco-cast-strip')?.remove(); // deprecated family portrait block
  }
  function clear(){
    ++generation;loaded=false;lastChecked=0;currentUserId=null;pictures.clear();byUser.clear();
    document.getElementById('coco-cast-strip')?.remove();
    document.body.style.removeProperty('--coco-van-image');
  }
  async function sync(){
    if(fetching||!client)return;
    const board=document.getElementById('conversations');
    if(!board||board.hidden){if(loaded)clear();return;}
    if(loaded){update();return;}
    if(Date.now()-lastChecked<3000)return;
    fetching=true;lastChecked=Date.now();
    const access=generation;
    try{
      const {data:{session}}=await client.auth.getSession();
      if(!session?.user?.id)return;
      const {data,error}=await client.from('community_board_avatar_assets').select('asset_key,user_id,data_uri');
      if(error||!Array.isArray(data)||board.hidden||generation!==access)return;
      currentUserId=session.user.id;
      for(const item of data){if(!safeImage(item.data_uri))continue;
        pictures.set(item.asset_key,item.data_uri);
        if(item.user_id)byUser.set(item.user_id,item.data_uri);
      }
      loaded=true;update();
    }catch{/* Preserve the existing board if artwork cannot be fetched. */}
    finally{fetching=false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,100);}
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm');
    const local=window.localStorage,session=window.sessionStorage;
    const store=createAuthStorage({local,session,remember:()=>local.getItem('cowboy-community-remember')==='yes'});
    const storageKey='sb-'+new URL(cfg.supabaseUrl).hostname.split('.')[0]+'-auth-token';
    client=createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{storageKey,flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:store}});
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(currentUserId&&session?.user?.id!==currentUserId))clear();schedule();});
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
    schedule();
  }catch{/* No artwork script should block ordinary message-board functionality. */}
}
