"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface IMovement {
    _id: string;
    productId: string;
    productCode?: string;
    productName?: string;
    type: 'Entrada' | 'Salida';
    quantity: number;
    description: string;
    operator: any; 
    createdAt: string;
}

interface IProduct {
    _id: string;
    code: string;
    name: string;
}

export default function ControlMovimientosPage() {
    const [initials, setInitials] = useState("...");
    const [movements, setMovements] = useState<IMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name) {
                    const names = user.name.split(" ");
                    const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
                    setInitials(nameInitials);
                }
            } catch (e) { setInitials("SYS"); }
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Solo consultamos las APIs que sí tienes creadas
            const [resHist, resProd] = await Promise.all([
                fetch('/api/history'),
                fetch('/api/products')
            ]);

            const historyData = resHist.ok ? await resHist.json() : [];
            const productsData = resProd.ok ? await resProd.json() : [];

            if (Array.isArray(historyData)) {
                const enrichedMovements = historyData.map((mov: any) => {
                    const product = productsData.find((p: any) => p._id === mov.productId);

                    // Lógica de visualización del operador
                    let nombreFinal = "Sistema";

                    if (mov.operator) {
                        // Si el backend ya devolvió el objeto (vía .populate)
                        if (typeof mov.operator === 'object' && mov.operator.name) {
                            nombreFinal = mov.operator.name;
                        } 
                        // Si solo viene el ID y no tenemos API de cruce, mostramos los últimos dígitos
                        else if (typeof mov.operator === 'string') {
                            nombreFinal = `ID: ...${mov.operator.slice(-4)}`;
                        }
                    }

                    return {
                        ...mov,
                        productCode: product ? product.code : 'N/A',
                        productName: product ? product.name : 'Producto no encontrado',
                        operator: nombreFinal
                    };
                });
                setMovements(enrichedMovements);
            }
        } catch (err) {
            console.error("Error al cargar los datos:", err);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = movements.filter((mov) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            mov.productCode?.toLowerCase().includes(term) ||
            mov.productName?.toLowerCase().includes(term) ||
            mov.operator?.toLowerCase().includes(term) ||
            mov.description?.toLowerCase().includes(term)
        );
    });

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
            <div className="flex justify-between items-center mb-8">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                    <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                    <span className="text-blue-600 font-bold">Control de Inventario</span>
                </div>
                <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase border-2 border-white">
                    {initials}
                </div>
            </div>

            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-800 tracking-tight">Historial Detallado</h1>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Movimientos de Almacén</p>
            </header>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                    </div>
                )}

                <div className="p-8 border-b border-gray-50 flex justify-end">
                    <div className="relative w-80">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Buscar por código u operador..."
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl text-xs outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase text-gray-400 tracking-widest border-b border-gray-50">
                                <th className="px-10 py-6 font-bold">Fecha / Hora</th>
                                <th className="px-10 py-6 font-bold">Producto</th>
                                <th className="px-10 py-6 font-bold text-center">Tipo</th>
                                <th className="px-10 py-6 font-bold text-center">Cant.</th>
                                <th className="px-10 py-6 font-bold">Descripción</th>
                                <th className="px-10 py-6 font-bold text-center">Operador</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredMovements.length > 0 ? (
                                filteredMovements.map((mov) => (
                                    <tr key={mov._id} className="group hover:bg-blue-50/30 transition-all">
                                        <td className="px-10 py-7">
                                            <div className="font-extrabold text-gray-800 text-xs">
                                                {new Date(mov.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">
                                                {new Date(mov.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-10 py-7">
                                            <span className="font-black text-blue-600 block text-xs tracking-tight">{mov.productCode}</span>
                                            <span className="text-gray-500 text-[11px] font-semibold">{mov.productName}</span>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter ${mov.type === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {mov.type}
                                            </span>
                                        </td>
                                        <td className={`px-10 py-7 text-center font-black text-sm ${mov.type === 'Entrada' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {mov.type === 'Entrada' ? '+' : '-'}{mov.quantity}
                                        </td>
                                        <td className="px-10 py-7">
                                            <p className="text-gray-500 italic text-[11px] max-w-[200px] leading-relaxed font-medium">
                                                {mov.description || 'Sin descripción adicional'}
                                            </p>
                                        </td>
                                        <td className="px-10 py-7 text-center">
                                            <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter group-hover:bg-gray-200 transition-colors">
                                                {mov.operator}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                !loading && (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Icon icon="solar:box-minimalistic-linear" className="text-6xl text-gray-200" />
                                                <span className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">No hay movimientos registrados</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}