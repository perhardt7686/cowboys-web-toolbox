/* Coco's family corner. Only mounted inside the approved-member conversations area.
   Drafts existing post forms; never posts automatically or accesses private data. */
const board=document.body.classList.contains('community-page')?document.getElementById('conversations'):null;
if(board){
  const main=board.querySelector('.community-main');
  if(main){
    const storageKey='coco-community-easy-read-v1';
    let easy=false;
    try{easy=localStorage.getItem(storageKey)==='1';}catch{}
    const setRead=on=>{
      easy=!!on;
      document.body.classList.toggle('family-easy-read',easy);
      const control=document.getElementById('family-read-toggle');
      if(control){control.setAttribute('aria-pressed',String(easy));control.textContent=easy?'Standard text size':'Larger, clearer text';}
      try{localStorage.setItem(storageKey,easy?'1':'0');}catch{}
    };
    const reading=document.createElement('div');
    reading.className='family-reading-bar';
    reading.innerHTML='<p><strong>Reading comfort</strong> · Bigger text and clearer menus for everyone.</p><button type="button" id="family-read-toggle" aria-pressed="false">Larger, clearer text</button>';
    reading.querySelector('button').addEventListener('click',()=>setRead(!easy));
    main.prepend(reading);
    setRead(easy);

    const sort=document.querySelector('label.community-sort');
    if(sort&&!sort.querySelector('.community-sort-label')){
      const label=document.createElement('span');
      label.className='community-sort-label';label.textContent='Sort conversations';
      sort.prepend(label);
    }
    const questions=[
      'What is one little thing that made you laugh this week?',
      'If we could do one fun thing together this weekend, what would it be?',
      'What did somebody in our family do that you appreciated?',
      'What is a place you would love to visit together?',
      'What new skill should we try learning together?',
      'What is a favorite memory you want us to keep?'
    ];
    const week=Math.floor(Date.now()/604800000);
    const weeklyQuestion=questions[week%questions.length];
    const room=document.createElement('section');
    room.className='family-room';room.setAttribute('aria-labelledby','family-room-title');
    room.innerHTML=`<div class="family-room-head"><div><p class="family-eyebrow">Coco's family corner</p><h2 id="family-room-title">More moments together.</h2></div></div>
      <p>Start a conversation, plan an outing, celebrate a win, or play a quick game. These tools create drafts in the existing members-only board. Nothing posts until you choose to share it.</p>
      <div class="family-room-grid">
      <button type="button" class="family-action" data-family-action="weekly"><span class="family-action-icon" aria-hidden="true">?</span><strong>Question of the week</strong><span>A small question worth asking around the table.</span></button>
      <button type="button" class="family-action" data-family-action="plan"><span class="family-action-icon" aria-hidden="true">✓</span><strong>Vote on a family plan</strong><span>Draft a real board poll and let everyone choose.</span></button>
      <button type="button" class="family-action" data-family-action="thanks"><span class="family-action-icon" aria-hidden="true">♡</span><strong>Kind words &amp; little wins</strong><span>Recognize someone or share a happy moment.</span></button>
      <button type="button" class="family-action" data-family-action="spanish"><span class="family-action-icon" aria-hidden="true">¡!</span><strong>Spanish with Ana</strong><span>Play with dónde, cuándo, cómo and por qué.</span></button>
      <button type="button" class="family-action" data-family-action="memory"><span class="family-action-icon" aria-hidden="true">✿</span><strong>Memory lane</strong><span>Record a favorite family story or tradition.</span></button>
      <button type="button" class="family-action" data-family-action="challenge"><span class="family-action-icon" aria-hidden="true">★</span><strong>Just-for-fun challenge</strong><span>Make a tiny adventure everyone can join.</span></button>
      </div>
      <p class="family-room-note">Everyone can opt in or skip. No streaks, rankings, location tracking or automatic posting.</p>
      <details><summary>How does the family corner work?</summary><p>Tap a card to open a prepared conversation or poll. Edit anything you want, then decide whether to post. Members can reply using their normal accounts. The board still uses its existing approval, report and moderation rules. Don't include private school, address, health or financial details in shared posts.</p></details>`;
    const heading=main.querySelector('.community-heading');
    if(heading)heading.after(room);else main.append(room);

    const drafts={
      weekly:{type:'discussion',title:'Our question of the week',body:weeklyQuestion+'\n\nEveryone can answer in their own way. No pressure to reply.'},
      plan:{type:'poll',title:'What should we do together next?',body:'Pick an option, or suggest another idea in the replies. We will confirm the actual plan in our shared calendar.',options:'A day outdoors\nGame or movie night\nCook something together\nAnother idea'},
      thanks:{type:'discussion',title:'Little wins and good things',body:'A moment of thanks: what went well this week, or who made you smile? Share only what you feel comfortable sharing.'},
      spanish:{type:'discussion',title:'Spanish with Ana: our question-word challenge',body:'Let us try one sentence each using ¿dónde? (where), ¿cuándo? (when), ¿cómo? (how), or ¿por qué? (why).\n\nTry: ¿Dónde vamos este fin de semana? What does it mean?'},
      memory:{type:'discussion',title:'A memory worth keeping',body:'What is a family memory, recipe, trip, or tradition you would like us to remember? Write a sentence or a story, without sharing private personal information.'},
      challenge:{type:'discussion',title:'Family mini-adventure: a 20-minute challenge',body:'Pick one thing we could all try together this week: a walk, a recipe, a silly photo scavenger hunt, a tiny DIY build, or a game. What should we choose?'}
    };
    const editField=(form,name,value)=>{
      const el=form.elements.namedItem(name);
      if(!el||!('value' in el))return;
      el.value=value;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    };
    room.addEventListener('click',event=>{
      const trigger=event.target.closest('button[data-family-action]');
      if(!trigger)return;
      const draft=drafts[trigger.dataset.familyAction];if(!draft)return;
      const opener=document.getElementById('new-thread');
      if(!opener){return;}
      opener.click();
      // Existing dialog opens synchronously; make no API calls or post for the member.
      const form=document.getElementById('lab-composer');
      if(!form)return;
      if(draft.type==='poll'){
        const select=form.elements.namedItem('postKind');
        if(select){select.value='poll';select.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      editField(form,'title',draft.title);
      editField(form,'category','creative');
      editField(form,'body',draft.body);
      if(draft.options)editField(form,'options',draft.options);
      const first=form.elements.namedItem('title');if(first?.focus)first.focus();
    });
  }
}
