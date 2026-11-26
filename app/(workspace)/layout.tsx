import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { listPages } from "@/lib/queries";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session || !Types.ObjectId.isValid(session.userId)) redirect("/login");

  await connectDB();
  const [user, pageResult] = await Promise.all([
    User.findById(session.userId).select("name email").lean(),
    listPages(session.userId, { limit: 200, offset: 0 }),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen pt-12 md:pt-0">
      <Sidebar
        user={{ name: user.name, email: user.email }}
        pages={pageResult.pages}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
