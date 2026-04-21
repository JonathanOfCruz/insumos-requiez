import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement"; // Importante importar el modelo
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { requestId, newStatus } = await req.json();

        if (!requestId || !newStatus) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // 1. Buscamos la solicitud completa con sus ítems
        const requestDoc = await RequestModel.findById(requestId).populate('operator');

        if (!requestDoc) {
            return NextResponse.json({ error: "Petición no encontrada" }, { status: 404 });
        }

        // 2. Si el Admin aprueba, procesamos el inventario y movimientos
        if (newStatus === "Aprobada") {
            // Verificamos que no haya sido aprobada antes para evitar doble descuento
            if (requestDoc.status === "Aprobada") {
                return NextResponse.json({ error: "Esta petición ya fue aprobada previamente." }, { status: 400 });
            }

            // Usamos un bucle for...of para manejar las operaciones asíncronas correctamente
            for (const item of requestDoc.items) {
                // A. Descontamos el stock físicamente
                const updatedProduct = await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantityRequested } },
                    { returnDocument: 'after', runValidators: true }
                );

                // B. REGISTRO EN LA COLECCIÓN MOVEMENT (La huella para el historial)
                await Movement.create({
                    productId: item.product,
                    type: 'Salida',
                    quantity: item.quantityRequested,
                    description: `Petición: ${requestDoc.operator?.name || 'Operador'} (ID: ${requestId.slice(-5)})`,
                    createdAt: new Date()
                });
            }
        }

        // 3. Actualizamos el estado de la solicitud en la base de datos
        requestDoc.status = newStatus;
        await requestDoc.save();

        return NextResponse.json({ 
            success: true, 
            message: `Solicitud ${newStatus} correctamente.` 
        });

    } catch (error) {
        console.error("Error al procesar la petición:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Aprovechamos para dejar el GET que ya tenías funcionando
export async function GET() {
    try {
        await connectDB();
        const requests = await RequestModel.find()
            .populate('operator', 'name')
            .populate('items.product', 'name code')
            .sort({ createdAt: -1 });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener peticiones" }, { status: 500 });
    }
}