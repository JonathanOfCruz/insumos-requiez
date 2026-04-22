import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { requestId, newStatus } = await req.json();

        if (!requestId || !newStatus) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // 1. Buscamos la solicitud. 
        // No es estrictamente necesario el .populate('operator') aquí si solo queremos el ID, 
        // pero lo dejamos para la descripción.
        const requestDoc = await RequestModel.findById(requestId).populate('operator');

        if (!requestDoc) {
            return NextResponse.json({ error: "Petición no encontrada" }, { status: 404 });
        }

        // 2. Si el Admin aprueba (Validamos contra "Aprobada" como en tu JSON)
        if (newStatus === "Aprobada") {
            if (requestDoc.status === "Aprobada") {
                return NextResponse.json({ error: "Esta petición ya fue aprobada previamente." }, { status: 400 });
            }

            // EXTRAEMOS EL ID DEL OPERADOR (Blindado)
            // Si el populate funcionó, el ID está en requestDoc.operator._id
            // Si no, está directamente en requestDoc.operator
            const operatorId = requestDoc.operator?._id || requestDoc.operator;

            if (!operatorId) {
                return NextResponse.json({ error: "La solicitud no tiene un operador válido asignado." }, { status: 400 });
            }

            for (const item of requestDoc.items) {
                // A. Descontamos el stock
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantityRequested } }
                );

                // B. REGISTRO EN MOVEMENT - AQUÍ ESTABA EL ERROR (Faltaba la propiedad operator)
                await Movement.create({
                    productId: item.product,
                    type: 'Salida',
                    quantity: item.quantityRequested,
                    description: `Entrega a: ${requestDoc.operator?.name || 'Operador'} (Ref: ${requestId.toString().slice(-5)})`,
                    operator: operatorId, // <--- ESTO ES LO QUE FALTA EN TU CÓDIGO
                    createdAt: new Date()
                });
            }
        }

        // 3. Actualizamos el estado de la solicitud
        requestDoc.status = newStatus;
        await requestDoc.save();

        return NextResponse.json({ 
            success: true, 
            message: `Solicitud ${newStatus} correctamente.` 
        });

    } catch (error: any) {
        console.error("Error al procesar la petición:", error);
        return NextResponse.json({ 
            error: "Error interno del servidor",
            details: error.message 
        }, { status: 500 });
    }
}

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