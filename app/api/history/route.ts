import { connectDB } from "@/app/lib/mongodb";
import Movement from "@/app/lib/models/Movement";
import Operator from "@/app/lib/models/Operator"; 
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();
        
        // Forzamos el registro del modelo Operator
        const _registered = Operator.modelName;

        const movements = await Movement.find()
            .populate({
                path: 'operator',
                model: 'Operator',
                select: 'name',
                options: { strictPopulate: false } // <--- ESTO EVITA EL ERROR DE CONSOLA
            })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(movements || []);
    } catch (error) {
        console.error("Error en API History Global:", error);
        // Devolvemos [] para que el frontend no de SyntaxError al intentar parsear el error
        return NextResponse.json([]); 
    }
}