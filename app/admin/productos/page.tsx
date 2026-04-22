"use client";
import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface IProduct {
    _id: string;
    code: string;
    name: string;
    stock: number;
    category: string;
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
    const [loading, setLoading] = useState(false);

    // Estados de Datos Reales
    const [products, setProducts] = useState<IProduct[]>([]);
    const [tableLoading, setTableLoading] = useState(true);

    // Búsqueda y Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCode, setFilterCode] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    
    const [showFilters, setShowFilters] = useState<{ [key: string]: boolean }>({
        code: false,
        name: false,
        category: false
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Estados Edición
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<IProduct | null>(null);

    const categories = ['Herramienta', 'Equipo', 'Insumos'];

    useEffect(() => {
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

    const fetchProducts = async () => {
        setTableLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            
            if (res.ok) {
                // Obtenemos los totales de movimientos para cada producto
                const productsWithStats = await Promise.all(data.map(async (p: IProduct) => {
                    const resHist = await fetch(`/api/history/${p._id}`);
                    const historyData = await resHist.json();
                    
                    const entradas = historyData
                        .filter((m: any) => m.type === 'Entrada')
                        .reduce((acc: number, cur: any) => acc + cur.quantity, 0);
                    
                    const salidas = historyData
                        .filter((m: any) => m.type === 'Salida')
                        .reduce((acc: number, cur: any) => acc + cur.quantity, 0);

                    return { ...p, totalEntradas: entradas, totalSalidas: salidas };
                }));
                setProducts(productsWithStats);
            }
        } catch (err) { console.error(err); } finally { setTableLoading(false); }
    };

    const processedProducts = products
        .filter(product => {
            const matchesGlobal = searchTerm === '' || 
                product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCode = filterCode === '' || product.code.toLowerCase().includes(filterCode.toLowerCase());
            const matchesName = filterName === '' || product.name.toLowerCase().includes(filterName.toLowerCase());
            const matchesCategory = filterCategory === '' || product.category === filterCategory;

            return matchesGlobal && matchesCode && matchesName && matchesCategory;
        })
        .sort((a, b) => a._id.localeCompare(b._id));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCode, filterName, filterCategory, rowsPerPage]);

    const totalItems = processedProducts.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = processedProducts.slice(indexOfFirstItem, indexOfLastItem);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, name, stock: parseInt(stock), category }),
            });
            if (res.ok) {
                setCode(''); setStock('0'); setName(''); setCategory('');
                fetchProducts();
                alert('Producto registrado con éxito');
            }
        } catch (err) { alert('Error de conexión'); } finally { setLoading(false); }
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

    const toggleFilter = (column: string) => {
        setShowFilters(prev => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10" onClick={() => setMenuOpen(false)}>
            <div className="flex justify-between items-center mb-8 relative">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                    <Icon icon="solar:alt-arrow-right-linear" />
                    <span className="text-blue-600 font-bold">Productos</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="relative">
                            <label className="text-gray-600 text-sm mb-2 block font-medium">Código del producto</label>
                            <div className="flex items-center border-b border-gray-200 py-2">
                                <Icon icon="glyphs:barcode-duo" className="text-gray-500 text-2xl mr-3" />
                                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: HER-001" className="w-full text-gray-800 outline-none" required />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-gray-600 text-sm mb-2 block font-medium">Stock inicial</label>
                            <div className="flex items-center border-b border-gray-200 py-2">
                                <Icon icon="f7:number-square-fill" className="text-gray-500 text-2xl mr-3" />
                                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="w-full text-gray-800 outline-none" required />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-gray-600 text-sm mb-2 block font-medium">Nombre del producto</label>
                            <div className="flex items-center border-b border-gray-200 py-2">
                                <Icon icon="solar:box-minimalistic-linear" className="text-gray-500 text-2xl mr-3" />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full text-gray-800 outline-none" required />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-gray-600 text-sm mb-2 block font-medium">Clasificación</label>
                            <div className="flex items-center border-b border-gray-200 py-2">
                                <Icon icon="si:server-line" className="text-gray-500 text-2xl mr-3" />
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-gray-800 outline-none bg-transparent" required>
                                    <option value="" disabled>Selecciona categoría</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                        <button disabled={loading} className="w-full bg-[#0095ff] text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:bg-gray-300">
                            <Icon icon="solar:diskette-bold" /> {loading ? 'Registrando...' : 'Registrar producto'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                        <div className="relative w-full xl:w-72">
                            <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input type="text" placeholder="Búsqueda global..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </div>

                        <div className="flex items-center gap-4 text-gray-600 text-sm font-medium">
                            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="bg-transparent outline-none cursor-pointer">
                                    <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                                </select>
                            </div>
                            <span>{totalItems === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems}</span>
                            <button onClick={fetchProducts} className="hover:text-blue-500 transition-colors p-1"><Icon icon="solar:refresh-bold" className="text-xl" /></button>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><Icon icon="solar:alt-arrow-left-bold" className="text-xl" /></button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><Icon icon="solar:alt-arrow-right-bold" className="text-xl" /></button>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                        <thead className="text-[11px] text-gray-400 uppercase">
                            <tr>
                                <th className="px-4 py-3 min-w-[120px]">
                                    <div className="flex items-center gap-2"><span>Código</span><button onClick={() => toggleFilter('code')}><Icon icon="solar:filter-bold-duotone" /></button></div>
                                    {showFilters.code && <input autoFocus type="text" value={filterCode} onChange={e => setFilterCode(e.target.value)} className="mt-2 w-full text-[10px] p-1 border border-gray-200 rounded outline-none" />}
                                </th>
                                <th className="px-4 py-3 min-w-[150px]">
                                    <div className="flex items-center gap-2"><span>Producto</span><button onClick={() => toggleFilter('name')}><Icon icon="solar:filter-bold-duotone" /></button></div>
                                    {showFilters.name && <input autoFocus type="text" value={filterName} onChange={e => setFilterName(e.target.value)} className="mt-2 w-full text-[10px] p-1 border border-gray-200 rounded outline-none" />}
                                </th>
                                <th className="px-4 py-3 text-center text-green-600">Entradas</th>
                                <th className="px-4 py-3 text-center text-red-600">Salidas</th>
                                <th className="px-4 py-3 text-center">Stock Actual</th>
                                <th className="px-4 py-3 min-w-[120px]">
                                    <div className="flex items-center gap-2"><span>Categoría</span><button onClick={() => toggleFilter('category')}><Icon icon="solar:filter-bold-duotone" /></button></div>
                                    {showFilters.category && <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-2 w-full text-[10px] p-1 border border-gray-200 rounded outline-none"><option value="">Todas</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>}
                                </th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!tableLoading && currentItems.map((product) => (
                                <tr key={product._id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                                    {editingId === product._id ? (
                                        <>
                                            <td className="px-4 py-4"><input className="w-full bg-transparent border-b border-blue-400 outline-none font-bold" value={editForm?.code} onChange={e => setEditForm({ ...editForm!, code: e.target.value })} /></td>
                                            <td className="px-4 py-4"><input className="w-full bg-transparent border-b border-blue-400 outline-none" value={editForm?.name} onChange={e => setEditForm({ ...editForm!, name: e.target.value })} /></td>
                                            <td className="px-4 py-4 text-center font-bold text-green-600">{product.totalEntradas || 0}</td>
                                            <td className="px-4 py-4 text-center font-bold text-red-600">{product.totalSalidas || 0}</td>
                                            <td className="px-4 py-4"><input type="number" className="w-full bg-transparent border-b border-blue-400 outline-none text-center" value={editForm?.stock} onChange={e => setEditForm({ ...editForm!, stock: parseInt(e.target.value) })} /></td>
                                            <td className="px-4 py-4">
                                                <select className="bg-transparent border-b border-blue-400 outline-none text-[10px] font-bold uppercase" value={editForm?.category} onChange={e => setEditForm({ ...editForm!, category: e.target.value })}>
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 text-center flex justify-center gap-2">
                                                <button onClick={handleSaveEdit} className="text-green-500 hover:scale-110"><Icon icon="solar:check-read-bold" className="text-xl" /></button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:scale-110"><Icon icon="solar:close-circle-bold" className="text-xl" /></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-4 text-xs font-black text-blue-600">{product.code}</td>
                                            <td className="px-4 py-4 text-gray-600 font-medium text-xs">{product.name}</td>
                                            <td className="px-4 py-4 text-center text-green-600 font-bold text-xs">{product.totalEntradas || 0}</td>
                                            <td className="px-4 py-4 text-center text-red-600 font-bold text-xs">{product.totalSalidas || 0}</td>
                                            <td className="px-4 py-4 text-center text-gray-800 font-bold text-xs">{product.stock}</td>
                                            <td className="px-4 py-4">
                                                <span className="bg-white border border-gray-200 text-gray-500 text-[9px] px-2 py-1 rounded-full font-black uppercase">{product.category}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingId(product._id); setEditForm(product); }} className="text-amber-500 bg-amber-50 p-1.5 rounded hover:bg-amber-100 transition-all"><Icon icon="solar:pen-bold" /></button>
                                                    <button onClick={() => handleDelete(product._id)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100 transition-all"><Icon icon="solar:trash-bin-trash-bold" /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}