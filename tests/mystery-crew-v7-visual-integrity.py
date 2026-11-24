#!/usr/bin/env python3
"""V7 visual art gate: painterly continuity, not functional UI or account tests.

At-rest reconstruction may be pixel-exact while articulated motion exposes
huge empty jacket/shoulder patches. A passing unit test is not art acceptance.
"""
import importlib.util,io,json,sys,tarfile
from pathlib import Path
from PIL import Image
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
script=ROOT/'scripts/build_mystery_crew_v7_source_layers.py'
spec=importlib.util.spec_from_file_location('source_layers',script)
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
SEMANTIC=module.SEMANTIC
W,H=430,574
Y,X=np.indices((H,W))
ROI=(X>=262)&(X<290)&(Y>=200)&(Y<330)
THRESHOLD=.08
records=[]
with tarfile.open(ROOT/'docs/mystery-crew-v5-illustrated.tar') as pack:
 for anchor in range(6):
  for outfit in module.TYPES if hasattr(module,'TYPES') else ('detective','explorer','viking','pilot','space','knight','outdoors','stealth'):
   filename=f'crew-{anchor}-{outfit}.webp'
   source=Image.open(io.BytesIO(pack.extractfile(filename).read())).convert('RGBA')
   rgba=np.asarray(source)
   layers=[]
   for index in range(8):
    pixels=rgba.copy()
    pixels[:,:,3]=np.where(SEMANTIC==index,pixels[:,:,3],0)
    layers.append(Image.fromarray(pixels,'RGBA'))
   frame=Image.new('RGBA',(W,H))
   for index in (6,7,2,3,4,5,0,1):
    item=layers[index]
    if index in (4,5):
     item=item.rotate(114,Image.Resampling.BICUBIC,center=(280,205))
    frame.alpha_composite(item)
   expected=(rgba[:,:,3]>128)&ROI
   actual=(np.asarray(frame)[:,:,3]>128)
   n=int(expected.sum())
   missing=int((expected&(~actual)).sum())
   fraction=round(missing/max(1,n),4)
   records.append({'character':anchor,'outfit':outfit,'torso_reference_pixels':n,
    'exposed_pixels':missing,'fraction':fraction,'pass':fraction<=THRESHOLD})
assert len(records)==48
result={'purpose':'Pose-art acceptance; distinct from source decoding or button checks',
 'max_allowed_torso_gap':THRESHOLD,'checked':len(records),
 'failed':sum(not r['pass'] for r in records),
 'max_gap':max(r['fraction'] for r in records),
 'median_gap':float(np.median([r['fraction'] for r in records])),
 'approved':all(r['pass'] for r in records),
 'requires_human_original_reference_review':True,'cases':records}
report=ROOT/'reports/mystery-crew-v7-visual-integrity.json'
report.parent.mkdir(parents=True,exist_ok=True)
report.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({key:value for key,value in result.items() if key!='cases'},indent=2))
if not result['approved']:
 print('ART NO-GO: incomplete painted shoulders/torso in moving pose, keep PR draft.',file=sys.stderr)
 sys.exit(1)
