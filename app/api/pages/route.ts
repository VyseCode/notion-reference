import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Page, generatePublicSlug } from "@/models/Page";
import { Block } from "@/models/Block";
import { listPages, paginationFrom } from "@/lib/queries";

const createSchema = z.object({
  title: z.string().trim().max(200).optional(),
  parentId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), "Invalid parent page")
    .nullable()
    .optional(),
  icon: z.string().max(16).optional(),
  coverColor: z.string().max(40).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    const pagination = paginationFrom(searchParams, 100);
    const parentParam = searchParams.get("parentId");

    await connectDB();
    const result = await listPages(session.userId, {
      ...pagination,
      parentId: parentParam === null ? undefined : parentParam,
    });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = createSchema.parse(await readJson(request));
    await connectDB();

    if (body.parentId) {
      const parent = await Page.exists({ _id: body.parentId, owner: session.userId });
      if (!parent) return fail("Parent page not found", 404);
    }

    const page = await Page.create({
      owner: session.userId,
      title: body.title ?? "Untitled",
      parentId: body.parentId ?? null,
      icon: body.icon ?? "",
      coverColor: body.coverColor ?? "",
      publicSlug: generatePublicSlug(),
    });

    await Block.create({
      page: page._id,
      type: "paragraph",
      content: "",
      order: 0,
    });

    return ok(
      {
        page: {
          id: page._id.toString(),
          title: page.title,
          icon: page.icon,
          coverColor: page.coverColor,
          parentId: page.parentId ? page.parentId.toString() : null,
          favorite: page.favorite,
          published: page.published,
          publicSlug: page.publicSlug,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
