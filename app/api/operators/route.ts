import { connectDB } from "@/app/lib/mongodb";
import Operator from "@/app/lib/models/Operator";
import { NextResponse } from "next/server";

// --- NUEVO: GET para obtener la lista de operadores ---
export async function GET() {
  try {
    await connectDB();
    
    // Obtenemos todos los operadores y los ordenamos por número de empleado
    const operators = await Operator.find().sort({ employeeNumber: 1 });
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error("Error al obtener operadores:", error);
    return NextResponse.json(
      { error: "Error al obtener la lista de operadores." }, 
      { status: 500 }
    );
  }
}

// --- POST: Crear un nuevo operador (Ya lo tenías) ---
export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { employeeNumber, name, area } = data;

    // Validaciones
    if (!employeeNumber || employeeNumber.trim() === '') {
        return NextResponse.json({ error: "El número de empleado es obligatorio." }, { status: 400 });
    }
    if (!name || name.trim() === '') {
        return NextResponse.json({ error: "El nombre del operador es obligatorio." }, { status: 400 });
    }
    if (!area || area.trim() === '') {
        return NextResponse.json({ error: "El área es obligatoria." }, { status: 400 });
    }

    // Unicidad
    const existingOperator = await Operator.findOne({ employeeNumber: employeeNumber.trim() });
    if (existingOperator) {
      return NextResponse.json({ error: "Este número de empleado ya está registrado." }, { status: 409 });
    }

    const newOperator = await Operator.create({
      employeeNumber: employeeNumber.trim(),
      name: name.trim(),
      area: area.trim()
    });

    return NextResponse.json({ success: true, operator: newOperator }, { status: 201 });

  } catch (error: any) {
    console.error("Error al registrar operador:", error);
    if (error.code === 11000) {
        return NextResponse.json({ error: "El número de empleado ya existe." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}