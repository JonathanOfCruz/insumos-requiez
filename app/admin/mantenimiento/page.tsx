"use client";
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface IMaintenance {
    _id: string;
    product: { _id: string; code: string; name: string };
    quantity: number;
    entryDate: string;
    exitDate?: string;
    observation: string;
    status: 'En Taller' | 'Completado';
}

interface IProduct {
    _id: string;
    code: string;
    name: string;
    stock: number;
    category: string;
}

export default function MantenimientoPage() {
    const router = useRouter();
    const [initials, setInitials] = useState("...");
    const [menuOpen, setMenuOpen] = useState(false);

    // Datos
    const [maintenanceList, setMaintenanceList] = useState<IMaintenance[]>([]);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(false);

    // Formulario
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [observation, setObservation] = useState('');

    const fetchMaintenance = async () => {
        try {
            const res = await fetch('/api/maintenance');
            const data = await res.json();
            setMaintenanceList(data);
        } catch (err) { console.error(err); }
    };

    const fetchTools = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            // Filtrar solo Herramienta o Equipo
            const filtered = data.filter((p: IProduct) =>
                p.category === 'Herramienta' || p.category === 'Equipo'
            );
            setProducts(filtered);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchMaintenance();
        fetchTools();
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            const initials = user.name?.split(" ").map((n: any) => n[0]).join("").toUpperCase().substring(0, 3);
            setInitials(initials || "ADM");
        }
    }, []);

    const handleEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId) return alert("Selecciona un producto");
        setLoading(true);

        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    quantity: parseInt(quantity),
                    observation
                }),
            });

            if (res.ok) {
                setSelectedProductId(''); setQuantity('1'); setObservation('');
                fetchMaintenance();
                fetchTools(); // Refrescar stock
                alert("Ingresado a mantenimiento y stock descontado");
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (err) { alert("Error de red"); } finally { setLoading(false); }
    };

    const handleExit = async (maintenanceId: string) => {
        if (!confirm("¿Confirmar salida de mantenimiento? El stock regresará al inventario.")) return;

        try {
            const res = await fetch(`/api/maintenance/${maintenanceId}`, { method: 'PUT' });
            if (res.ok) {
                fetchMaintenance();
                fetchTools();
                alert("Salida registrada con éxito");
            }
        } catch (err) { alert("Error al registrar salida"); }
    };

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10" onClick={() => setMenuOpen(false)}>
            {/* Header / Breadcrumbs */}
            <div className="flex justify-between items-center mb-8 relative">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                    <Icon icon="solar:alt-arrow-right-linear" />
                    <span className="text-blue-600 font-bold">Mantenimiento</span>
                </div>
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow hover:bg-blue-600 transition-colors uppercase">{initials}</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <button onClick={() => { localStorage.removeItem("user"); router.push("/"); }} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors font-bold">
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Formulario de Ingreso */}
                <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tighter">Ingreso a Taller</h2>
                    <form onSubmit={handleEntry} className="space-y-6">
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Producto (Equipo/Herramienta)</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full border-b border-gray-200 text-gray-600 py-2 text-sm outline-none focus:border-blue-500 bg-transparent"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {products.map(p => (
                                    <option key={p._id} value={p._id}>{p.code} - {p.name} (Stock: {p.stock})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Cantidad</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full border-b border-gray-200 text-gray-600 py-2 text-sm outline-none focus:border-blue-500"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Observación / Falla</label>
                            <textarea
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                className="w-full border border-gray-100 text-gray-600 bg-gray-50 rounded-xl p-3 text-sm outline-none focus:border-blue-200 h-24 resize-none"
                                placeholder="Ej: Ruido en motor, mantenimiento preventivo..."
                                required
                            />
                        </div>
                        <button disabled={loading} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 disabled:bg-gray-300 uppercase text-xs tracking-widest">
                            <Icon icon="solar:wrench-bold" /> {loading ? 'Procesando...' : 'Enviar a Mantenimiento'}
                        </button>
                    </form>
                </div>

                {/* Tabla de Mantenimiento */}
                <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tighter">Historial y Estado de Taller</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <th className="px-4 py-4 font-bold">Producto</th>
                                    <th className="px-4 py-4 text-center">Cant.</th>
                                    <th className="px-4 py-4">Ingreso</th>
                                    <th className="px-4 py-4">Salida</th>
                                    <th className="px-4 py-4">Observación</th>
                                    <th className="px-4 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {maintenanceList.map((m) => (
                                    <tr key={m._id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-5">
                                            <p className="font-black text-gray-800">{m.product?.code || 'S/N'}</p>
                                            <p className="text-[10px] text-gray-600 truncate max-w-[120px]">{m.product?.name || 'Producto eliminado'}</p>
                                        </td>

                                        <td className="px-4 py-5 text-center">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold text-xs">
                                                {m.quantity}
                                            </span>
                                        </td>

                                        {/* FECHA DE ENTRADA */}
                                        <td className="px-4 py-5">
                                            <div className="flex items-center gap-2">
                                                <Icon icon="solar:calendar-mark-bold-duotone" className="text-gray-400 text-lg" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-gray-700">
                                                        {new Date(m.entryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400">Entrada</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* FECHA DE SALIDA */}
                                        <td className="px-4 py-5">
                                            {m.exitDate ? (
                                                <div className="flex items-center gap-2">
                                                    <Icon icon="solar:check-circle-bold-duotone" className="text-green-500 text-lg" />
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-700">
                                                            {new Date(m.exitDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                        <p className="text-[9px] text-gray-400">Finalizado</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 animate-pulse">
                                                    <Icon icon="solar:clock-circle-bold-duotone" className="text-amber-500 text-lg" />
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">En taller</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-5">
                                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 max-w-[180px]">
                                                <p className="text-[10px] text-gray-500 leading-tight italic">
                                                    "{m.observation}"
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-4 py-5 text-center">
                                            {m.status === 'En Taller' ? (
                                                <button
                                                    onClick={() => handleExit(m._id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-100 flex items-center gap-2 mx-auto"
                                                >
                                                    <Icon icon="solar:check-read-bold" />
                                                    Dar Salida
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1 text-gray-400">
                                                    <Icon icon="solar:verified-check-bold" className="text-lg" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Entregado</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {maintenanceList.length === 0 && (
                            <div className="py-20 text-center text-gray-300 italic text-sm">No hay registros en mantenimiento</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}