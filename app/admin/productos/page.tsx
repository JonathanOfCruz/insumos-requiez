"use client";
import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

interface IProduct {
    _id: string;
    code: string;
    name: string;
    stock: number;
    category: string;
    cost: number;
    purchaseOrder: string;
    purchaseStatus: 'Vigente' | 'Salida';
    assignedOperator: string; // NUEVO
    totalEntradas?: number;
    totalSalidas?: number;
}

export default function ProductosPage() {
    const [initials, setInitials] = useState("...");
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    // Estados Formulario Registro
    const [code, setCode] = useState('');
    const [stock, setStock] = useState('0');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [cost, setCost] = useState('0');
    const [purchaseOrder, setPurchaseOrder] = useState('');
    const [assignedOperator, setAssignedOperator] = useState(''); // NUEVO
    const [loading, setLoading] = useState(false);

    // Estados de Datos Reales
    const [products, setProducts] = useState<IProduct[]>([]);
    const [tableLoading, setTableLoading] = useState(true);

    // Búsqueda Global
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
    const [selectedNames, setSelectedNames] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

    const [showFilters, setShowFilters] = useState<{ [key: string]: boolean }>({
        code: false,
        name: false,
        category: false,
        status: false
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Estados Edición
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<IProduct | null>(null);

    const categoriesList = ['Herramienta', 'Equipo', 'Insumos'];
    const statusList = ['Vigente', 'Salida'];

    // Lista de operadores (deberías obtenerla de tu API)
    const [operators, setOperators] = useState<{ _id: string; name: string }[]>([]);

    const uniqueCodes = Array.from(new Set(products.map(p => p.code))).sort();
    const uniqueNames = Array.from(new Set(products.map(p => p.name))).sort();

    // Cargar operadores
    useEffect(() => {
        fetchOperators();
        fetchProducts();
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name) {
                    const names = user.name.split(" ");
                    const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
                    setInitials(nameInitials);
                }
            } catch (error) { setInitials("PRO"); }
        }
    }, []);

    const fetchOperators = async () => {
        try {
            const res = await fetch('/api/operators');
            if (res.ok) {
                const data = await res.json();
                setOperators(data);
            }
        } catch (error) {
            console.error("Error cargando operadores:", error);
        }
    };

    const fetchProducts = async () => {
        setTableLoading(true);
        try {
            const [resProd, resHist] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/history')
            ]);

            if (!resProd.ok || !resHist.ok) throw new Error("Error en las peticiones");

            const dataProducts: IProduct[] = await resProd.json();
            const dataHistory: any[] = await resHist.json();

            const productsWithStats = dataProducts.map((p) => {
                const productHistory = dataHistory.filter((m) => m.productId === p._id);
                const entradas = productHistory.filter((m) => m.type === 'Entrada').reduce((acc, cur) => acc + cur.quantity, 0);
                const salidas = productHistory.filter((m) => m.type === 'Salida').reduce((acc, cur) => acc + cur.quantity, 0);
                return { ...p, totalEntradas: entradas, totalSalidas: salidas };
            });

            setProducts(productsWithStats);
        } catch (err) {
            console.error("Error cargando productos:", err);
            alert("No se pudieron cargar las estadísticas.");
        } finally {
            setTableLoading(false);
        }
    };

    const processedProducts = products
        .filter(product => {
            const matchesGlobal = searchTerm === '' ||
                product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.assignedOperator?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCode = selectedCodes.length === 0 || selectedCodes.includes(product.code);
            const matchesName = selectedNames.length === 0 || selectedNames.includes(product.name);
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(product.purchaseStatus);

            return matchesGlobal && matchesCode && matchesName && matchesCategory && matchesStatus;
        })
        .sort((a, b) => a._id.localeCompare(b._id));

    const exportToExcel = () => {
        if (processedProducts.length === 0) {
            alert("No hay datos para exportar con los filtros actuales.");
            return;
        }

        const dataToExport = processedProducts.map(p => ({
            "Código": p.code,
            "Producto": p.name,
            "Costo": p.cost,
            "Pedido de Compra": p.purchaseOrder,
            "Estado": p.purchaseStatus,
            "Asignado a": p.assignedOperator || '-',
            "Entradas": p.totalEntradas || 0,
            "Salidas": p.totalSalidas || 0,
            "Stock Actual": p.stock,
            "Categoría": p.category
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
        XLSX.writeFile(workbook, `Reporte_Inventario_${new Date().toLocaleDateString()}.xlsx`);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCodes, selectedNames, selectedCategories, selectedStatus, rowsPerPage]);

    const totalPages = Math.ceil(processedProducts.length / rowsPerPage);
    const currentItems = processedProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        console.log("=== DEBUG REGISTRO ===");
        console.log("Categoría:", category);
        console.log("AssignedOperator ANTES de enviar:", assignedOperator);
        console.log("Tipo de assignedOperator:", typeof assignedOperator);

        try {
            const body: any = {
                code,
                name,
                stock: parseInt(stock),
                category,
                cost: parseFloat(cost),
                purchaseOrder,
                purchaseStatus: 'Vigente'
            };

            // Siempre incluir assignedOperator si la categoría es "Equipo"
            if (category === 'Equipo') {
                body.assignedOperator = assignedOperator;
                console.log("✅ Incluyendo assignedOperator en body:", body.assignedOperator);
            } else {
                console.log("❌ No se incluye assignedOperator porque categoría no es Equipo");
            }

            console.log("📦 Body completo a enviar:", JSON.stringify(body, null, 2));

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const responseData = await res.json();
            console.log("📨 Respuesta del servidor:", responseData);

            if (res.ok) {
                console.log("✅ Producto registrado exitosamente");
                setCode('');
                setStock('0');
                setName('');
                setCategory('');
                setCost('0');
                setPurchaseOrder('');
                setAssignedOperator('');
                fetchProducts();
                alert('Producto registrado con éxito');
            } else {
                console.error("❌ Error en registro:", responseData);
                alert(responseData.error || 'Error al registrar');
            }
        } catch (err) {
            console.error("❌ Error de conexión:", err);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editForm) return;
        try {
            const res = await fetch(`/api/products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                setEditingId(null);
                fetchProducts();
            }
        } catch (err) { alert('Error de conexión'); }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            try {
                const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
                if (res.ok) fetchProducts();
            } catch (err) { alert('Error al eliminar'); }
        }
    };

    const handleStatusChange = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Vigente' ? 'Salida' : 'Vigente';
        if (window.confirm(`¿Cambiar estado a "${newStatus}"?`)) {
            const product = products.find(p => p._id === id);
            if (product) {
                const updatedProduct = { ...product, purchaseStatus: newStatus };
                try {
                    const res = await fetch(`/api/products`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedProduct),
                    });
                    if (res.ok) fetchProducts();
                } catch (err) { alert('Error al cambiar estado'); }
            }
        }
    };

    const toggleFilter = (column: string) => {
        setShowFilters(prev => ({
            ...prev,
            code: column === 'code' ? !prev.code : false,
            name: column === 'name' ? !prev.name : false,
            category: column === 'category' ? !prev.category : false,
            status: column === 'status' ? !prev.status : false
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    const FilterMenu = ({ title, options, selectedItems, setSelectedItems, isOpen }: any) => {
        if (!isOpen) return null;
        return (
            <div className="absolute top-10 left-0 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] py-3 animate-in fade-in zoom-in duration-150" onClick={e => e.stopPropagation()}>
                <div className="px-4 pb-2 border-b border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{title}</span>
                    {selectedItems.length > 0 && (
                        <button onClick={() => setSelectedItems([])} className="text-[9px] font-bold text-red-500 hover:underline">Limpiar</button>
                    )}
                </div>
                <div className="max-h-60 overflow-y-auto py-2">
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-[10px] text-gray-400 uppercase font-bold">Sin datos</div>
                    ) : (
                        options.map((opt: string) => (
                            <label key={opt} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer group transition-colors">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedItems.includes(opt)}
                                    onChange={() => {
                                        setSelectedItems((prev: string[]) =>
                                            prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
                                        );
                                    }}
                                />
                                <div className={`w-3.5 h-3.5 rounded border mr-3 flex items-center justify-center transition-all ${selectedItems.includes(opt) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                    {selectedItems.includes(opt) && <Icon icon="solar:check-read-bold" className="text-white text-[9px]" />}
                                </div>
                                <span className={`text-[11px] font-medium ${selectedItems.includes(opt) ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{opt}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => { setMenuOpen(false); setShowFilters({ code: false, name: false, category: false, status: false }); }}>
            <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gestión de Inventario</span>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
                        <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                        <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                        <span className="text-blue-600 font-bold">Productos</span>
                    </div>
                </div>

                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase hover:scale-105 active:scale-95 transition-all border-2 border-white">{initials}</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                            <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-semibold transition-colors">
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-6 lg:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Panel de Registro */}
                    <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Icon icon="solar:add-circle-bold" className="text-blue-500" />
                            Nuevo Producto
                        </h2>
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Código del producto</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="glyphs:barcode-duo" className="text-gray-400 text-2xl mr-3" />
                                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: HER-001" className="w-full outline-none bg-transparent text-sm text-gray-500 font-medium" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Stock inicial</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="f7:number-square-fill" className="text-gray-400 text-2xl mr-3" />
                                    <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="w-full outline-none bg-transparent text-sm text-gray-500 font-medium" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Nombre del producto</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="solar:box-minimalistic-linear" className="text-gray-400 text-2xl mr-3" />
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full outline-none bg-transparent text-sm text-gray-500 font-medium" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Clasificación</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="si:server-line" className="text-gray-400 text-2xl mr-3" />
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full outline-none bg-transparent cursor-pointer text-sm text-gray-500 font-medium" required>
                                        <option value="" disabled>Selecciona categoría</option>
                                        {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Campo Condicional: Asignar a Operador (solo para Equipo) */}
                            {category === 'Equipo' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Asignar a Operador</label>
                                    <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                        <Icon icon="solar:user-bold" className="text-gray-400 text-2xl mr-3" />
                                        <select
                                            value={assignedOperator}
                                            onChange={(e) => setAssignedOperator(e.target.value)}
                                            className="w-full outline-none bg-transparent cursor-pointer text-sm text-gray-500 font-medium"
                                            required={category === 'Equipo'}
                                        >
                                            <option value="">Selecciona un operador</option>
                                            {operators.map(op => (
                                                <option key={op._id} value={op.name}>{op.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Costo del producto ($)</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="solar:wallet-money-bold" className="text-gray-400 text-2xl mr-3" />
                                    <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className="w-full outline-none bg-transparent text-sm text-gray-500 font-medium" required />
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Pedido de Compra</label>
                                <div className="flex items-center border-b border-gray-200 py-2 focus-within:border-blue-500 transition-colors">
                                    <Icon icon="solar:document-text-bold" className="text-gray-400 text-2xl mr-3" />
                                    <input type="text" value={purchaseOrder} onChange={(e) => setPurchaseOrder(e.target.value)} placeholder="Ej: PO-2024-001" className="w-full outline-none bg-transparent text-sm text-gray-500 font-medium" />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full bg-[#0095ff] text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:bg-gray-300">
                                <Icon icon="solar:diskette-bold" /> {loading ? 'Registrando...' : 'Registrar producto'}
                            </button>
                        </form>
                    </div>

                    {/* Tabla de Productos */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto relative">
                        <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                            <div className="relative w-full xl:w-72">
                                <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                <input type="text" placeholder="Búsqueda global..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                            </div>

                            <div className="flex items-center gap-4 text-gray-600 text-sm font-medium flex-wrap">
                                <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100 hover:bg-green-600 hover:text-white transition-all font-bold text-xs shadow-sm">
                                    <Icon icon="solar:file-download-bold" className="text-lg" />
                                    <span>Exportar</span>
                                </button>

                                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-1.5 bg-white shadow-sm">
                                    <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="bg-transparent outline-none cursor-pointer text-xs font-bold">
                                        <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                                    </select>
                                </div>
                                <button onClick={fetchProducts} className="hover:text-blue-500 transition-colors p-1" title="Actualizar"><Icon icon="solar:refresh-bold" className="text-xl" /></button>
                                <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-2 py-1 border border-gray-200">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icon icon="solar:alt-arrow-left-bold" className="text-xl" /></button>
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mx-3 min-w-[50px] text-center">{currentPage} / {totalPages || 1}</span>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"><Icon icon="solar:alt-arrow-right-bold" className="text-xl" /></button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[1200px]">
                                <thead className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[120px] relative">
                                            <div className="flex items-center gap-2">
                                                <span>Código</span>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFilter('code'); }} className={`p-1 rounded ${selectedCodes.length > 0 ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100'}`}><Icon icon="solar:filter-bold" /></button>
                                            </div>
                                            <FilterMenu title="Códigos" options={uniqueCodes} selectedItems={selectedCodes} setSelectedItems={setSelectedCodes} isOpen={showFilters.code} />
                                        </th>
                                        <th className="px-4 py-3 min-w-[150px] relative">
                                            <div className="flex items-center gap-2">
                                                <span>Producto</span>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFilter('name'); }} className={`p-1 rounded ${selectedNames.length > 0 ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100'}`}><Icon icon="solar:filter-bold" /></button>
                                            </div>
                                            <FilterMenu title="Nombres" options={uniqueNames} selectedItems={selectedNames} setSelectedItems={setSelectedNames} isOpen={showFilters.name} />
                                        </th>
                                        <th className="px-4 py-3">Costo ($)</th>
                                        <th className="px-4 py-3">Pedido Compra</th>
                                        <th className="px-4 py-3">Asignado a</th>
                                        <th className="px-4 py-3 min-w-[100px] relative">
                                            <div className="flex items-center gap-2">
                                                <span>Estado</span>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFilter('status'); }} className={`p-1 rounded ${selectedStatus.length > 0 ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100'}`}><Icon icon="solar:filter-bold" /></button>
                                            </div>
                                            <FilterMenu title="Estado" options={statusList} selectedItems={selectedStatus} setSelectedItems={setSelectedStatus} isOpen={showFilters.status} />
                                        </th>
                                        <th className="px-4 py-3 text-center text-green-600">Entradas</th>
                                        <th className="px-4 py-3 text-center text-red-600">Salidas</th>
                                        <th className="px-4 py-3 text-center">Stock</th>
                                        <th className="px-4 py-3 min-w-[120px] relative">
                                            <div className="flex items-center gap-2">
                                                <span>Categoría</span>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFilter('category'); }} className={`p-1 rounded ${selectedCategories.length > 0 ? 'text-blue-600 bg-blue-50' : 'hover:bg-gray-100'}`}><Icon icon="solar:filter-bold" /></button>
                                            </div>
                                            <FilterMenu title="Clasificación" options={categoriesList} selectedItems={selectedCategories} setSelectedItems={setSelectedCategories} isOpen={showFilters.category} />
                                        </th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {!tableLoading && currentItems.map((product) => (
                                        <tr key={product._id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                                            {editingId === product._id ? (
                                                <>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none font-medium text-sm text-gray-500"
                                                            value={editForm?.code ?? ''}
                                                            onChange={e => setEditForm({ ...editForm!, code: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none font-medium text-sm text-gray-500"
                                                            value={editForm?.name ?? ''}
                                                            onChange={e => setEditForm({ ...editForm!, name: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none font-medium text-sm text-gray-500"
                                                            value={editForm?.cost?.toString() ?? '0'}
                                                            onChange={e => {
                                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                                setEditForm({ ...editForm!, cost: isNaN(value) ? 0 : value });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none font-medium text-sm text-gray-500"
                                                            value={editForm?.purchaseOrder ?? ''}
                                                            onChange={e => setEditForm({ ...editForm!, purchaseOrder: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none font-medium text-sm text-gray-500"
                                                            value={editForm?.assignedOperator ?? ''}
                                                            onChange={e => setEditForm({ ...editForm!, assignedOperator: e.target.value })}
                                                            placeholder="Asignar a operador"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            className="bg-transparent border-b border-blue-400 outline-none font-bold uppercase text-[10px] text-gray-500"
                                                            value={editForm?.purchaseStatus ?? 'Vigente'}
                                                            onChange={e => setEditForm({ ...editForm!, purchaseStatus: e.target.value as 'Vigente' | 'Salida' })}
                                                        >
                                                            <option value="Vigente">Vigente</option>
                                                            <option value="Salida">Salida</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-bold text-green-600 text-sm">{product.totalEntradas || 0}</td>
                                                    <td className="px-4 py-4 text-center font-bold text-red-600 text-sm">{product.totalSalidas || 0}</td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent border-b border-blue-400 outline-none text-center font-medium text-sm"
                                                            value={editForm?.stock?.toString() ?? '0'}
                                                            onChange={e => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                setEditForm({ ...editForm!, stock: isNaN(value) ? 0 : value });
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            className="bg-transparent border-b border-blue-400 outline-none font-bold uppercase text-[10px] text-gray-500"
                                                            value={editForm?.category ?? ''}
                                                            onChange={e => setEditForm({ ...editForm!, category: e.target.value })}
                                                        >
                                                            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-center flex justify-center gap-2">
                                                        <button onClick={handleSaveEdit} className="text-green-500 hover:scale-110">
                                                            <Icon icon="solar:check-read-bold" className="text-xl" />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="text-red-400 hover:scale-110">
                                                            <Icon icon="solar:close-circle-bold" className="text-xl" />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-4 text-xs font-black text-blue-600">{product.code}</td>
                                                    <td className="px-4 py-4 text-gray-600 font-medium text-xs">{product.name}</td>
                                                    <td className="px-4 py-4 text-xs font-bold text-green-600">${product.cost?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-4 text-xs text-gray-500 font-mono">{product.purchaseOrder || '-'}</td>
                                                    <td className="px-4 py-4 text-xs text-gray-500">
                                                        {product.category === 'Equipo' ? (
                                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[9px] font-bold">
                                                                {product.assignedOperator || 'No asignado'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={() => handleStatusChange(product._id, product.purchaseStatus)}
                                                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-full transition-all ${product.purchaseStatus === 'Vigente' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                                                        >
                                                            {product.purchaseStatus}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-green-600 font-bold text-xs">{product.totalEntradas || 0}</td>
                                                    <td className="px-4 py-4 text-center text-red-600 font-bold text-xs">{product.totalSalidas || 0}</td>
                                                    <td className="px-4 py-4 text-center text-gray-800 font-bold text-xs">{product.stock}</td>
                                                    <td className="px-4 py-4"><span className="bg-white border border-gray-200 text-gray-500 text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-tighter">{product.category}</span></td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => {
                                                                setEditingId(product._id);
                                                                setEditForm({
                                                                    ...product,
                                                                    cost: product.cost ?? 0,
                                                                    purchaseOrder: product.purchaseOrder ?? '',
                                                                    purchaseStatus: product.purchaseStatus ?? 'Vigente',
                                                                    assignedOperator: product.assignedOperator ?? '',
                                                                    stock: product.stock ?? 0,
                                                                    code: product.code ?? '',
                                                                    name: product.name ?? '',
                                                                    category: product.category ?? ''
                                                                });
                                                            }} className="text-amber-500 bg-amber-50 p-1.5 rounded-lg hover:bg-amber-100 transition-all"><Icon icon="solar:pen-bold" /></button>
                                                            <button onClick={() => handleDelete(product._id)} className="text-red-500 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-all"><Icon icon="solar:trash-bin-trash-bold" /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {tableLoading && (
                            <div className="py-20 flex flex-col items-center justify-center text-blue-500 gap-3">
                                <Icon icon="solar:restart-linear" className="text-4xl animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Sincronizando inventario...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}