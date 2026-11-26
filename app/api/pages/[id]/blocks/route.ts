import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { Block } from "@/models/Block";
import { BLOCK_TYPES, type BlockDTO } from "@/lib/types";

const idSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid page id"),
});

const createSchema = z.object({
  type: z.enum(BLOCK_TYPES).optional(),
  content: z.string().max(20000).optional(),
  checked: z.boolean().optional(),
});

const reorderSchema = z.object({
  ids: z
    .array(
      z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid block id"),
    )
    .min(1)
    .max(500),
});

function blockDTO(doc: {
  _id: Types.ObjectId;
  type: BlockDTO["type"];
  content: string;
  checked: boolean;
  order: number;
}) {
  return {
    id: doc._id.toString(),
    type: doc.type,
    content: doc.content ?? "",
    checked: doc.checked ?? false,
    order: doc.order ?? 0,
  };
}

async function ownedPage(userId: string, pageId: string) {
  return Boolean(await Page.exists({ _id: pageId, owner: userId }));
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/pages/[id]/blocks">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    await connectDB();
    if (!(await ownedPage(session.userId, id))) return fail("Page not found", 404);

    const docs = (await Block.find({ page: id })
      .select("type content checked order")
      .sort({ order: 1, _id: 1 })
      .lean()) as unknown as Array<{
      _id: Types.ObjectId;
      type: BlockDTO["type"];
      content: string;
      checked: boolean;
      order: number;
    }>;

    return ok({ blocks: docs.map(blockDTO) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/pages/[id]/blocks">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    const body = createSchema.parse(await readJson(request));
    await connectDB();
    if (!(await ownedPage(session.userId, id))) return fail("Page not found", 404);

    const last = (await Block.findOne({ page: id })
      .select("order")
      .sort({ order: -1 })
      .lean()) as { order: number } | null;

    const block = await Block.create({
      page: id,
      type: body.type ?? "paragraph",
      content: body.content ?? "",
      checked: body.checked ?? false,
      order: (last?.order ?? -1) + 1,
    });

    return ok({ block: blockDTO(block) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/pages/[id]/blocks">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id } = idSchema.parse(await context.params);
    const body = reorderSchema.parse(await readJson(request));
    await connectDB();
    if (!(await ownedPage(session.userId, id))) return fail("Page not found", 404);

    const uniqueIds = [...new Set(body.ids)];
    const found = await Block.find({ page: id, _id: { $in: uniqueIds } })
      .select("_id")
      .lean();
    if (found.length !== uniqueIds.length) {
      return fail("Some blocks were not found on this page", 400);
    }

    await Block.bulkWrite(
      uniqueIds.map((blockId, index) => ({
        updateOne: {
          filter: { _id: blockId, page: id },
          update: { $set: { order: index } },
        },
      })),
    );

    const docs = (await Block.find({ page: id })
      .select("type content checked order")
      .sort({ order: 1, _id: 1 })
      .lean()) as unknown as Array<{
      _id: Types.ObjectId;
      type: BlockDTO["type"];
      content: string;
      checked: boolean;
      order: number;
    }>;

    return ok({ blocks: docs.map(blockDTO) });
  } catch (error) {
    return handleError(error);
  }
}
