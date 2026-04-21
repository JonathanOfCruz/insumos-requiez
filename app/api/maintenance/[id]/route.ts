import { connectDB } from "@/app/lib/mongodb";
import Maintenance from "@/app/lib/models/Maintenance";
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

        // 1. Buscar el registro de mantenimiento
        const maintenanceEntry = await Maintenance.findById(id);
        if (!maintenanceEntry) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
        if (maintenanceEntry.status === 'Completado') {
            return NextResponse.json({ error: "Este registro ya fue finalizado" }, { status: 400 });
        }

        // 2. Actualizar mantenimiento a "Completado"
        maintenanceEntry.status = 'Completado';
        maintenanceEntry.exitDate = new Date();
        await maintenanceEntry.save();

        // 3. REGRESAR EL STOCK AL PRODUCTO
        await Product.findByIdAndUpdate(maintenanceEntry.product, { 
            $inc: { stock: maintenanceEntry.quantity } 
        });

        // 4. Registrar movimiento de entrada
        await Movement.create({
            productId: maintenanceEntry.product,
            type: 'Entrada',
            quantity: maintenanceEntry.quantity,
            description: `Salida de Mantenimiento (Folio: ${id.substring(18)})`
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al procesar salida" }, { status: 500 });
    }
}