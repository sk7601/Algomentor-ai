import { describe, it, expect } from "vitest";
import { cn, formatRating, formatPercent } from "@/lib/utils";

describe("utils", () => {
  it("merges class names", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", undefined, "text-blue-500")).toBe("text-blue-500");
  });

  it("formats rating", () => {
    expect(formatRating(1500)).toBe("1,500");
  });

  it("formats percent", () => {
    expect(formatPercent(0.75)).toBe("75%");
  });
});
