import { z } from "zod";
import { fail, handleError, ok } from "@/lib/api";
import { getPublicPage } from "@/lib/queries";
import { connectDB } from "@/lib/db";

const paramsSchema = z.object({
  slug: z.string().min(1).max(100),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/public/[slug]">,
) {
  try {
    const { slug } = paramsSchema.parse(await context.params);
    await connectDB();
    const result = await getPublicPage(slug);
    if (!result) return fail("This page is not published", 404);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
