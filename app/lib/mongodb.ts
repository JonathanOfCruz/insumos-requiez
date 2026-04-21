import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
    throw new Error('Define la variable MONGODB_URI en .env.local');
}

export const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Conectado');
    } catch (error) {
        console.error('Error de conexion: ', error);
    }
}