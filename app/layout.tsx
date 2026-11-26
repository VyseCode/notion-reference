import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Notion-ref — Your workspace",
    template: "%s | Notion-ref",
  },
  description:
    "A Notion-inspired workspace with nested pages, a block editor, sharing, and search.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
