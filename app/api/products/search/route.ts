import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código no proporcionado" }, { status: 400 });
    }

    // Buscamos el producto exactamente por código
    const product = await Product.findOne({ code: code.trim() });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Devolvemos solo los datos necesarios para autocompletar
    return NextResponse.json({
      name: product.name,
      category: product.category,
      currentStock: product.stock // Útil para mostrar feedback visual
    });

  } catch (error) {
    console.error("Error en búsqueda de producto:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}