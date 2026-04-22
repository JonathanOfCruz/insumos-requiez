import mongoose from "mongoose";

const MovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['Entrada', 'Salida'], required: true },
  quantity: { type: Number, required: true },
  description: { type: String },
  // ESTA ES LA LÍNEA CRÍTICA:
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true }, 
  createdAt: { type: Date, default: Date.now }
});

// Esto ayuda a resetear el modelo en desarrollo si hay cambios
export default mongoose.models.Movement || mongoose.model("Movement", MovementSchema);