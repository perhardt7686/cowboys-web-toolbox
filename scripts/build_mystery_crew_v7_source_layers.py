#!/usr/bin/env python3
"""Research-grade, source-exact separation of V5's existing painted actors.

Produces distinct movable source images for 48 outfits. At-rest PNG reconstruction
is pixel-identical to the source before WebP compression. NOT production art:
natural shoulders, open hands and sleeve folds still require illustrated poses.
No account, family member, entitlement, secret or original sprite is modified.
"""
from __future__ import annotations
from PIL import Image
from pathlib import Path
import hashlib, io, json, tarfile
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs'/'mystery-crew-v5-illustrated.tar'
OUT=ROOT/'reports'/'mystery-crew-v7-source-layers.tar'
CONTACT=ROOT/'reports'/'mystery-crew-v7-source-proof.png'
MANIFEST=ROOT/'reports'/'mystery-crew-v7-source-proof.json'
W,H=430,574
OUTFITS=('detective','explorer','viking','pilot','space','knight','outdoors','stealth')
PARTS=('torso','head','arm-left','hand-left','arm-right','hand-right','leg-left','leg-right')
Y,X=np.indices((H,W))
SEMANTIC=np.zeros((H,W),dtype=np.uint8)
SEMANTIC[Y<185]=1
SEMANTIC[(Y>=322)&(X<217)]=6
SEMANTIC[(Y>=322)&(X>=217)]=7
LEFT=(Y>=196)&(Y<316)&(((X<169)&(Y<269))|((X<201)&(Y>=269)))
RIGHT=(Y>=196)&(Y<323)&(((X>270)&(Y<273))|((X>274)&(Y>=273)))
SEMANTIC[LEFT]=2
SEMANTIC[RIGHT]=4
SEMANTIC[((X-184)**2/23**2+(Y-295)**2/27**2<1)&(Y>=266)]=3
SEMANTIC[((X-294)**2/23**2+(Y-300)**2/27**2<1)&(Y>=267)]=5
SEMANTIC[Y<165]=1
assert len(PARTS)==int(SEMANTIC.max())+1

def segment(image: Image.Image):
    rgba=np.asarray(image.convert('RGBA'))
    shards=[]
    rebuilt=np.zeros_like(rgba)
    for i,part in enumerate(PARTS):
        layer=rgba.copy()
        layer[:,:,3]=np.where(SEMANTIC==i,rgba[:,:,3],0)
        rebuilt[SEMANTIC==i]=rgba[SEMANTIC==i]
        shards.append((part,Image.fromarray(layer,'RGBA')))
    assert np.array_equal(rebuilt,rgba),'Source reconstruction lost painted pixels'
    assert sum(np.count_nonzero(np.asarray(layer.getchannel('A'))) for _,layer in shards)==np.count_nonzero(rgba[:,:,3])
    return shards

def archive():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    before=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    names=[]
    originals=[]
    with tarfile.open(SOURCE,'r') as source,tarfile.open(OUT,'w',format=tarfile.USTAR_FORMAT) as dest:
        for anchor in range(6):
            for outfit in OUTFITS:
                filename=f'crew-{anchor}-{outfit}.webp'
                member=source.extractfile(filename)
                assert member is not None,filename
                image=Image.open(io.BytesIO(member.read())).convert('RGBA')
                assert image.size==(W,H)
                pieces=segment(image)
                if outfit=='detective':originals.append(image)
                for part,layer in pieces:
                    name=f'crew-{anchor}-{outfit}-{part}.webp'
                    output=io.BytesIO()
                    layer.save(output,'WEBP',quality=68,method=3,exact=True)
                    data=output.getvalue()
                    info=tarfile.TarInfo(name);info.size=len(data)
                    dest.addfile(info,io.BytesIO(data))
                    names.append(name)
    assert len(names)==384 and len(set(names))==384
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==before,'V5 source unexpectedly modified'
    proof=Image.new('RGBA',(6*W,2*H),(240,233,220,255))
    for i,original in enumerate(originals):
        proof.alpha_composite(original,(i*W,0))
        parts=segment(original)
        pixels=np.zeros((H,W,4),dtype=np.uint8)
        for j,(_,layer) in enumerate(parts):
            a=np.asarray(layer)
            pixels[SEMANTIC==j]=a[SEMANTIC==j]
        proof.alpha_composite(Image.fromarray(pixels,'RGBA'),(i*W,H))
    proof.convert('RGB').save(CONTACT)
    report={
        'source_sha256':before,'source_outfits':48,
        'parts':PARTS,'total_illustrated_parts':len(names),
        'tar_bytes':OUT.stat().st_size,'original_unchanged':True,
        'source_exact_reconstruction':True,'production_ready':False,
        'remaining_work':[
            'Paint hidden shoulder and hip surfaces for displaced limbs',
            'Illustrate open hands and dynamic sleeve wrinkles',
            'Review Wave/Cheer/Think/Run/Action poses across six anchors',
            'Review every equipped costume on compact and desktop screens'
        ]}
    MANIFEST.write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    archive()
