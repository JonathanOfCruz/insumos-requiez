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
            try {
                const user = JSON.parse(userData);
                const names = (user.name || "AD").split(" ");
                const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
                setInitials(nameInitials);
            } catch (e) { setInitials("ADM"); }
        }
        fetchRequests();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

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
        <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => setMenuOpen(false)}>
            
            {/* Header / Navbar Persistente */}
            <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Libro de Solicitudes</span>
                    </div>

                    <div className="text-sm text-gray-400 flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
                        <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                        <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                        <span className="text-blue-600 font-bold">Peticiones</span>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                        className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase hover:scale-105 active:scale-95 transition-all border-2 border-white"
                    >
                        {initials}
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                            <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Administrador</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-semibold transition-colors"
                            >
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-6 lg:px-12">
                {/* Título y Contador Sutil */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-gray-800 tracking-tight mb-2">Solicitudes</h1>
                        <p className="text-gray-400 font-medium tracking-wide">Auditoría y aprobación de movimientos de insumos.</p>
                    </div>

                    <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="text-center">
                            <p className={`text-3xl font-black leading-none ${pendientesCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                                {pendientesCount}
                            </p>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Pendientes</p>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100"></div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-gray-800 leading-none">{requests.length}</p>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">Total Hoy</p>
                        </div>
                    </div>
                </div>

                {/* Tabla Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-end">
                        <div className="relative w-full md:w-72">
                            <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Buscar código u operador..."
                                className="w-full pl-12 pr-6 py-3 bg-gray-50 rounded-2xl text-xs outline-none border border-transparent focus:border-blue-100 focus:bg-white transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase text-gray-400 tracking-[0.15em] border-b border-gray-50">
                                    <th className="px-10 py-6 font-black">Código SKU</th>
                                    <th className="px-10 py-6 font-black">Producto</th>
                                    <th className="px-10 py-6 font-black text-center">Cantidad</th>
                                    <th className="px-10 py-6 font-black text-center">Operador</th>
                                    <th className="px-10 py-6 font-black text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <Icon icon="solar:restart-linear" className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Consultando libro mayor...</span>
                                        </td>
                                    </tr>
                                ) : requests.map((req: any) => (
                                    req.items.map((item: any, idx: number) => (
                                        <tr key={`${req._id}-${idx}`} className="group hover:bg-blue-50/20 transition-all">
                                            <td className="px-10 py-7 text-xs font-black text-blue-600 tracking-tighter">{item.product?.code || 'N/A'}</td>
                                            <td className="px-10 py-7 text-xs text-gray-600 font-bold">{item.product?.name || '---'}</td>
                                            <td className="px-10 py-7 text-xs text-center font-black text-gray-800">
                                                <span className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100">{item.quantityRequested}</span>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">
                                                        {req.operator?.name || 'Sistema'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7">
                                                {req.status === 'Pendiente' ? (
                                                    <div className="flex justify-center gap-3">
                                                        <button
                                                            onClick={() => handleStatus(req._id, 'Aprobada')}
                                                            className="bg-green-600 text-[#1e613c] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#2d7a4d] hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatus(req._id, 'Rechazada')}
                                                            className="bg-red-600 text-[#a93a3a] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#c24b4b] hover:text-white transition-all shadow-sm active:scale-95"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border ${req.status === 'Aprobada' 
                                                            ? 'bg-green-50 text-green-500 border-green-100' 
                                                            : 'bg-red-50 text-red-400 border-red-100'
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

                {/* Footer Decorativo */}
                <div className="mt-20 flex flex-col items-center">
                    <div className="w-12 h-1 bg-gray-200 rounded-full mb-4"></div>
                    <p className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em]">Protocolo de Seguridad de Activos</p>
                </div>
            </div>
        </main>
    );
}