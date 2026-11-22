import type {Tournament,EventInfo} from "./tournament";

export type PublicRanking = Omit<EventInfo,"participants"> & { entries:number };
export function registrationOpen(t:Tournament, now=new Date()) {
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Lima"}).format(now);
  return t.phase==="open" && t.event.date>=today;
}
export function publicListing(t:Tournament):PublicRanking {
  const {participants,...details}=t.event;
  return {...details,entries:participants.length};
}
