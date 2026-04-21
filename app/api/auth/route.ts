import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/lib/models/User";
import Operator from "@/app/lib/models/Operator"; 
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await connectDB();

        const adminExists = await User.findOne({ employeeId: 65 });
        if (!adminExists) {
            await User.create({
                employeeId: 65,
                name: "Juan",
                area: "Admin",
                role: "admin",
                pin: "0810"
            });
            console.log("✅ Usuario maestro Juan creado.");
        }

        const { employeeNumber, pin } = await req.json();

        if (!employeeNumber) {
            return NextResponse.json({ error: "Número de empleado requerido" }, { status: 400 });
        }

        // --- BÚSQUEDA NIVEL 1: Administrador ---
        const adminUser = await User.findOne({ employeeId: Number(employeeNumber) }).select("+pin");

        if (adminUser) {
            if (!pin) {
                return NextResponse.json({ action: "NEED_PIN" });
            }

            if (pin !== adminUser.pin) {
                return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
            }

            return NextResponse.json({
                success: true,
                user: {
                    id: adminUser._id, // AGREGADO: ID real de MongoDB
                    role: adminUser.role,
                    name: adminUser.name,
                    area: adminUser.area,
                    employeeId: adminUser.employeeId
                }
            });
        }

        // --- BÚSQUEDA NIVEL 2: Operador ---
        const operatorUser = await Operator.findOne({ employeeNumber: employeeNumber.toString() });

        if (operatorUser) {
            return NextResponse.json({
                success: true,
                user: {
                    id: operatorUser._id, // AGREGADO: ID real de MongoDB (ObjectId)
                    role: "operator", 
                    name: operatorUser.name,
                    area: operatorUser.area,
                    employeeNumber: operatorUser.employeeNumber
                }
            });
        }

        return NextResponse.json({ error: "Usuario no registrado" }, { status: 404 });

    } catch (error) {
        console.error("Error en el login:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}