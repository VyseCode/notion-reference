import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { deletePageTree, getPageDetail, isDescendant } from "@/lib/queries";

const idSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid page id"),
});

const updateSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty").max(200).optional(),
  icon: z.string().max(16).optional(),
  coverColor: z.string().max(40).optional(),
  favorite: z.boolean().optional(),
  published: z.boolean().optional(),
  parentId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), "Invalid parent page")
    .nullable()
    .optional(),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/pages/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    await connectDB();
    const detail = await getPageDetail(session.userId, id);
    if (!detail) return fail("Page not found", 404);

    return ok(detail);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/pages/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    const body = updateSchema.parse(await readJson(request));
    await connectDB();

    const page = await Page.findOne({ _id: id, owner: session.userId });
    if (!page) return fail("Page not found", 404);

    if (body.parentId) {
      if (body.parentId === id) return fail("A page cannot be its own parent", 400);
      const parent = await Page.exists({
        _id: body.parentId,
        owner: session.userId,
      });
      if (!parent) return fail("Parent page not found", 404);
      if (await isDescendant(session.userId, body.parentId, id)) {
        return fail("Cannot move a page into its own subtree", 400);
      }
    }

    if (body.title !== undefined) page.title = body.title;
    if (body.icon !== undefined) page.icon = body.icon;
    if (body.coverColor !== undefined) page.coverColor = body.coverColor;
    if (body.favorite !== undefined) page.favorite = body.favorite;
    if (body.published !== undefined) page.published = body.published;
    if (body.parentId !== undefined) {
      page.parentId = body.parentId
        ? new Types.ObjectId(body.parentId)
        : null;
    }

    await page.save();

    const detail = await getPageDetail(session.userId, id);
    return ok({ page: detail?.page, breadcrumbs: detail?.breadcrumbs ?? [] });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/pages/[id]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    await connectDB();
    const deleted = await deletePageTree(session.userId, id);
    if (deleted === null) return fail("Page not found", 404);

    return ok({ ok: true, deleted });
  } catch (error) {
    return handleError(error);
  }
}
