import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/notion_ref";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
  },
  { timestamps: true },
);

const pageSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: String,
    icon: String,
    coverColor: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Page", default: null, index: true },
    favorite: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: false, index: true },
    publicSlug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);
pageSchema.index({ owner: 1, parentId: 1 });
pageSchema.index({ owner: 1, updatedAt: -1 });

const blockSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    type: {
      type: String,
      enum: [
        "paragraph", "heading1", "heading2", "heading3", "bullet", "numbered",
        "todo", "quote", "code", "divider", "image",
      ],
      default: "paragraph",
    },
    content: { type: String, default: "" },
    checked: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
blockSchema.index({ page: 1, order: 1, _id: 1 });

const User = mongoose.model("User", userSchema);
const Page = mongoose.model("Page", pageSchema);
const Block = mongoose.model("Block", blockSchema);

const b = (type, content = "", checked = false) => ({ type, content, checked });
const slug = () => `p-${randomBytes(6).toString("hex")}`;

const workspace = [
  {
    title: "Getting Started",
    icon: "👋",
    coverColor: "#d9e8f5",
    favorite: true,
    published: true,
    publicSlug: "getting-started",
    blocks: [
      b("heading1", "Welcome to your workspace"),
      b("paragraph", "This is a Notion-inspired reference implementation. Pages live in MongoDB, blocks render inside the editor, and everything is reachable through a documented REST API."),
      b("quote", "The best way to predict the future is to invent it."),
      b("heading2", "Getting oriented"),
      b("bullet", "Use the sidebar to browse your nested page tree."),
      b("bullet", "Press Enter at the end of a line to add another block."),
      b("bullet", "Star any page to pin it under Favorites."),
      b("divider"),
      b("heading2", "Your first to-dos"),
      b("todo", "Create a new page", true),
      b("todo", "Add a few blocks", true),
      b("todo", "Publish a page to the web"),
      b("code", "const pages = await db.pages.find({ owner: me });\nconsole.log(pages.length);"),
      b("image", "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200"),
      b("paragraph", "Search looks at titles and block text, so try searching for “Invent it”."),
    ],
    children: [],
  },
  {
    title: "Product Roadmap",
    icon: "🗺️",
    coverColor: "#f5e6d3",
    published: true,
    publicSlug: "product-roadmap",
    blocks: [
      b("heading1", "Product Roadmap"),
      b("paragraph", "A living view of what we are building, why, and when. This page is published — anyone with the link can read it."),
      b("heading2", "Themes"),
      b("numbered", "Make writing feel instant"),
      b("numbered", "Make organizing feel effortless"),
      b("numbered", "Make sharing feel safe"),
      b("divider"),
      b("quote", "Roadmaps are hypotheses with dates on them."),
    ],
    children: [
      {
        title: "Q3 Goals",
        icon: "🎯",
        favorite: true,
        blocks: [
          b("heading2", "Objectives"),
          b("todo", "Ship the block editor with 11 block types", true),
          b("todo", "Add nested pages and breadcrumbs", true),
          b("todo", "Launch public page sharing"),
          b("todo", "Improve search relevance"),
          b("paragraph", "Each objective maps to a measurable outcome reviewed at the end of the quarter."),
        ],
      },
      {
        title: "Design System",
        icon: "🎨",
        blocks: [
          b("heading2", "Principles"),
          b("bullet", "Quiet surfaces, clear hierarchy"),
          b("bullet", "Keyboard-first interactions"),
          b("bullet", "Predictable spacing scale"),
          b("code", "--surface: #ffffff;\n--sidebar: #fbfbfa;\n--text: #37352f;"),
          b("image", "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200"),
          b("todo", "Document motion guidelines"),
        ],
      },
      {
        title: "Launch Checklist",
        icon: "🚀",
        blocks: [
          b("heading2", "Before we ship"),
          b("todo", "Smoke-test every API endpoint", true),
          b("todo", "Seed realistic demo data", true),
          b("todo", "Run lint, typecheck, and build"),
          b("todo", "Verify the public read-only view"),
          b("todo", "Write release notes"),
          b("divider"),
          b("paragraph", "Owner: Alex Morgan. Review with the team every Monday."),
        ],
      },
    ],
  },
  {
    title: "Engineering Wiki",
    icon: "📚",
    coverColor: "#e5ddf5",
    blocks: [
      b("heading1", "Engineering Wiki"),
      b("paragraph", "How we design, build, and operate the workspace. Start with the architecture overview."),
    ],
    children: [
      {
        title: "Architecture Overview",
        icon: "🏗️",
        blocks: [
          b("heading1", "Architecture Overview"),
          b("paragraph", "A Next.js App Router frontend talks to a route-handler API layer backed by MongoDB. Authentication uses signed JWTs in HTTP-only cookies."),
          b("code", "app/api/pages/[id]/route.ts\nmodels/Page.ts\nlib/queries.ts"),
          b("quote", "Keep the data model boring so the product can be interesting."),
          b("bullet", "Pages form a tree through parentId"),
          b("bullet", "Blocks are ordered children of a page"),
          b("bullet", "Published pages expose a stable public slug"),
        ],
      },
      {
        title: "API Guidelines",
        icon: "🔌",
        blocks: [
          b("heading2", "API Guidelines"),
          b("numbered", "Validate every mutation with zod"),
          b("numbered", "Return 401 for anonymous writes and 404 for cross-user reads"),
          b("numbered", "Paginate every list endpoint"),
          b("code", "POST /api/pages\nPATCH /api/pages/:id\nPUT /api/pages/:id/blocks"),
          b("divider"),
          b("paragraph", "Prefer lean queries with explicit projections. Never select password by default."),
        ],
      },
      {
        title: "Runbooks",
        icon: "🧯",
        blocks: [
          b("heading2", "Runbooks"),
          b("todo", "Check MongoDB connectivity", true),
          b("todo", "Re-seed the demo database"),
          b("todo", "Rotate JWT_SECRET"),
        ],
      },
    ],
  },
  {
    title: "Personal",
    icon: "🌱",
    coverColor: "#dbe9d5",
    favorite: true,
    blocks: [b("heading1", "Personal"), b("paragraph", "Notes, reading, and small experiments.")],
    children: [
      {
        title: "Reading List",
        icon: "📖",
        blocks: [
          b("heading2", "To read"),
          b("bullet", "The Pragmatic Programmer"),
          b("bullet", "Designing Data-Intensive Applications"),
          b("bullet", "The Shape of Design"),
          b("bullet", "Thinking in Systems"),
          b("todo", "Finish chapter 4"),
          b("todo", "Write a short summary"),
        ],
      },
      {
        title: "Journal",
        icon: "📝",
        blocks: [
          b("heading2", "This week"),
          b("paragraph", "Spent the week tightening the editor and making block reordering reliable. Small details add up."),
          b("quote", "Write it down, then make it true."),
          b("divider"),
          b("paragraph", "Next week: polish the public view and write the documentation."),
        ],
      },
    ],
  },
  {
    title: "Meeting Notes",
    icon: "🗓️",
    blocks: [
      b("heading1", "Weekly Sync"),
      b("paragraph", "Attendees: Alex, Priya, Marcus. Thursday, 10:00."),
      b("heading3", "Discussion"),
      b("bullet", "Editor performance on long pages"),
      b("bullet", "Public sharing permissions"),
      b("todo", "Alex: publish the roadmap"),
      b("todo", "Priya: review the cover colors"),
      b("todo", "Marcus: prepare search metrics"),
      b("quote", "Decisions are cheaper when they are written down."),
    ],
    children: [],
  },
];

async function insertTree(ownerId, definition, parentId = null) {
  const page = await Page.create({
    owner: ownerId,
    title: definition.title,
    icon: definition.icon ?? "",
    coverColor: definition.coverColor ?? "",
    parentId,
    favorite: definition.favorite ?? false,
    published: definition.published ?? false,
    publicSlug: definition.publicSlug ?? slug(),
  });

  if (definition.blocks?.length) {
    await Block.create(
      definition.blocks.map((block, index) => ({
        page: page._id,
        type: block.type,
        content: block.content ?? "",
        checked: block.checked ?? false,
        order: index,
      })),
    );
  }

  for (const child of definition.children ?? []) {
    await insertTree(ownerId, child, page._id);
  }

  return page;
}

async function main() {
  await mongoose.connect(URI);

  const collections = ["blocks", "pages", "users"];
  for (const name of collections) {
    await mongoose.connection.db.collection(name).deleteMany({});
  }

  await Promise.all([
    User.createIndexes(),
    Page.createIndexes(),
    Block.createIndexes(),
  ]);

  const password = await bcrypt.hash("password123", 12);
  const [alex, priya] = await User.create([
    { name: "Alex Morgan", email: "alex@example.com", password },
    { name: "Priya Sharma", email: "priya@example.com", password },
  ]);

  for (const definition of workspace) {
    await insertTree(alex._id, definition);
  }

  await insertTree(priya._id, {
    title: "Priya's Private Notes",
    icon: "💡",
    blocks: [
      b("heading1", "Private notes"),
      b("paragraph", "This page belongs to Priya and is not visible from Alex's workspace."),
      b("todo", "Review the design system"),
    ],
  });

  const pageCount = await Page.countDocuments({});
  const blockCount = await Block.countDocuments({});

  console.log(
    `Seeded ${await User.countDocuments({})} users, ${pageCount} pages, ${blockCount} blocks.`,
  );
  console.log("Demo logins: alex@example.com / password123, priya@example.com / password123");
  console.log("Published pages: /p/getting-started, /p/product-roadmap");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
