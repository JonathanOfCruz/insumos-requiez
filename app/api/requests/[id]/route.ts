import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    // Solo procesamos el descuento si el nuevo estado es "Aprobada"
    if (status === "Aprobada") {
      // 1. Buscamos la solicitud original
      const requestDoc = await RequestModel.findById(id);
      
      if (!requestDoc) {
        return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
      }

      if (requestDoc.status === "Aprobada") {
        return NextResponse.json({ error: "Esta solicitud ya fue aprobada y descontada previamente." }, { status: 400 });
      }

      // 2. Operación Atómica Senior: Descuento de Stock
      // Usamos Promise.all para procesar todos los productos de la solicitud en paralelo
      const updatePromises = requestDoc.items.map(async (item: any) => {
        return Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantityRequested } }, // $inc con valor negativo resta
          { runValidators: true, new: true }
        );
      });

      await Promise.all(updatePromises);
    }

    // 3. Actualizamos el estado de la solicitud
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ 
      success: true, 
      message: status === "Aprobada" ? "Solicitud aprobada y stock descontado." : "Estado actualizado.",
      request: updatedRequest 
    });

  } catch (error) {
    console.error("Error al procesar aprobación:", error);
    return NextResponse.json({ error: "Error al actualizar la solicitud" }, { status: 500 });
  }
}