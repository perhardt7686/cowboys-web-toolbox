#!/usr/bin/env python3
"""Build 48 translucent painted crew models from Cowboy's approved style sheet.
The source is a standalone six-character transparent illustration, never a
screenshot of the creator interface. No credentials/account data are touched.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np,cv2,tarfile,io
ROOT=Path(__file__).resolve().parents[1]
ATLAS=Image.open(ROOT/'docs/mystery-crew-v5-atlas.png').convert('RGBA')
DEST=ROOT/'docs/mystery-crew-v5-illustrated.tar'
TYPES=('detective','explorer','viking','pilot','space','knight','outdoors','stealth')
PALETTE={'explorer':(40,155,.81),'viking':(13,115,.72),
 'pilot':(12,130,.71),'space':(20,24,1.16),'knight':(16,24,.94),
 'outdoors':(0,189,.96),'stealth':(105,68,.58)}
assert ATLAS.size==(1536,1024),'Unexpected six-crew art sheet dimensions'
def sprite(index):
 cell=ATLAS.crop(((index%3)*512,(index//3)*512,(index%3+1)*512,(index//3+1)*512))
 alpha=cell.getchannel('A')
 bbox=alpha.point(lambda v:255 if v>22 else 0).getbbox()
 if bbox is None:raise ValueError('Missing character '+str(index))
 part=cell.crop((max(0,bbox[0]-5),max(0,bbox[1]-5),min(512,bbox[2]+6),min(512,bbox[3]+6)))
 w=min(324,round(part.width*554/part.height))
 part=part.resize((w,554),Image.Resampling.LANCZOS)
 image=Image.new('RGBA',(430,574),(0,0,0,0))
 image.alpha_composite(part,((430-w)//2,8))
 return image
def mask_for(image):
 a=np.asarray(image,dtype='uint8')
 R,G,B,A=[a[:,:,i].astype('float32') for i in range(4)]
 ys,xs=np.indices((574,430))
 return ((R>90)&(R>G*1.12)&(G>B*1.35)&(B<R*.51)&
         (A>15)&(ys>=170)&(ys<390)&(xs>65)&(xs<370))
def costume(image,index,kind):
 if kind=='detective':return image.copy()
 hue,sat,brightness=PALETTE[kind]
 a=np.asarray(image,dtype='uint8').copy()
 cloth=mask_for(image)
 hsv=cv2.cvtColor(np.ascontiguousarray(a[:,:,:3]),cv2.COLOR_RGB2HSV)
 hsv[:,:,0][cloth]=hue
 hsv[:,:,1][cloth]=np.clip(hsv[:,:,1][cloth]*.40+sat*.6,0,255).astype('uint8')
 hsv[:,:,2][cloth]=np.clip(hsv[:,:,2][cloth]*brightness,0,255).astype('uint8')
 rgb=cv2.cvtColor(hsv,cv2.COLOR_HSV2RGB)
 tinted=Image.fromarray(np.dstack((rgb,a[:,:,3])),'RGBA')
 area=Image.fromarray((cloth*255).astype('uint8'),'L').filter(ImageFilter.GaussianBlur(.75))
 output=Image.composite(tinted,image,area)
 output.putalpha(image.getchannel('A'))
 ink=(26,29,34,225)
 overlay=Image.new('RGBA',(430,574))
 d=ImageDraw.Draw(overlay)
 cx=218 if index in (1,3) else 213
 top=184 if index==4 else 169
 waist=325 if index==4 else 310
 if kind=='explorer':
  d.polygon([(cx-47,top+4),(cx-23,top-3),(cx,top+40),(cx+23,top-3),(cx+53,top+6),(cx+42,waist-25),(cx-45,waist-25)],fill=(48,84,35,155),outline=ink,width=4)
  for dx in (-33,28):
   d.rounded_rectangle((cx+dx-15,top+70,cx+dx+13,top+99),radius=3,fill=(128,146,75,195),outline=(35,54,37,220),width=3)
  d.line((cx,top+42,cx,waist-25),fill=(221,203,136,220),width=4)
 if kind=='viking':
  d.polygon([(cx-50,top+10),(cx,top-6),(cx+43,top+8),(cx+37,waist-18),(cx-41,waist-18)],fill=(94,59,44,155),outline=ink,width=5)
  for dx in (-43,43):d.ellipse((cx+dx-24,top-5,cx+dx+22,top+47),fill=(66,47,39,224),outline=ink,width=4)
  d.polygon([(cx-55,43),(cx-80,19),(cx-72,58),(cx-53,75)],fill=(218,202,149,245),outline=ink)
  d.polygon([(cx+55,43),(cx+80,18),(cx+73,58),(cx+53,75)],fill=(218,202,149,245),outline=ink)
  d.arc((cx-57,43,cx+57,132),185,355,fill=(112,98,77,245),width=12)
 if kind=='pilot':
  d.polygon([(cx-50,top+2),(cx-23,top-6),(cx,top+25),(cx+22,top-5),(cx+50,top+7),(cx+42,waist-25),(cx-44,waist-25)],fill=(110,62,33,165),outline=ink,width=4)
  d.polygon([(cx-43,top+4),(cx-11,top+7),(cx,top+40),(cx+25,top+5),(cx+42,top+1),(cx+12,top+31),(cx,top+44),(cx-13,top+30)],fill=(234,214,170,220))
  d.rounded_rectangle((cx-37,47,cx+34,66),radius=8,fill=(73,46,36,192),outline=(212,169,89,230),width=4)
  for dx in (-18,17):d.ellipse((cx+dx-16,43,cx+dx+14,70),fill=(88,142,153,185),outline=ink,width=6)
 if kind=='space':
  d.rounded_rectangle((cx-45,top+19,cx+46,waist-16),radius=17,fill=(242,246,234,114),outline=(73,81,86,230),width=5)
  d.rounded_rectangle((cx-22,top+57,cx+25,top+104),radius=7,fill=(189,220,223,164),outline=ink,width=4)
  d.line((cx-36,top+102,cx+37,top+102),fill=(213,72,57,230),width=8)
  d.ellipse((cx-10,top+63,cx+13,top+87),fill=(245,187,76,225),outline=ink,width=4)
  d.ellipse((cx-75,14,cx+75,159),outline=(210,233,233,210),width=9)
 if kind=='knight':
  d.polygon([(cx-42,top+9),(cx-17,top-3),(cx+26,top-2),(cx+47,top+12),(cx+38,waist-33),(cx-36,waist-33)],fill=(173,187,193,185),outline=ink,width=6)
  for dx in (-53,53):d.ellipse((cx+dx-22,top+1,cx+dx+23,top+57),fill=(170,185,191,210),outline=ink,width=5)
  d.rounded_rectangle((cx-38,42,cx+34,91),radius=16,fill=(168,181,190,200),outline=ink,width=7)
  for y in (60,70,80):d.line((cx-12,y,cx+10,y),fill=(68,75,83,240),width=4)
 if kind=='outdoors':
  plaid=Image.new('RGBA',(430,574))
  g=ImageDraw.Draw(plaid)
  for x in range(80,365,17):
   g.line((x,top-10,x,waist+15),fill=(25,37,44,172),width=7)
   g.line((x+4,top-10,x+4,waist+15),fill=(229,172,107,155),width=2)
  for y in range(top,waist+25,23):
   g.line((70,y,365,y),fill=(25,36,43,190),width=8)
   g.line((70,y+4,365,y+4),fill=(237,187,126,155),width=3)
  alpha=np.minimum(np.asarray(plaid.getchannel('A')),np.asarray(area)).astype('uint8')
  plaid.putalpha(Image.fromarray(alpha,'L'))
  overlay.alpha_composite(plaid)
 if kind=='stealth':
  d.polygon([(cx-51,top+5),(cx-19,top-4),(cx+23,top-4),(cx+51,top+7),(cx+38,waist-25),(cx-40,waist-26)],fill=(28,38,49,185),outline=ink,width=5)
  for dx in (-29,11):d.rounded_rectangle((cx+dx,top+64,cx+dx+20,top+101),radius=4,fill=(66,81,92,185),outline=ink,width=3)
  d.rounded_rectangle((cx-60,64,cx+52,84),radius=8,fill=(22,32,42,213),outline=ink,width=4)
  for dx in (-28,22):d.ellipse((cx+dx-20,61,cx+dx+15,87),fill=(36,105,143,185),outline=ink,width=6)
 output=Image.alpha_composite(output,overlay)
 # Restore unpainted facial and hand pixels so outfits keep the correct face.
 R,G,B,A=[a[:,:,i].astype('float32') for i in range(4)]
 ys,xs=np.indices((574,430))
 face=((R>100)&(R>G*1.11)&(G>B*1.17)&(B>R*.36)&(A>50)&
       ((ys<165)|((ys>177)&(ys<328)&((xs<cx-33)|(xs>cx+34)))))
 mask=Image.fromarray((face*255).astype('uint8'),'L').filter(ImageFilter.GaussianBlur(.6))
 output.paste(image,(0,0),mask)
 return output
with tarfile.open(DEST,'w',format=tarfile.USTAR_FORMAT) as f:
 for index in range(6):
  base=sprite(index)
  for kind in TYPES:
   picture=costume(base,index,kind)
   stream=io.BytesIO()
   picture.save(stream,'WEBP',quality=48,method=1,exact=True)
   data=stream.getvalue()
   name='crew-'+str(index)+'-'+kind+'.webp'
   info=tarfile.TarInfo(name);info.size=len(data)
   f.addfile(info,io.BytesIO(data))
print('Built',DEST.name,DEST.stat().st_size,'bytes; 48 separate character / outfit renderings')
