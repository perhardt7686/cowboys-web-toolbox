#!/usr/bin/env python3
"""Experimental Scout Explorer Wave, derived from V10 source-locked Scout motion.

Requires reports/scout-v10-frames to exist (build_scout_v10_wave.py first).
Retains original Explorer V5 pixels outside the MOVING right-arm region.
Does not modify production images, unlocks, or accounts. Not art-approved.
"""
import io,json,tarfile
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/scout-explorer-wave-study'
OUT.mkdir(parents=True,exist_ok=True)
with tarfile.open(ROOT/'docs/mystery-crew-v5-illustrated.tar') as pack:
    def source(filename):
        f=pack.extractfile(filename)
        assert f is not None,filename
        return np.asarray(Image.open(io.BytesIO(f.read())).convert('RGBA'),dtype=np.int16)
    detective=source('crew-0-detective.webp')
    explorer=source('crew-0-explorer.webp')
yy,xx=np.indices((574,430))
hand_regions={2:(329,270,29,39),3:(354,192,31,37),4:(352,148,37,40),
              5:(367,140,41,50),6:(350,145,39,45),7:(351,199,38,41)}
metrics=[]
frames=[]
for n in range(1,9):
    v10=ROOT/f'reports/scout-v10-frames/scout-v10-frame-{n:02}.png'
    assert v10.is_file(),v10
    motion=np.asarray(Image.open(v10).convert('RGBA'),dtype=np.int16)
    assert motion.shape==explorer.shape==(574,430,4)
    candidate=explorer.copy()
    changed=(motion[:,:,3]!=detective[:,:,3])|(
        np.any(motion[:,:,:3]!=detective[:,:,:3],axis=2)&(
            (motion[:,:,3]>0)|(detective[:,:,3]>0)))
    assert not np.any(changed&((xx<261)|(xx>405)|(yy<95)|(yy>347)))
    if n not in (1,8):
        col=motion[:,:,:3].copy()
        r,g,b=motion[:,:,0],motion[:,:,1],motion[:,:,2]
        cloth=changed&(motion[:,:,3]>40)&(r>g*1.24)&(r>105)&(g<169)&(b<96)
        likely_skin=(r>190)&(g>142)&(b>81)&((r-g)<112)
        cloth &= ~likely_skin
        cx,cy,rx,ry=hand_regions[n]
        hand=((xx-cx)**2/rx**2+(yy-cy)**2/ry**2)<1
        cloth &= ~hand
        col[:,:,0]=np.where(cloth,np.clip(r*.65,0,255),col[:,:,0])
        col[:,:,1]=np.where(cloth,np.clip(g*1.20+38,0,255),col[:,:,1])
        col[:,:,2]=np.where(cloth,np.clip(b*.67+20,0,255),col[:,:,2])
        candidate[:,:,:3]=np.where(changed[:,:,None],col,candidate[:,:,:3])
        candidate[:,:,3]=np.where(changed,motion[:,:,3],candidate[:,:,3])
    image=Image.fromarray(np.clip(candidate,0,255).astype(np.uint8),'RGBA')
    image.save(OUT/f'scout-explorer-wave-{n:02}.png',optimize=True)
    frames.append(image)
    metrics.append({'frame':n,'changed_pixels':int(np.count_nonzero(changed)),
                    'source_exact':bool(np.array_equal(candidate,explorer))})
assert all(m['source_exact'] for m in (metrics[0],metrics[-1]))
assert not any(m['source_exact'] for m in metrics[1:7])
contact=Image.new('RGBA',(430*4,574*2),(246,237,220,255))
for i,im in enumerate(frames):
    contact.alpha_composite(im,((i%4)*430,(i//4)*574))
contact.convert('RGB').save(OUT/'scout-explorer-wave-contact.png')
report={'outfit':'crew-0-explorer','frame_count':8,'size':[430,574],
        'source_idle_exact':True,'source_return_exact':True,
        'experimental_art_only':True,'approved':False,'published':False,
        'source_identity_outside_arm_preserved':True,
        'note':'Green sleeve transfer requires manual cuff/underarm inspection before release',
        'frames':metrics}
(OUT/'scout-explorer-wave-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
