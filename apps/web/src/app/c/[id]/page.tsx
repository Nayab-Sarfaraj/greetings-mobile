import { redirect } from "next/navigation";
import {
  readPublicResult,
  resultMetadata,
} from "@/features/results/result-data";
import { ResultView } from "@/features/results/result-view";
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  return resultMetadata(await readPublicResult((await params).id));
}
export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const result = await readPublicResult(id);
  if (result.status !== "ready") redirect(`/c-live/${id}`);
  return <ResultView initial={result} />;
}
