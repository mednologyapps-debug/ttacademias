import {publicAcademy} from "@/lib/enrollment";
import {records,operationsFailure} from "@/lib/operations-store";
import {academyTable,publicGroups,type Tournament} from "@/lib/tournament";
export async function GET(request:Request) {
  try {
    const data=await records(await publicAcademy(),true);
    const events=Object.entries(data).filter(([key])=>key.startsWith("event:")).map(([,v])=>v.value as Tournament);
    const competitions=new URL(request.url).searchParams.has("groups")?events.filter(t=>t.phase!=="closed").map(publicGroups):undefined;
    return Response.json({competitions,table:academyTable(events),started:events.map(t=>t.event.id)},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return operationsFailure(e);}
}
