// app/lib/models/Operator.ts
import mongoose, { Schema } from 'mongoose';

const OperatorSchema = new Schema({
  employeeNumber: { 
    type: String, 
    required: [true, 'El número de empleado es obligatorio'], 
    unique: true,
    trim: true,
  },
  name: { 
    type: String, 
    required: [true, 'El nombre del operador es obligatorio'], 
    trim: true,
  },
  area: { 
    type: String, 
    required: [true, 'El área es obligatoria'], 
    trim: true,
  },
}, { timestamps: true });

// ✅ Esta es la forma correcta de exportar para Next.js
const Operator = mongoose.models.Operator || mongoose.model('Operator', OperatorSchema);

export default Operator;