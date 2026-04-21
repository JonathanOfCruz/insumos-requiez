import { connectDB } from "@/app/lib/mongodb";
import Operator from "@/app/lib/models/Operator";
import { NextResponse } from "next/server";

// PUT: Actualizar un operador
export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Definimos params como Promise
) {
  try {
    await connectDB();
    
    // SOLUCIÓN AL ERROR: Debemos esperar a que params se resuelva
    const { id } = await params; 
    
    const body = await req.json();
    const { name, area } = body;

    if (!name || !area) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const updatedOperator = await Operator.findByIdAndUpdate(
      id,
      { name, area },
      { 
        returnDocument: 'after', // Corrección al warning de Mongoose
        runValidators: true 
      }
    );

    if (!updatedOperator) {
      return NextResponse.json({ error: "Operador no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, operator: updatedOperator });

  } catch (error) {
    console.error("Error al actualizar operador:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE: Eliminar un operador
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Definimos params como Promise
) {
  try {
    await connectDB();
    
    // SOLUCIÓN AL ERROR: Debemos esperar a que params se resuelva
    const { id } = await params;

    const deletedOperator = await Operator.findByIdAndDelete(id);

    if (!deletedOperator) {
      return NextResponse.json({ error: "Operador no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Operador eliminado" });

  } catch (error) {
    console.error("Error al eliminar operador:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}