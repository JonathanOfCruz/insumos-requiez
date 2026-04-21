"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [initials, setInitials] = useState("...");
    const router = useRouter();

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            const names = (user.name || "AD").split(" ");
            const initials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
            setInitials(initials);
        }
        fetchRequests();
    }, []);

    const handleStatus = async (requestId: string, newStatus: string) => {
        try {
            const res = await fetch('/api/admin/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, newStatus })
            });
            if (res.ok) fetchRequests();
            else {
                const err = await res.json();
                alert(err.error || "Error al procesar");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const pendientesCount = requests.filter((r: any) => r.status === 'Pendiente').length;

    return (
        <main className="min-h-screen bg-[#f8fafc] p-8 lg:p-12" onClick={() => setMenuOpen(false)}>
            
            {/* BARRA SUPERIOR - BOTÓN ALINEADO A LA DERECHA */}
            <div className="flex justify-end mb-4">
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} 
                        className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg hover:bg-blue-600 transition-all active:scale-95 uppercase border-2 border-white"
                    >
                        {initials}
                    </button>
                    
                    {menuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                            <button 
                                onClick={() => { localStorage.removeItem("user"); router.push("/"); }} 
                                className="w-full px-4 py-3 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors font-bold"
                            >
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Header / Breadcrumbs */}
            <div className="mb-12">
                <nav className="flex items-center gap-2 text-gray-400 text-sm mb-4 font-medium">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                        <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                        <span className="text-blue-600 font-bold">Peticiones</span>
                    </div>
                </nav>

                <h1 className="text-5xl font-black text-gray-800 tracking-tight">Ver peticiones</h1>

                <div className="mt-6 inline-block">
                    <p className="text-4xl font-black text-gray-800 leading-none">{pendientesCount}</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Pendientes</p>
                </div>
            </div>

            {/* Tabla Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-end">
                    <div className="relative w-72">
                        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Buscar por código u operador..."
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl text-xs outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase text-gray-400 tracking-widest border-b border-gray-50">
                                <th className="px-10 py-6 font-bold">Código</th>
                                <th className="px-10 py-6 font-bold">Producto</th>
                                <th className="px-10 py-6 font-bold text-center">Cantidad</th>
                                <th className="px-10 py-6 font-bold text-center">Operador</th>
                                <th className="px-10 py-6 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <Icon icon="solar:restart-linear" className="animate-spin text-4xl text-blue-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : requests.map((req: any) => (
                                req.items.map((item: any, idx: number) => (
                                    <tr key={`${req._id}-${idx}`} className="group hover:bg-blue-50/30 transition-all">
                                        <td className="px-10 py-7 text-xs font-extrabold text-gray-800">{item.product?.code || 'N/A'}</td>
                                        <td className="px-10 py-7 text-xs text-gray-500 font-semibold">{item.product?.name || '---'}</td>
                                        <td className="px-10 py-7 text-xs text-center font-black text-gray-700">{item.quantityRequested}</td>
                                        <td className="px-10 py-7 text-center">
                                            <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter group-hover:bg-gray-200 transition-colors">
                                                {req.operator?.name || 'Sistema'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-7">
                                            {req.status === 'Pendiente' ? (
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => handleStatus(req._id, 'Aprobada')}
                                                        className="bg-[#b4f4c8] text-[#2d7a4d] px-6 py-2 rounded-xl text-[10px] font-bold hover:scale-105 active:scale-95 transition-all shadow-sm shadow-green-200"
                                                    >
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatus(req._id, 'Rechazada')}
                                                        className="bg-[#ffdada] text-[#c24b4b] px-6 py-2 rounded-xl text-[10px] font-bold hover:scale-105 active:scale-95 transition-all shadow-sm shadow-red-200"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg ${req.status === 'Aprobada' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}