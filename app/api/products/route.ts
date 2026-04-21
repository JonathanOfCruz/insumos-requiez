import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

// GET: Obtener todos los productos
export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

// POST: Crear un nuevo producto
export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data.code || !data.name || data.stock < 0 || !data.category) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const existingProduct = await Product.findOne({ code: data.code });
    if (existingProduct) {
      return NextResponse.json({ error: "Este código ya está registrado" }, { status: 409 });
    }

    const newProduct = await Product.create(data);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// --- AGREGA ESTO PARA LA EDICIÓN ---
// PUT: Actualizar un producto existente
export async function PUT(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { _id, code, name, stock, category } = data;

    if (!_id) {
      return NextResponse.json({ error: "ID del producto no proporcionado" }, { status: 400 });
    }

    // Actualizamos el producto buscando por su ID
    const updatedProduct = await Product.findByIdAndUpdate(
      _id,
      { code, name, stock, category },
      { new: true } // Esto devuelve el documento ya actualizado
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updatedProduct }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 });
  }
}

// DELETE: Si quieres manejar la eliminación masiva o simple desde aquí
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Opcional: obtener ID de la URL ?id=xxx

    if (id) {
      await Product.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}