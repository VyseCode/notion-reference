import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { getRecentPages, paginationFrom } from "@/lib/queries";
import { connectDB } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    await connectDB();
    return ok(
      await getRecentPages(session.userId, paginationFrom(searchParams, 10)),
    );
  } catch (error) {
    return handleError(error);
  }
}
