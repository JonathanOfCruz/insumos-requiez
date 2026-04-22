import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    
    // Recibimos también el operatorId desde el frontend
    const { code, quantityToAdd, operatorId } = data;

    if (!code || !quantityToAdd || quantityToAdd <= 0) {
      return NextResponse.json({ error: "Datos incompletos o cantidad inválida" }, { status: 400 });
    }

    if (!operatorId || !mongoose.Types.ObjectId.isValid(operatorId)) {
        return NextResponse.json({ error: "ID de administrador no válido. Reinicie sesión." }, { status: 400 });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { code: code.trim() },
      { $inc: { stock: quantityToAdd } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "El producto no existe" }, { status: 404 });
    }

    // REGISTRAMOS LA ENTRADA EN EL HISTORIAL
    // Ahora incluimos el campo 'operator' que es obligatorio en tu modelo
    await Movement.create({
      productId: updatedProduct._id,
      type: 'Entrada',
      quantity: quantityToAdd,
      description: 'Ajuste de stock manual (Administración)',
      operator: new mongoose.Types.ObjectId(operatorId) 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Stock actualizado. Nuevo stock: ${updatedProduct.stock}`,
      newStock: updatedProduct.stock 
    });

  } catch (error: any) {
    console.error("Error al añadir stock:", error);
    return NextResponse.json({ 
        error: "Error interno del servidor",
        details: error.message 
    }, { status: 500 });
  }
}