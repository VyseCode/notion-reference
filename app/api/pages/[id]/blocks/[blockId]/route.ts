import { Types } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { Block } from "@/models/Block";
import { BLOCK_TYPES, type BlockDTO } from "@/lib/types";

const paramsSchema = z.object({
  id: z.string().refine((value) => Types.ObjectId.isValid(value), "Invalid page id"),
  blockId: z
    .string()
    .refine((value) => Types.ObjectId.isValid(value), "Invalid block id"),
});

const updateSchema = z.object({
  type: z.enum(BLOCK_TYPES).optional(),
  content: z.string().max(20000).optional(),
  checked: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/pages/[id]/blocks/[blockId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id, blockId } = paramsSchema.parse(await context.params);
    const body = updateSchema.parse(await readJson(request));
    await connectDB();

    const page = await Page.exists({ _id: id, owner: session.userId });
    if (!page) return fail("Page not found", 404);

    const block = await Block.findOneAndUpdate(
      { _id: blockId, page: id },
      { $set: body },
      { new: true, runValidators: true },
    )
      .select("type content checked order")
      .lean() as unknown as {
      _id: Types.ObjectId;
      type: BlockDTO["type"];
      content: string;
      checked: boolean;
      order: number;
    } | null;

    if (!block) return fail("Block not found", 404);

    return ok({
      block: {
        id: block._id.toString(),
        type: block.type,
        content: block.content ?? "",
        checked: block.checked ?? false,
        order: block.order ?? 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/pages/[id]/blocks/[blockId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { id, blockId } = paramsSchema.parse(await context.params);
    await connectDB();

    const page = await Page.exists({ _id: id, owner: session.userId });
    if (!page) return fail("Page not found", 404);

    const result = await Block.deleteOne({ _id: blockId, page: id });
    if (result.deletedCount === 0) return fail("Block not found", 404);

    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
