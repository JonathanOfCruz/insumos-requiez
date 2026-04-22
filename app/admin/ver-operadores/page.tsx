"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface IOperator {
    _id: string;
    employeeNumber: string;
    name: string;
    area: string;
}

export default function VerOperadoresPage() {
    const [initials, setInitials] = useState("...");
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const [operators, setOperators] = useState<IOperator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempEditData, setTempEditData] = useState<{ name: string; area: string } | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    const areas = ['Almacén', 'Producción', 'Calidad', 'Mantenimiento'];

    useEffect(() => {
        fetchOperators();
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name) {
                    const names = user.name.split(" ");
                    const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
                    setInitials(nameInitials);
                }
            } catch (e) { setInitials("ABC"); }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    const fetchOperators = async () => {
        try {
            const res = await fetch('/api/operators');
            const data = await res.json();
            if (res.ok) setOperators(data);
        } catch (err) {
            console.error("Error al cargar operadores");
        } finally {
            setLoading(false);
        }
    };

    const filteredOperators = operators.filter((op) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            (op.name?.toLowerCase().includes(term)) ||
            (op.employeeNumber?.toString().toLowerCase().includes(term)) ||
            (op.area?.toLowerCase().includes(term))
        );
    });

    const startEditing = (operator: IOperator) => {
        setEditingId(operator._id);
        setTempEditData({ name: operator.name, area: operator.area });
    };

    const handleSaveEdit = async (id: string) => {
        if (!tempEditData) return;
        setSavingId(id);
        try {
            const res = await fetch(`/api/operators/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempEditData),
            });
            if (res.ok) {
                setOperators(operators.map(op => op._id === id ? { ...op, ...tempEditData } : op));
                setEditingId(null);
                setTempEditData(null);
            }
        } catch (err) {
            alert("Error de conexión.");
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (operator: IOperator) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar al operador ${operator.name}?`)) {
            try {
                const res = await fetch(`/api/operators/${operator._id}`, { method: 'DELETE' });
                if (res.ok) {
                    setOperators(operators.filter(op => op._id !== operator._id));
                }
            } catch (err) {
                alert("Error al eliminar.");
            }
        }
    };

    return (
        <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => setMenuOpen(false)}>
            {/* Header Persistente */}
            <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Listado Maestro</span>
                    </div>

                    <div className="text-sm text-gray-400 flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
                        <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                        <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                        <span className="text-blue-600 font-bold">Operadores</span>
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

            <div className="p-6 lg:p-10">
                <h1 className="text-4xl font-bold text-gray-800 mb-10">Ver operadores</h1>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl">
                            <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                        </div>
                    )}

                    <div className="flex justify-end mb-6">
                        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                            <Icon icon="solar:magnifer-linear" className="text-gray-400 text-lg" />
                            <input 
                                type="text" 
                                placeholder="Buscar operador..." 
                                className="outline-none bg-transparent w-64 text-sm text-gray-700 font-medium" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Icon icon="solar:close-circle-bold" />
                                </button>
                            )}
                        </div>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-400 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium">Número de empleado</th>
                                <th className="px-4 py-3 font-medium">Nombre</th>
                                <th className="px-4 py-3 font-medium text-center">Área</th>
                                <th className="px-4 py-3 font-medium text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOperators.length > 0 ? (
                                filteredOperators.map((operator) => {
                                    const isEditing = editingId === operator._id;
                                    return (
                                        <tr key={operator._id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-4 font-bold text-gray-800">{operator.employeeNumber}</td>
                                            <td className="px-4 py-4 text-gray-600 font-medium">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={tempEditData?.name}
                                                        onChange={(e) => setTempEditData({ ...tempEditData!, name: e.target.value })}
                                                        className="w-full border-b border-blue-400 outline-none p-1 bg-blue-50 rounded"
                                                    />
                                                ) : (
                                                    operator.name
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-600">
                                                {isEditing ? (
                                                    <select
                                                        value={tempEditData?.area}
                                                        onChange={(e) => setTempEditData({ ...tempEditData!, area: e.target.value })}
                                                        className="border-b border-blue-400 outline-none p-1 bg-blue-50 text-xs font-bold uppercase rounded cursor-pointer"
                                                    >
                                                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1 rounded font-bold uppercase">
                                                        {operator.area}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => handleSaveEdit(operator._id)} className="text-green-500 bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors">
                                                                <Icon icon={savingId === operator._id ? "solar:restart-linear" : "solar:diskette-bold"} className={savingId === operator._id ? 'animate-spin' : ''} />
                                                            </button>
                                                            <button onClick={() => { setEditingId(null); setTempEditData(null); }} className="text-gray-400 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                                                                <Icon icon="solar:close-circle-linear" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEditing(operator)} className="text-amber-500 bg-amber-50 p-1.5 rounded hover:bg-amber-100 transition-colors">
                                                                <Icon icon="solar:pen-bold" />
                                                            </button>
                                                            <button onClick={() => handleDelete(operator)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100 transition-colors">
                                                                <Icon icon="solar:trash-bin-trash-bold" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                !loading && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic font-medium">
                                            No se encontraron resultados para "{searchTerm}"
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