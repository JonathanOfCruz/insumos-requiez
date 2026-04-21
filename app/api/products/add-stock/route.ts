import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { code, quantityToAdd } = data;

    // Validación básica en backend
    if (!code || !quantityToAdd || quantityToAdd <= 0) {
      return NextResponse.json({ error: "Datos incompletos o cantidad inválida" }, { status: 400 });
    }

    // OPERACIÓN SENIOR: Actualización Atómica Incremental
    // Buscamos por código y usamos $inc para sumar la cantidad directamente en la DB
    const updatedProduct = await Product.findOneAndUpdate(
      { code: code.trim() },
      { $inc: { stock: quantityToAdd } }, // Suma quantityToAdd al valor actual de stock
      { new: true, runValidators: true } // Devuelve el documento actualizado y valida
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "El producto con este código no existe" }, { status: 404 });
    }

    // Opcional: Registrar esta operación en una colección de 'MovimientosInventario'

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