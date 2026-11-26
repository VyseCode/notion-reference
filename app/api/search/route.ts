import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { paginationFrom, searchPages } from "@/lib/queries";
import { connectDB } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";
    const pagination = paginationFrom(searchParams, 20);

    await connectDB();
    return ok(await searchPages(session.userId, query, pagination));
  } catch (error) {
    return handleError(error);
  }
}
