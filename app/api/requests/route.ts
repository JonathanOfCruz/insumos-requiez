import { connectDB } from "@/app/lib/mongodb";
import RequestModel from "@/app/lib/models/Request";
import Product from "@/app/lib/models/Product";
import Operator from "@/app/lib/models/Operator";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();

        // Flexibilidad: Aceptamos operatorId o simplemente operator
        const operatorId = data.operatorId || data.operator;
        const items = data.items;

        // 1. Validación de Seguridad
        if (!operatorId || !mongoose.Types.ObjectId.isValid(operatorId)) {
            // Log para que veas qué está llegando exactamente en la consola del servidor
            console.error("ID recibido no válido:", operatorId);
            return NextResponse.json({
                error: "ID de operador no válido. Por favor, reinicia sesión."
            }, { status: 400 });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "La lista de productos está vacía." }, { status: 400 });
        }

        // 2. Validación de Stock
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return NextResponse.json({ error: `Producto no encontrado (ID: ${item.product})` }, { status: 404 });
            }

            if (product.stock < item.quantityRequested) {
                return NextResponse.json({
                    error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
                }, { status: 409 });
            }
        }

        // 3. Crear el registro
        // IMPORTANTE: El campo 'operator' debe coincidir con el nombre en tu RequestModel
        const newRequest = await RequestModel.create({
            operator: operatorId,
            items: items.map(item => ({
                product: item.product,
                quantityRequested: item.quantityRequested
            })),
            status: 'Pendiente'
        });

        return NextResponse.json({
            success: true,
            message: "Solicitud enviada al administrador.",
            requestId: newRequest._id
        }, { status: 201 });

    } catch (error) {
        console.error("Error al registrar solicitud:", error);
        return NextResponse.json({ error: "Error en el servidor al procesar la solicitud." }, { status: 500 });
    }
}

// app/api/requests/route.ts
export async function GET() {
    try {
        await connectDB();
        
        // Asegurar que el modelo Operator esté registrado
        const Operator = await import("@/app/lib/models/Operator").then(m => m.default);
        
        const requests = await RequestModel.find()
            .populate('operator', 'name area')
            .populate('items.product', 'name code')
            .sort({ createdAt: -1 });
        
        return NextResponse.json(requests);
        
    } catch (error) {
        console.error("Error en GET /api/requests:", error);
        return NextResponse.json(
            { error: "Error al obtener peticiones" }, 
            { status: 500 }
        );
    }
}