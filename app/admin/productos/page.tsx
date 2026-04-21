"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface IProduct {
    _id: string;
    code: string;
    name: string;
    stock: number;
    category: string;
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
    const [error, setError] = useState('');

    // Estados Tabla y Paginación
    const [products, setProducts] = useState<IProduct[]>([]);
    const [tableLoading, setTableLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

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
                } else { setInitials("ABC"); }
            } catch (error) { setInitials("ABC"); }
        }
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (res.ok) setProducts(data);
        } catch (err) { console.error(err); } finally { setTableLoading(false); }
    };

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
        } catch (err) { setError('Error de conexión'); } finally { setLoading(false); }
    };

    const handleSaveEdit = async () => {
        if (!editForm) return;

        try {
            // Asegúrate de que la ruta coincida con tu estructura de carpetas en /api/products
            // Si tu archivo es /api/products/route.ts, usa solo '/api/products'
            const res = await fetch(`/api/products`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();

            if (res.ok) {
                setEditingId(null);
                await fetchProducts(); // Recargamos la tabla
                alert('Cambios guardados correctamente');
            } else {
                console.error("Error del servidor:", data.error);
                alert(`No se pudo guardar: ${data.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            alert('Error de conexión con el servidor');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm("¿Estás seguro de eliminar este producto?");
        if (confirmDelete) {
            try {
                // CAMBIO: Agregamos ?id= antes del id
                const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });

                if (res.ok) {
                    fetchProducts();
                    alert('Producto eliminado');
                } else {
                    alert('Error al eliminar el producto');
                }
            } catch (err) {
                alert('Error al eliminar');
            }
        }
    };

    const indexOfLastItem = currentPage * rowsPerPage;
    const indexOfFirstItem = indexOfLastItem - rowsPerPage;
    const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(products.length / rowsPerPage);

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10" onClick={() => setMenuOpen(false)}>
            <div className="flex justify-between items-center mb-8 relative">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors">Inicio</Link>
                    <Icon icon="solar:alt-arrow-right-linear" />
                    <span className="text-blue-600 font-medium">Productos</span>
                </div>
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow uppercase hover:bg-blue-600 transition-colors">{initials}</button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <button onClick={() => { localStorage.removeItem("user"); router.push("/"); }} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                <Icon icon="solar:logout-3-bold" className="text-xl" />
                                <span className="font-semibold">Cerrar sesión</span>
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
                                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ingresa el código" className="w-full text-gray-800 outline-none" required />
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
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ingresa el nombre" className="w-full text-gray-800 outline-none" required />
                            </div>
                        </div>
                        <div className="relative">
                            <label className="text-gray-600 text-sm mb-2 block font-medium">Clasificación</label>
                            <div className="flex items-center border-b border-gray-200 py-2">
                                <Icon icon="si:server-line" className="text-gray-500 text-2xl mr-3" />
                                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-gray-800 outline-none bg-transparent" required>
                                    <option value="" disabled>Selecciona una clasificación</option>
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
                    <div className="flex justify-between items-center mb-6 gap-4">
                        <p className="text-[10px] text-gray-400">
                            Mostrando <span className="font-bold text-gray-600">{products.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, products.length)}</span> de <span className="font-bold text-gray-600">{products.length}</span> filas
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 border rounded-full px-3 py-1 text-xs text-gray-400 focus-within:border-blue-500 transition-colors">
                                <Icon icon="solar:magnifer-linear" />
                                <input type="text" placeholder="Buscar..." className="outline-none bg-transparent w-24" />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 transition-all"><Icon icon="solar:alt-arrow-left-linear" className="text-lg text-gray-600" /></button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 transition-all"><Icon icon="solar:alt-arrow-right-linear" className="text-lg text-gray-600" /></button>
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-gray-400 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!tableLoading && currentItems.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50 transition-colors group">
                                    {editingId === product._id ? (
                                        <>
                                            <td className="px-4 py-4"><input className="w-full bg-blue-50 border-b border-blue-400 outline-none p-1 font-bold text-gray-600" value={editForm?.code} onChange={e => setEditForm({ ...editForm!, code: e.target.value })} /></td>
                                            <td className="px-4 py-4"><input className="w-full bg-blue-50 border-b border-blue-400 outline-none p-1 text-gray-600" value={editForm?.name} onChange={e => setEditForm({ ...editForm!, name: e.target.value })} /></td>
                                            <td className="px-4 py-4"><input type="number" className="w-full bg-blue-50 border-b border-blue-400 outline-none p-1 text-center text-gray-600" value={editForm?.stock} onChange={e => setEditForm({ ...editForm!, stock: parseInt(e.target.value) })} /></td>
                                            <td className="px-4 py-4">
                                                <select className="bg-blue-50 border-b border-blue-400 outline-none p-1 text-[10px] uppercase font-bold text-gray-600" value={editForm?.category} onChange={e => setEditForm({ ...editForm!, category: e.target.value })}>
                                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={handleSaveEdit} className="text-green-500 bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-all"><Icon icon="solar:check-read-bold" className="text-xl" /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-gray-400 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-all"><Icon icon="solar:close-circle-bold" className="text-xl" /></button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-4 font-bold text-gray-800">{product.code}</td>
                                            <td className="px-4 py-4 text-gray-600">{product.name}</td>
                                            <td className="px-4 py-4 text-center text-gray-600">{product.stock}</td>
                                            <td className="px-4 py-4">
                                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{product.category}</span>
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
                    {products.length === 0 && !tableLoading && <p className="text-center py-10 text-gray-300 text-xs italic font-medium">No hay registros disponibles en el sistema</p>}
                </div>
            </div>
        </main>
    );
}