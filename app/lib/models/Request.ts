import mongoose, { Schema, model, models } from 'mongoose';

// Senior Definition: Esquema para un ítem individual dentro de una solicitud
const RequestItemSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', // Senior Check: Referencia al modelo de Productos
    required: true 
  },
  quantityRequested: { 
    type: Number, 
    required: true, 
    min: [1, 'La cantidad debe ser al menos 1'] 
  },
}, { _id: false }); // Evita generar _id para cada ítem en el array

// Senior Definition: Esquema de la solicitud principal
const RequestSchema = new Schema({
  operator: { 
    type: Schema.Types.ObjectId, 
    ref: 'Operator', // Senior Check: Referencia al modelo de Operadores
    required: true 
  },
  items: { 
    type: [RequestItemSchema], // Senior Definition: Array de ítems
    required: true,
    validate: [(v: string | any[]) => Array.isArray(v) && v.length > 0, 'La solicitud debe contener al menos un producto']
  },
  status: { 
    type: String, 
    enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Entregada'], 
    default: 'Pendiente' 
  },
  dateRequested: { 
    type: Date, 
    default: Date.now 
  },
}, { timestamps: true });

const RequestModel = models.Request || model('Request', RequestSchema);

export default RequestModel;