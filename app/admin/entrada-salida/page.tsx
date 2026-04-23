"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function ControlMovimientosPage() {
    const [initials, setInitials] = useState("...");
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const [movements, setMovements] = useState<IMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // --- ESTADOS DE FILTRO POR PRODUCTO ---
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [showProductFilter, setShowProductFilter] = useState(false);

    // --- ESTADOS DE PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const uniqueProducts = Array.from(new Set(movements.map(m => m.productCode))).filter(Boolean).sort();

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

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [resHist, resProd] = await Promise.all([
                fetch('/api/history'),
                fetch('/api/products')
            ]);

            const historyData = resHist.ok ? await resHist.json() : [];
            const productsData = resProd.ok ? await resProd.json() : [];

            if (Array.isArray(historyData)) {
                const enrichedMovements = historyData.map((mov: any) => {
                    const product = productsData.find((p: any) => p._id === mov.productId);
                    let nombreFinal = "Sistema";

                    if (mov.operator) {
                        if (typeof mov.operator === 'object' && mov.operator.name) {
                            nombreFinal = mov.operator.name;
                        }
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
            console.error("Error:", err);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = movements.filter((mov) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = (
            mov.productCode?.toLowerCase().includes(term) ||
            mov.productName?.toLowerCase().includes(term) ||
            mov.operator?.toLowerCase().includes(term)
        );
        const matchesProductFilter = selectedProducts.length === 0 ||
            (mov.productCode && selectedProducts.includes(mov.productCode));

        return matchesSearch && matchesProductFilter;
    });

    const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);
    const currentItems = filteredMovements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => {
            setMenuOpen(false);
            setShowProductFilter(false);
        }}>
            {/* Header */}
            <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Control de Entradas y Salidas</span>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2 px-2 pr-4">
                        <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                        <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                        <span className="text-blue-600 font-bold">Bitácora</span>
                    </div>
                </div>

                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white">{initials}</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                            <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-semibold">
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-6 lg:px-10">
                <h1 className="text-4xl font-black text-gray-800 tracking-tight mb-10">Historial Detallado</h1>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                        </div>
                    )}

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-center gap-4 bg-white">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="relative w-full md:w-72">
                                <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input
                                    type="text"
                                    placeholder="Búsqueda global..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center gap-4 text-gray-600 text-sm font-medium">
                            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-transparent outline-none cursor-pointer text-xs font-bold"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <button onClick={loadData} className="hover:text-blue-500 transition-colors p-1" title="Actualizar">
                                <Icon icon="solar:refresh-bold" className="text-xl" />
                            </button>
                            <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-2 py-1 border border-gray-200">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                                    <Icon icon="solar:alt-arrow-left-bold" className="text-xl" />
                                </button>
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mx-3 min-w-[50px] text-center">
                                    {currentPage} / {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                                >
                                    <Icon icon="solar:alt-arrow-right-bold" className="text-xl" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[11px] uppercase text-gray-400 tracking-widest font-bold bg-white">
                                    {/* COLUMNA PRODUCTO CON ICONO DE FILTRO INTEGRADO */}
                                    <th className="px-8 py-5 border-b border-gray-50 relative">
                                        <div className="flex items-center gap-2">
                                            <span>Producto</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowProductFilter(!showProductFilter); }}
                                                className={`p-1 rounded-md transition-all ${selectedProducts.length > 0 ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-300 hover:text-blue-500'}`}
                                            >
                                                <Icon icon="solar:filter-bold" className="text-xs" />
                                            </button>
                                        </div>

                                        {/* MENÚ DESPLEGABLE DEBAJO DEL TEXTO */}
                                        {showProductFilter && (
                                            <div
                                                className="absolute left-8 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] py-3 animate-in fade-in zoom-in duration-150 normal-case tracking-normal"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="px-4 pb-2 border-b border-gray-50 flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filtrar SKU</span>
                                                    {selectedProducts.length > 0 && (
                                                        <button onClick={() => setSelectedProducts([])} className="text-[9px] font-bold text-red-500 hover:underline">Limpiar</button>
                                                    )}
                                                </div>
                                                <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                                                    {uniqueProducts.length > 0 ? (
                                                        uniqueProducts.map((sku) => (
                                                            <label key={sku} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors group">
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={selectedProducts.includes(sku!)}
                                                                    onChange={() => {
                                                                        setSelectedProducts(prev =>
                                                                            prev.includes(sku!) ? prev.filter(s => s !== sku) : [...prev, sku!]
                                                                        );
                                                                        setCurrentPage(1);
                                                                    }}
                                                                />
                                                                <div className={`w-3.5 h-3.5 rounded border mr-3 flex items-center justify-center transition-all ${selectedProducts.includes(sku!) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                                    {selectedProducts.includes(sku!) && <Icon icon="solar:check-read-bold" className="text-white text-[9px]" />}
                                                                </div>
                                                                <span className={`text-[11px] font-medium ${selectedProducts.includes(sku!) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                                                    {sku}
                                                                </span>
                                                            </label>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-center text-gray-400 text-[10px] font-bold uppercase">Sin datos</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </th>
                                    <th className="px-8 py-5 border-b border-gray-50 text-center">Tipo</th>
                                    <th className="px-8 py-5 border-b border-gray-50 text-center">Cant.</th>
                                    <th className="px-8 py-5 border-b border-gray-50 text-center">Operador</th>
                                    <th className="px-8 py-5 border-b border-gray-50 text-center">Fecha / Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentItems.map((mov) => (
                                    <tr key={mov._id} className="bg-white hover:bg-blue-50/50 transition-all group">
                                        <td className="px-8 py-5">
                                            <span className="font-black text-blue-600 block text-xs tracking-tight">{mov.productCode}</span>
                                            <span className="text-gray-500 text-[10px] font-medium">{mov.productName}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${mov.type === 'Entrada' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                                                {mov.type}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-5 text-center font-black text-xs ${mov.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {mov.type === 'Entrada' ? '+' : '-'}{mov.quantity}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-gray-200">
                                                {mov.operator}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="font-bold text-gray-700 text-[11px]">
                                                {new Date(mov.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </div>
                                            <div className="text-gray-400 text-[9px] uppercase font-bold tracking-tighter">
                                                {new Date(mov.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-8 py-5 flex justify-between items-center bg-gray-50/50 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            Mostrando {currentItems.length} de {filteredMovements.length} registros
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            Página {currentPage} de {totalPages || 1}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}