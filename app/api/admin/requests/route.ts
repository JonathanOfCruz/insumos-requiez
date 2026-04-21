import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        const requests = await RequestModel.find()
            .populate('operator', 'name area')
            .populate('items.product', 'name code')
            .sort({ createdAt: -1 });

        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: "Error al cargar peticiones" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const { requestId, newStatus } = await req.json();

        // 1. Buscar la petición original para conocer los productos y su estado actual
        const requestToUpdate = await RequestModel.findById(requestId);

        if (!requestToUpdate) {
            return NextResponse.json({ error: "Petición no encontrada" }, { status: 404 });
        }

        // 2. Evitar procesar una petición que ya fue Aprobada o Rechazada anteriormente
        if (requestToUpdate.status !== 'Pendiente') {
            return NextResponse.json({ error: "Esta petición ya ha sido procesada" }, { status: 400 });
        }

        // 3. Lógica específica si el nuevo estado es 'Aprobada'
        if (newStatus === 'Aprobada') {
            // Validar stock antes de realizar cualquier cambio
            for (const item of requestToUpdate.items) {
                const product = await Product.findById(item.product);
                
                if (!product) {
                    return NextResponse.json({ 
                        error: `Producto no encontrado (ID: ${item.product})` 
                    }, { status: 404 });
                }

                if (product.stock < item.quantityRequested) {
                    return NextResponse.json({ 
                        error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantityRequested}` 
                    }, { status: 409 });
                }
            }

            // Descontar el stock de cada producto
            const updatePromises = requestToUpdate.items.map((item: any) => {
                return Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: -item.quantityRequested } // Decrementa el stock
                });
            });

            await Promise.all(updatePromises);
        }

        // 4. Actualizar el estado de la petición
        requestToUpdate.status = newStatus;
        await requestToUpdate.save();

        return NextResponse.json({ 
            success: true, 
            message: `Petición ${newStatus.toLowerCase()} con éxito.`,
            updatedRequest: requestToUpdate 
        });

    } catch (error) {
        console.error("Error al procesar la petición:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}