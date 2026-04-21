import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    if (status === "Aprobada") {
      const requestDoc = await RequestModel.findById(id);
      
      if (!requestDoc) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      if (requestDoc.status === "Aprobada") return NextResponse.json({ error: "Ya aprobada" }, { status: 400 });

      const updatePromises = requestDoc.items.map(async (item: any) => {
        // 1. Descontar stock
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantityRequested } },
          { runValidators: true, returnDocument: 'after' }
        );

        // 2. Registrar movimiento de salida
        await Movement.create({
          productId: item.product,
          type: 'Salida',
          quantity: item.quantityRequested,
          description: `Petición aprobada (Ref: ${id.substring(15)})`
        });
      });

      await Promise.all(updatePromises);
    }

    const updatedRequest = await RequestModel.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    );

    return NextResponse.json({ success: true, request: updatedRequest });

  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// AGREGAR ESTO PARA EL POLLING DEL OPERADOR
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const requestDoc = await RequestModel.findById(id);
    
    if (!requestDoc) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Devolvemos el documento completo (incluyendo el status)
    return NextResponse.json(requestDoc);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener la solicitud" }, { status: 500 });
  }
}