#!/usr/bin/env python3
"""V9 single-outfit PNG source integrity, independent from V6's 48-outfit art gate."""
import io,tarfile,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'docs/mystery-crew-v9-scout'
frames=[]
for i in range(1,9):
 p=path/f'scout-v9-frame-{i:02}.png'
 assert p.is_file() and p.stat().st_size>20000,p
 with Image.open(p) as asset:
  assert asset.size==(430,574) and asset.mode=='RGBA',(p,asset.size,asset.mode)
  frames.append(np.asarray(asset).copy())
assert np.array_equal(frames[0],frames[7]),'Idle return must match frame 1'
with tarfile.open(ROOT/'docs/mystery-crew-v5-illustrated.tar') as archive:
 source=np.array(Image.open(io.BytesIO(archive.extractfile('crew-0-detective.webp').read())).convert('RGBA'))
assert np.array_equal(frames[0],source),'Idle frame must be exact original V5 paint'
Y,X=np.indices(source.shape[:2])
allowed=(X>=261)&(X<410)&(Y>=90)&(Y<350)
for i,frame in enumerate(frames):
 changed=np.any(frame!=source,axis=2)
 assert not np.any(changed&~allowed),f'Frame {i+1} unexpectedly repainted face, outfit or legs'
 assert not np.any(frame[:,:,3]>0 & ~np.isfinite(frame[:,:,3]))
 assert changed.sum()>(8000 if 0<i<7 else -1) if 0<i<7 else not changed.any()
 for point in [(175,105),(160,430),(260,490)]:
  x,y=point
  assert (frame[y,x]==source[y,x]).all(),f'Identity source pixel changed frame {i+1}'
print('PASS: all eight exact 430x574 RGBA files decoded, source-locked regions, first/last original unchanged')
print('NOTE: this check does not certify posed underarm/cuff visual quality or all 48 outfits')
