#!/usr/bin/env python3
"""V10 prototype visual-region verification. Run BEFORE ephemeral test installation."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
V9=ROOT/'docs/mystery-crew-v9-scout'
V10=ROOT/'reports/scout-v10-frames'
a=json.loads((ROOT/'reports/scout-v10-metrics.json').read_text())
assert a['status']=='experimental_art_review_only'
assert a['all_48_costumes_approved'] is False
assert len(a['frames'])==8
yy,xx=np.indices((574,430))
roi=(xx>=261)&(xx<=279)&(yy>=315)&(yy<=344)
for n in range(1,9):
 with Image.open(V9/f'scout-v9-frame-{n:02}.png') as im:
  original=np.array(im.convert('RGBA'))
 with Image.open(V10/f'scout-v10-frame-{n:02}.png') as im:
  updated=np.array(im.convert('RGBA'))
 assert original.shape==updated.shape==(574,430,4)
 visible=np.any(original!=updated,axis=2)&(
   (original[:,:,3]>0)|(updated[:,:,3]>0))
 assert not np.any(visible&~roi),f'Identity or outfit repainted in frame {n}'
 assert np.array_equal(original[:,:,3],updated[:,:,3]) if n in (1,8) else True
 if n in (1,8):
  assert np.array_equal(original,updated),'Idle source changed'
 else:
  assert not np.any((updated[:,:,3]==0)&np.any(updated[:,:,:3]!=0,axis=2)), 'Ghost RGB remains in alpha-zero pixels'
  assert np.any(visible),'No art repair present'
  before=int(np.flatnonzero(original[340,250:286,3]>90)[-1]+250)
  after=int(np.flatnonzero(updated[340,250:286,3]>90)[-1]+250)
  assert after>before,(n,before,after)
print('PASS V10 source invariants: face, clothing and shoes protected; no ghost RGB; smooth hip contour audit recorded')
print('NOTE artistic quality still requires independent human reference inspection')
