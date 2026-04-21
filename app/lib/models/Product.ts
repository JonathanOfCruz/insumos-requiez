import mongoose, { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema({
  code: { 
    type: String, 
    required: [true, 'El código es obligatorio'], 
    unique: true, // No puede haber dos productos con el mismo código
    trim: true
  },
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  stock: { 
    type: Number, 
    required: [true, 'El stock inicial es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0 
  },
  category: { 
    type: String, 
    required: [true, 'La clasificación es obligatoria'],
    enum: ['Herramienta', 'Equipo', 'Insumos'], 
  }
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

const Product = models.Product || model('Product', ProductSchema);
export default Product;