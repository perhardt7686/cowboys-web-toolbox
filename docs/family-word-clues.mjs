/* Server-provided letter feedback is authoritative. Never infer or spoil the answer.
   One consistent reducer drives w0rdle and Daily Word Quest on every device. */
const rank={absent:1,present:2,correct:3};
export function letterKnowledge(guesses=[]) {
  const used=Object.create(null),fixed=['','','','',''];
  for(const row of Array.isArray(guesses)?guesses:[]) {
    const guess=String(row?.guess||'').toUpperCase();
    const feedback=Array.isArray(row?.feedback)?row.feedback:[];
    for(let i=0;i<5;i++) {
      const ch=guess[i],status=feedback[i];
      if(!ch||!/[A-Z]/.test(ch)||!rank[status])continue;
      if(rank[status]>(rank[used[ch]]||0))used[ch]=status;
      if(status==='correct')fixed[i]=ch;
    }
  }
  return {used:{...used},fixed,absent:Object.keys(used).filter(x=>used[x]==='absent').sort()};
}
