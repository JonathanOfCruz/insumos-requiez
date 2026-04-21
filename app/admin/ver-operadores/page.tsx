"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface IOperator {
    _id: string;
    employeeNumber: string;
    name: string;
    area: string;
}

export default function VerOperadoresPage() {
    const [initials, setInitials] = useState("...");
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

    // --- LÓGICA DE FILTRADO CORREGIDA ---
    const filteredOperators = operators.filter((op) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;

        // Usamos encadenamiento opcional y aseguramos que el valor exista antes de llamar a toLowerCase()
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
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
            <div className="flex justify-between items-center mb-8">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors">Inicio</Link>
                    <Icon icon="solar:alt-arrow-right-linear" />
                    <span className="text-blue-600 font-medium">Operadores</span>
                </div>
                <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow uppercase">{initials}</div>
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-10">Ver operadores</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl">
                        <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                    </div>
                )}

                {/* BUSCADOR FUNCIONAL */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Icon icon="solar:magnifer-linear" className="text-gray-400 text-lg" />
                        <input 
                            type="text" 
                            placeholder="Buscar operador..." 
                            className="outline-none bg-transparent w-64 text-sm text-gray-700" 
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
                                        <td className="px-4 py-4 text-gray-600">
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
                                                    className="border-b border-blue-400 outline-none p-1 bg-blue-50 text-xs font-bold uppercase rounded"
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
                                                        <button onClick={() => handleSaveEdit(operator._id)} className="text-green-500 bg-green-50 p-2 rounded-lg hover:bg-green-100">
                                                            <Icon icon={savingId === operator._id ? "solar:restart-linear" : "solar:diskette-bold"} className={savingId === operator._id ? 'animate-spin' : ''} />
                                                        </button>
                                                        <button onClick={() => { setEditingId(null); setTempEditData(null); }} className="text-gray-400 bg-gray-100 p-2 rounded-lg">
                                                            <Icon icon="solar:close-circle-linear" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEditing(operator)} className="text-amber-500 bg-amber-50 p-1.5 rounded hover:bg-amber-100">
                                                            <Icon icon="solar:pen-bold" />
                                                        </button>
                                                        <button onClick={() => handleDelete(operator)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100">
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
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic">
                                        No se encontraron resultados para "{searchTerm}"
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}