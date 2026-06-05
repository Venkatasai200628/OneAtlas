import { NextRequest, NextResponse } from "next/server";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();

  let results = TEMPLATES;
  if (category && category !== "All") {
    results = results.filter(t => t.category === category);
  }
  if (search) {
    results = results.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      templates: results,
      categories: TEMPLATE_CATEGORIES,
      total: results.length,
    },
  });
}
