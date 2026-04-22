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

        const maintenanceEntry = await Maintenance.findById(id);
        if (!maintenanceEntry) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
        
        if (maintenanceEntry.status === 'Completado') {
            return NextResponse.json({ error: "Este registro ya fue finalizado" }, { status: 400 });
        }

        // Actualizamos solo el estado del mantenimiento
        maintenanceEntry.status = 'Completado';
        maintenanceEntry.exitDate = new Date();
        await maintenanceEntry.save();

        // --- SE ELIMINÓ EL UPDATE DE STOCK ---
        // --- SE ELIMINÓ EL MOVEMENT.CREATE ---

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al procesar salida" }, { status: 500 });
    }
}