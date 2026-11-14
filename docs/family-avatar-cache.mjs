/* Stable, member-authorized avatar image cache. A private image is downloaded
   once per browser session, then displayed from a local blob URL. Never log
   source images or place signed storage links in permanent browser storage. */
const cache=new Map(),pending=new Map();
const MAX_IMAGE_BYTES=2*1024*1024;
const allowed=/^image\/(?:png|jpeg|webp)$/i;
const bucket='community-avatars';
export function cachedAvatarPhoto(path){return path&&cache.get(path)||null;}
export function cacheAvatarPhoto(path,blob){
  if(!path||!blob||blob.size>MAX_IMAGE_BYTES||!allowed.test(blob.type))return null;
  const next=URL.createObjectURL(blob),prev=cache.get(path);
  cache.set(path,next);
  if(prev?.startsWith('blob:'))URL.revokeObjectURL(prev);
  return next;
}
export async function getAvatarPhoto(client,path){
  if(!client||!path)return null;
  if(cache.has(path))return cache.get(path);
  if(pending.has(path))return pending.get(path);
  const job=(async()=>{
    try{
      const {data,error}=await client.storage.from(bucket).download(path);
      if(error||!data)return null;
      return cacheAvatarPhoto(path,data);
    }catch{return null;}
    finally{pending.delete(path);}
  })();
  pending.set(path,job);
  return job;
}
export function clearAvatarPhotos(){
  for(const value of cache.values())if(value?.startsWith('blob:'))URL.revokeObjectURL(value);
  cache.clear();pending.clear();
}
