import mongoose, { Schema, model, models } from 'mongoose';

// Definimos el esquema
const UserSchema = new Schema({
  employeeId: { 
    type: Number, 
    required: [true, 'El número de empleado es obligatorio'], 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  area: { 
    type: String, 
    enum: ['Admin', 'Armado', 'Costura', 'Tapizado'], 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'operator'], 
    default: 'operator' 
  },
  pin: { 
    type: String, 
    default: '0810', // El PIN que solicitaste
    select: false    // Para que no se envíe al frontend por accidente
  }
}, { timestamps: true });

// Exportamos el modelo (importante el check de 'models.User' para Next.js)
const User = models.User || model('User', UserSchema);
export default User;