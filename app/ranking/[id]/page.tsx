import RankingRegistration from "./ranking-registration";

export default async function RankingRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RankingRegistration rankingId={id} />;
}
