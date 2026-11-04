import { readUploadForm } from "../../lib/read-upload";
import { requireUser } from "../../middleware/auth";
import { errorResponse, ValidationError } from "../../lib/errors";
import { uploadPhoto } from "./upload.service";
export async function create(request: Request) {
  try {
    const owner = await requireUser();
    if (Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024)
      throw new ValidationError("Photo is too large");
    const file = (await readUploadForm(request)).get("photo");
    if (!(file instanceof File)) throw new ValidationError("Choose a photo");
    return Response.json(
      await uploadPhoto(
        owner,
        file,
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      ),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
