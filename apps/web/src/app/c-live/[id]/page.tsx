import {
  readPublicResult,
  resultMetadata,
} from "@/features/results/result-data";
import { ResultView } from "@/features/results/result-view";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  return resultMetadata(await readPublicResult((await params).id));
}
export default async function LiveResultPage({ params }: Props) {
  return <ResultView initial={await readPublicResult((await params).id)} />;
}
