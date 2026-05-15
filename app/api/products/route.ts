// app/api/products/route.ts
import { connectDB } from "@/app/lib/mongodb";
import Product from "@/app/lib/models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error GET:", error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    
    console.log("📦 Datos recibidos:", JSON.stringify(data, null, 2));

    if (!data.code || !data.name || data.stock === undefined || !data.category) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const existingProduct = await Product.findOne({ code: data.code });
    if (existingProduct) {
      return NextResponse.json({ error: "Este código ya está registrado" }, { status: 409 });
    }

    const newProduct = new Product({
      code: data.code,
      name: data.name,
      stock: Number(data.stock),
      category: data.category,
      cost: data.cost !== undefined && data.cost !== null ? Number(data.cost) : 0,
      purchaseOrder: data.purchaseOrder || '',
      purchaseStatus: data.purchaseStatus || 'Vigente',
      assignedOperator: data.assignedOperator || '' // NUEVO
    });

    const savedProduct = await newProduct.save();
    
    console.log("✅ Producto guardado:", JSON.stringify(savedProduct, null, 2));

    return NextResponse.json({ success: true, product: savedProduct }, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { _id, code, name, stock, category, cost, purchaseOrder, purchaseStatus, assignedOperator } = data;

    if (!_id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      _id,
      {
        code,
        name,
        stock: Number(stock),
        category,
        cost: Number(cost) || 0,
        purchaseOrder: purchaseOrder || '',
        purchaseStatus: purchaseStatus || 'Vigente',
        assignedOperator: assignedOperator || ''
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error PUT:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error DELETE:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}