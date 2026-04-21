import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { code, quantityToAdd } = data;

    if (!code || !quantityToAdd || quantityToAdd <= 0) {
      return NextResponse.json({ error: "Datos incompletos o cantidad inválida" }, { status: 400 });
    }

    // Usamos returnDocument: 'after' para evitar el warning de 'new'
    const updatedProduct = await Product.findOneAndUpdate(
      { code: code.trim() },
      { $inc: { stock: quantityToAdd } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "El producto no existe" }, { status: 404 });
    }

    // REGISTRAMOS LA ENTRADA EN EL HISTORIAL
    await Movement.create({
      productId: updatedProduct._id,
      type: 'Entrada',
      quantity: quantityToAdd,
      description: 'Ajuste de stock manual'
    });

    return NextResponse.json({ 
      success: true, 
      message: `Stock actualizado. Nuevo stock: ${updatedProduct.stock}`,
      newStock: updatedProduct.stock 
    });

  } catch (error) {
    console.error("Error al añadir stock:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}