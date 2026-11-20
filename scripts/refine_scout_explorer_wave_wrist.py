#!/usr/bin/env python3
"""Prototype: restore authentic skin at Scout Explorer's sleeve/wrist transitions.

Runs on V10 source-locked Detective motion and the separate source-locked
Explorer candidate. Produces art lab images under reports/ only. Does not
modify the published V5 pack, any member data, or GitHub Pages.
"""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'reports/scout-explorer-wave-study'
V10=ROOT/'reports/scout-v10-frames'
OUT=ROOT/'reports/scout-explorer-wave-refined'
OUT.mkdir(parents=True,exist_ok=True)
yy,xx=np.indices((574,430))
allowed=(xx>=261)&(xx<=405)&(yy>=95)&(yy<=347)
review=[]
for number in range(1,9):
    name=f'scout-explorer-wave-{number:02}.png'
    original=np.asarray(Image.open(OLD/name).convert('RGBA')).copy()
    output=original.copy()
    motion=np.asarray(Image.open(V10/f'scout-v10-frame-{number:02}.png').convert('RGBA')).astype(np.int16)
    if number not in (1,8):
        b=original.astype(np.int16)
        region=(xx>=292)&(xx<=405)&(yy>=102)&(yy<=314)
        green=(b[:,:,1]>=b[:,:,0]*.68)&(b[:,:,1]>=b[:,:,2]*1.28)&(b[:,:,3]>45)
        skin=(motion[:,:,0]>=135)&(motion[:,:,1]>=97)&(motion[:,:,2]>=63)&(
            motion[:,:,0]>motion[:,:,1]+19)&(motion[:,:,0]-motion[:,:,1]<128)&(
            motion[:,:,1]-motion[:,:,2]<108)&(motion[:,:,3]>55)
        candidate=(green&skin&region).astype(np.uint8)
        candidate=cv2.morphologyEx(candidate,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
        candidate=cv2.dilate(candidate,np.ones((7,7),np.uint8))
        near_skin=cv2.dilate(skin.astype(np.uint8),np.ones((5,5),np.uint8))>0
        correction=(candidate>0)&near_skin&region&(motion[:,:,3]>35)
        output[correction]=motion[correction].astype(np.uint8)
        if number==2:
            hand=(xx>=334)&(xx<=394)&(yy>=277)&(yy<=337)&(motion[:,:,3]>22)
            output[hand]=motion[hand].astype(np.uint8)
        # If orange detective sleeve pixels were incidentally transferred onto
        # green cloth, restore the green candidate. Never recolor fingers.
        sleeve=(xx>=289)&(xx<=357)&(yy>=163)&(yy<=286)
        orange=(motion[:,:,0]>motion[:,:,1]*1.34)&(motion[:,:,1]<155)&(
            motion[:,:,2]<69)&(motion[:,:,3]>85)
        was_green=(b[:,:,1]>=b[:,:,0]*.75)&(b[:,:,1]>b[:,:,2]*1.4)&(b[:,:,3]>85)
        restore_sleeve=sleeve&orange&was_green
        output[restore_sleeve]=original[restore_sleeve]
        output[output[:,:,3]==0,:3]=0
    changed=(output[:,:,3]!=original[:,:,3])|(
        np.any(output[:,:,:3]!=original[:,:,:3],axis=2)&
        ((output[:,:,3]>0)|(original[:,:,3]>0)))
    assert not np.any(changed&~allowed),f'Visible non-arm pixels touched in frame {number}'
    if number in (1,8):
        assert np.array_equal(output,original),f'Original idle modified in {number}'
    else:
        assert int(changed.sum())>60,f'No visible transition correction in {number}'
    Image.fromarray(output,'RGBA').save(OUT/name,optimize=True)
    review.append({'frame':number,'visible_changed_from_explorer_study':int(changed.sum()),
                   'outside_arm_visible_changes':int((changed&~allowed).sum())})
assert np.array_equal(np.asarray(Image.open(OUT/'scout-explorer-wave-01.png')),
                      np.asarray(Image.open(OUT/'scout-explorer-wave-08.png')))
report={'status':'experimental_not_approved','source':'V5 Explorer and V10 Scout motion',
        'frame_count':8,'dimensions':[430,574],
        'source_idle_and_return_exact':True,'original_face_outfit_and_unlocks_untouched':True,
        'real_scene_approval':False,'all_48_art_gate_still_required':True,
        'review':review}
(OUT/'refined-explorer-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
