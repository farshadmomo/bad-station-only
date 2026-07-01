// ════════ GET /api/catalogue ════════
// public: products (non-archived) + categories, for the client storefront/search.
import { getProducts, getCategories } from "@/app/lib/catalogue";

export async function GET() {
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return Response.json(
      { products, categories },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return Response.json({ error: "خطای سرور." }, { status: 500 });
  }
}
