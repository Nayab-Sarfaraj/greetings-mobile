import { renderMarkdownRoute } from "@/lib/md/registry";
import {
  markdownResponse,
  markdownNotFoundResponse,
  markdownOptionsResponse,
} from "@/lib/md/http";

async function handle(isHead = false) {
  const result = await renderMarkdownRoute("/");
  if (!result) return markdownNotFoundResponse("/", isHead);

  return markdownResponse(result.markdown, {
    canonicalPath: result.canonicalPath,
    lastModified: result.lastModified,
    isHead,
  });
}

export async function GET() {
  return handle(false);
}

export async function HEAD() {
  return handle(true);
}

export async function OPTIONS() {
  return markdownOptionsResponse();
}
