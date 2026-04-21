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
export async function POST(req: Request) {
    try {
        await connectDB();
        const { productId, quantity, observation } = await req.json();

        // 1. Verificar stock actual del producto
        const product = await Product.findById(productId);
        if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        if (product.stock < quantity) {
            return NextResponse.json({ error: `Stock insuficiente. Solo hay ${product.stock}` }, { status: 400 });
        }

        // 2. Crear registro de mantenimiento
        const newMaintenance = await Maintenance.create({
            product: productId,
            quantity,
            observation,
            status: 'En Taller'
        });

        // 3. DESCONTAR STOCK DEL PRODUCTO
        await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });

        // 4. Registrar el movimiento en el historial global
        await Movement.create({
            productId,
            type: 'Salida',
            quantity,
            description: `Ingreso a Mantenimiento (Folio: ${newMaintenance._id.toString().substring(18)})`
        });

        return NextResponse.json(newMaintenance, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al procesar ingreso" }, { status: 500 });
    }
}