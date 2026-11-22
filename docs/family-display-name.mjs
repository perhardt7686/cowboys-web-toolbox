// Calendar mirrors may still carry the original spelling after the next sync.
// Correct presentation without changing source calendars or stable account IDs.
export const familyDisplayText=value=>String(value??'').replace(/\bElliot\b/gi,name=>
 name===name.toUpperCase()?'ELIOT':name===name.toLowerCase()?'eliot':'Eliot');
