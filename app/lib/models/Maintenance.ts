import mongoose, { Schema, model, models } from 'mongoose';

const MaintenanceSchema = new Schema({
    product: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', // Referencia al modelo de Productos
        required: true 
    },
    quantity: { type: Number, required: true },
    entryDate: { type: Date, default: Date.now },
    exitDate: { type: Date },
    observation: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['En Taller', 'Completado'], 
        default: 'En Taller' 
    }
}, { timestamps: true });

const Maintenance = models.Maintenance || model('Maintenance', MaintenanceSchema);
export default Maintenance;