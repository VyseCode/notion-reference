import type { BlockDTO } from "@/lib/types";
import { safeImageUrl } from "@/lib/urls";

export function BlockContent({ block }: { block: BlockDTO }) {
  switch (block.type) {
    case "heading1":
      return (
        <h1 className="mb-2 mt-6 text-3xl font-bold leading-snug text-[#37352f]">
          {block.content}
        </h1>
      );
    case "heading2":
      return (
        <h2 className="mb-2 mt-5 text-2xl font-semibold leading-snug text-[#37352f]">
          {block.content}
        </h2>
      );
    case "heading3":
      return (
        <h3 className="mb-2 mt-4 text-xl font-semibold leading-snug text-[#37352f]">
          {block.content}
        </h3>
      );
    case "bullet":
      return (
        <div className="flex gap-2 py-0.5 text-[15px] leading-7">
          <span className="select-none text-[#37352f]">•</span>
          <span className="whitespace-pre-wrap">{block.content}</span>
        </div>
      );
    case "numbered":
      return (
        <div className="flex gap-2 py-0.5 text-[15px] leading-7">
          <span className="select-none text-[#787774]">1.</span>
          <span className="whitespace-pre-wrap">{block.content}</span>
        </div>
      );
    case "todo":
      return (
        <label className="flex items-start gap-2 py-0.5 text-[15px] leading-7">
          <input
            type="checkbox"
            checked={block.checked}
            readOnly
            className="mt-1.5 h-3.5 w-3.5 accent-[#2383e2]"
          />
          <span
            className={
              block.checked
                ? "text-[#a3a3a0] line-through"
                : "whitespace-pre-wrap"
            }
          >
            {block.content}
          </span>
        </label>
      );
    case "quote":
      return (
        <blockquote className="my-3 border-l-[3px] border-[#37352f] pl-3 text-[15px] italic leading-7 text-[#5f5e5b]">
          {block.content}
        </blockquote>
      );
    case "code":
      return (
        <pre className="notion-scroll my-3 overflow-x-auto rounded-md bg-[#f7f6f3] p-4 font-mono text-sm leading-6 text-[#37352f]">
          <code>{block.content}</code>
        </pre>
      );
    case "divider":
      return <hr className="my-6 border-t border-[#e9e9e7]" />;
    case "image": {
      const url = safeImageUrl(block.content);
      return url ? (
        <div
          role="img"
          aria-label="Page image"
          className="my-4 h-72 w-full rounded-md bg-[#f1f1ef] bg-cover bg-center"
          style={{ backgroundImage: `url("${url.replace(/"/g, "%22")}")` }}
        />
      ) : (
        <p className="my-2 text-sm italic text-[#a3a3a0]">Image URL not set</p>
      );
    }
    default:
      return (
        <p className="min-h-7 whitespace-pre-wrap py-0.5 text-[15px] leading-7 text-[#37352f]">
          {block.content}
        </p>
      );
  }
}
