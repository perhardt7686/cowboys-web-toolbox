#!/usr/bin/env python3
"""Source-backed Wave artwork coverage report for 48 official V5 outfits.
Does not alter family data or imply missing art is approved. Must not hide the
independent art-continuity release blocker.
"""
import hashlib,io,json,tarfile
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports';OUT.mkdir(exist_ok=True)
PACK=ROOT/'docs/mystery-crew-v5-illustrated.tar'
OUTFITS=('detective','explorer','viking','pilot','space','knight','outdoors','stealth')
NAMES=('Scout','Juniper','Finn','Riley','Atlas','Wren')
assert PACK.is_file()
items=[]
contact=Image.new('RGB',(8*205,6*282),(244,238,229))
draw=ImageDraw.Draw(contact)
with tarfile.open(PACK) as tar:
    assert len(tar.getmembers())==48
    for actor,name in enumerate(NAMES):
        for column,outfit in enumerate(OUTFITS):
            key=f'crew-{actor}-{outfit}'
            source=tar.extractfile(key+'.webp')
            assert source,key
            image=Image.open(io.BytesIO(source.read())).convert('RGBA')
            assert image.size==(430,574),key
            thumb=image.copy();thumb.thumbnail((185,242))
            x=column*205+(205-thumb.width)//2;y=actor*282+7
            contact.paste(thumb,(x,y),thumb)
            draw.text((column*205+8,actor*282+260),name+' / '+outfit,fill=(31,45,60))
            items.append({'key':key,'character':name,'outfit':outfit,'source_verified':True,
                          'wave_status':'lab_only' if key=='crew-0-detective' else 'not_authored',
                          'art_approved':False})
assert len(items)==48
# Independently authored Juniper explorer draft was visually REJECTED, not counted as a lab.
rejected=[{'key':'crew-1-explorer','reason':'clipped hand and garment seam in generated pose'}]
for n in range(1,9):
    p=ROOT/f'docs/mystery-crew-v9-scout/scout-v9-frame-{n:02}.png'
    assert p.is_file(),p
    im=Image.open(p);im.load();assert im.size==(430,574) and im.mode=='RGBA'
contact.save(OUT/'mystery-crew-wave-source-48.png',optimize=True)
report={'source_sha256':hashlib.sha256(PACK.read_bytes()).hexdigest(),
        'source_outfits':len(items),'lab_wave_outfits':1,'art_approved_outfits':0,
        'remaining_without_authored_wave':47,'rejected_studies':rejected,
        'public_release_ready':False,
        'full_48_art_gate':'still mandatory and currently failing on V6 rotated-limb art',
        'items':items}
(OUT/'mystery-crew-wave-coverage.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('items','rejected_studies')},indent=2))
