import {publicAcademy} from "@/lib/enrollment";
import {records,operationsFailure} from "@/lib/operations-store";
import {academyTable,type Tournament} from "@/lib/tournament";
export async function GET() {
  try {
    const data=await records(await publicAcademy(),true);
    const events=Object.entries(data).filter(([key])=>key.startsWith("event:")).map(([,v])=>v.value as Tournament);
    return Response.json({table:academyTable(events),started:events.map(t=>t.event.id)},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return operationsFailure(e);}
}
