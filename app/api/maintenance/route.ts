import { connectDB } from "@/app/lib/mongodb";
import Maintenance from "@/app/lib/models/Maintenance";
import Product from "@/app/lib/models/Product";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";

// GET: Obtener todos los registros de mantenimiento
export async function GET() {
    try {
        await connectDB();
        const data = await Maintenance.find()
            .populate('product', 'code name') // Traemos info del producto
            .sort({ createdAt: -1 });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener mantenimientos" }, { status: 500 });
    }
}

// POST: Ingresar producto a mantenimiento
// ... (resto del código)
export async function POST(req: Request) {
    try {
        await connectDB();
        const { productId, quantity, observation, operator } = await req.json();

        const product = await Product.findById(productId);
        if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

        // Solo creamos el registro de mantenimiento
        const newMaintenance = await Maintenance.create({
            product: productId,
            quantity,
            observation,
            status: 'En Taller'
        });

        // --- SE ELIMINÓ EL UPDATE DE STOCK ---
        // --- SE ELIMINÓ EL MOVEMENT.CREATE ---

        return NextResponse.json(newMaintenance, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
    }
}