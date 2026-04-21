import mongoose, { Schema, model, models } from 'mongoose';

const OperatorSchema = new Schema({
  employeeNumber: { 
    type: String, 
    required: [true, 'El número de empleado es obligatorio'], 
    unique: true, // Senior Check: Evita duplicados en la nómina
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
}, { timestamps: true }); // Agrega createdAt y updatedAt automáticamente

// Senior Check: Si el modelo ya existe lo usa, sino lo crea (evita errores en desarrollo)
const Operator = models.Operator || model('Operator', OperatorSchema);

export default Operator;