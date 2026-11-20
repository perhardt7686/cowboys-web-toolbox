#!/usr/bin/env python3
"""Deterministic Scout V10 art laboratory: clean the V9 transparent ghost hand and
make a tiny painterly right-hip bridge, without repainting Scout's identity.

This is NOT a general 48-outfit replacement, and is NOT a production-ready Wave.
The only install mode modifies GitHub Actions' ephemeral working tree for tests.
Original V9 files in the repository are never edited by the default invocation.
"""
from __future__ import annotations
import argparse
import io
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
V9=ROOT/'docs'/'mystery-crew-v9-scout'
V10=ROOT/'reports'/'scout-v10-frames'
REPORT=ROOT/'reports'/'scout-v10-metrics.json'
NUM_FRAMES=8

def repair(source:np.ndarray,frame:int):
    result=source.copy()
    if frame in (1,8):
        return result
    # Body art and raised-arm art are already separate. V9 retained fully
    # transparent RGB data from the discarded resting hand; zero it out.
    # Smooth the brief silhouette discontinuity between the shirt and pocket,
    # reusing original denim colors for only the exposed ~19x30-pixel patch.
    for y in range(315,345):
        old_pixels=np.flatnonzero(result[y,248:288,3]>110)+248
        if not len(old_pixels):
            continue
        old=int(old_pixels.max())
        t=(y-315)/29.0
        target=round(268+11*(t*t*(3-2*t)))
        if target<=old+1:
            continue
        for x in range(max(261,old-2),target+1):
            inside=max(248,old-3-max(0,(x-old)//3))
            r,g,b,a=map(int,result[y,inside])
            if a<110:
                continue
            if x>=target-2:
                r,g,b=(int(v*.58) for v in (r,g,b))
            if x==target:
                a=min(a,110)
            elif x==target-1:
                a=min(a,235)
            result[y,x]=[r,g,b,a]
    result[result[:,:,3]==0,:3]=0
    return result

def build(install:bool=False):
    V10.mkdir(parents=True,exist_ok=True)
    metrics=[]
    yy,xx=np.indices((574,430))
    allowed=(xx>=261)&(xx<=279)&(yy>=315)&(yy<=344)
    for n in range(1,NUM_FRAMES+1):
        path=V9/f'scout-v9-frame-{n:02}.png'
        assert path.is_file(),path
        with Image.open(path) as im:
            assert im.size==(430,574) and im.mode=='RGBA',path
            before=np.array(im)
        after=repair(before,n)
        touched=np.any(before!=after,axis=2)
        changed_visible=touched&((before[:,:,3]>0)|(after[:,:,3]>0))
        if np.any(changed_visible&~allowed):
            raise AssertionError(f'V10 visible change escaped small hip repair window, frame {n}')
        if n in (1,8) and not np.array_equal(before,after):
            raise AssertionError('Must retain exact source idle pixels')
        hidden_cleared=int(np.count_nonzero((before[:,:,3]==0)&np.any(before[:,:,:3]!=0,axis=2)&np.all(after[:,:,:3]==0,axis=2)))
        file=V10/f'scout-v10-frame-{n:02}.png'
        Image.fromarray(after,'RGBA').save(file,optimize=True)
        metrics.append({'frame':n,'modified_visible_pixels':int(changed_visible.sum()),
          'hidden_color_pixels_cleared':hidden_cleared})
    if not any(row['modified_visible_pixels'] for row in metrics[1:7]):
        raise AssertionError('No visible art improvement made')
    assert np.array_equal(np.array(Image.open(V10/'scout-v10-frame-01.png')),
                          np.array(Image.open(V10/'scout-v10-frame-08.png')))
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps({
        'status':'experimental_art_review_only',
        'original_v5_identity_retained':True,
        'source_idle_frames_pixel_exact':True,
        'changed_visible_bounds':[261,315,279,344],
        'all_48_costumes_approved':False,
        'physical_iphone_verified':False,
        'frames':metrics},indent=2)+'\n',encoding='utf-8')
    if install:
        # For CI only. The target is a disposable, checked-out working tree,
        # not a commit to source or a published game. V9 URLs test V10 pixels.
        for n in range(1,NUM_FRAMES+1):
            shutil.copy2(V10/f'scout-v10-frame-{n:02}.png',
                V9/f'scout-v9-frame-{n:02}.png')
    print(REPORT.read_text())

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--install-test-assets',action='store_true',
        help='Replace preview images in ephemeral CI worktree ONLY')
    args=parser.parse_args()
    build(install=args.install_test_assets)
