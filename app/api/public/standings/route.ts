import {registrationOpen,publicListing} from "@/lib/public-rankings";
import {publicAcademy} from "@/lib/enrollment";
import {records,operationsFailure} from "@/lib/operations-store";
import {academyTable,publicGroups,type Tournament} from "@/lib/tournament";
export async function GET(request:Request) {
  try {
    const data=await records(await publicAcademy(),true);
    const events=Object.entries(data).filter(([key])=>key.startsWith("event:")).map(([,v])=>v.value as Tournament);
    const competitions=new URL(request.url).searchParams.has("groups")?events.filter(t=>["confirmed","groups","bracket"].includes(t.phase)).map(publicGroups):undefined;
    return Response.json({competitions,table:academyTable(events),started:events.filter(t=>t.phase!=="open").map(t=>t.event.id),open:events.filter(t=>registrationOpen(t)).map(publicListing).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title))},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return operationsFailure(e);}
}
