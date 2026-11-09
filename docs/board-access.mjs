export const canReadBoard=member=>member?.status==='approved';
export function accessCopy(member){
 if(member?.status==='pending')return {title:'Your seat is nearly ready.',text:'Your email is verified. Cowboy needs to approve your membership before you can read the boards.',pending:true};
 if(member)return {title:'Membership access is unavailable.',text:'Your account does not currently have access to the boards. Cowboy controls membership approval.',pending:false};
 return {title:'Good company. Members only.',text:'Conversations, replies and shared profiles are for approved members. Log in, or join and wait for Cowboy’s approval.',pending:false};
}
