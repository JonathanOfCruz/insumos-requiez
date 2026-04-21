import { connectDB } from "@/app/lib/mongodb";
import Movement from "@/app/lib/models/Movement";
import { NextResponse } from "next/server";

export async function GET(
    req: Request, 
    { params }: { params: Promise<{ productId: string }> } // Se define como Promise
) {
    try {
        await connectDB();
        
        // CORRECCIÓN: Esperamos a que los params se resuelvan
        const { productId } = await params;

        // Buscamos en la colección Movement que creamos
        const movements = await Movement.find({ productId })
            .sort({ createdAt: -1 }); // Los más recientes primero

        return NextResponse.json(movements);
    } catch (error) {
        console.error("Error en API History:", error);
        return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
    }
}