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

    const product = await Product.findOne({ code: code.trim() });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Devolvemos solo lo necesario para mostrar feedback en la UI
    return NextResponse.json({
      _id: product._id, // Necesario para la referencia en la DB final
      name: product.name,
      category: product.category
    });

  } catch (error) {
    console.error("Error en autocompletado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}