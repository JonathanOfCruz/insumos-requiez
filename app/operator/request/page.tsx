"use client";
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

interface ITempItem {
    key: string;
    _id: string;
    code: string;
    name: string;
    category: string;
    quantity: number;
}

interface IProduct {
    _id: string;
    code: string;
    name: string;
    category: string;
    stock: number;
}

export default function OperatorRequestPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [initials, setInitials] = useState("...");
    const [operator, setOperator] = useState({ id: '', name: '', area: '' });

    const [dbProducts, setDbProducts] = useState<IProduct[]>([]);
    const [loadingTable, setLoadingTable] = useState(true);

    const [code, setCode] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [validProduct, setValidProduct] = useState<{ _id: string, name: string, category: string } | null>(null);

    const [addedItems, setAddedItems] = useState<ITempItem[]>([]);
    const [submitError, setSubmitError] = useState('');
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (res.ok) setDbProducts(data);
        } catch (error) {
            console.error("Error cargando productos:", error);
        } finally {
            setLoadingTable(false);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const userData = localStorage.getItem("user");

        if (!userData) {
            router.replace('/');
            return;
        }

        try {
            const user = JSON.parse(userData);

            // VALIDACIÓN FLEXIBLE: Acepta _id (Mongo), id (SQL) o employeeNumber
            const opId = user._id || user.id || user.employeeNumber;

            if (!opId) {
                console.error("Error: El objeto de usuario no contiene un ID válido", user);
                localStorage.removeItem("user");
                router.replace('/');
                return;
            }

            setOperator({
                id: String(opId),
                name: user.name || 'Operador',
                area: user.area || 'General'
            });

            const names = (user.name || "OP").split(" ");
            const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
            setInitials(nameInitials);

            setIsAuthorized(true);
            fetchProducts();
        } catch (error) {
            console.error("Error crítico en sesión:", error);
            router.replace('/');
        }
    }, [router, fetchProducts]);

    const handleCodeBlur = async () => {
        const trimmedCode = code.trim();
        if (!trimmedCode) return;
        setLoadingSearch(true);
        setSearchError('');
        try {
            const res = await fetch(`/api/products/autocomplete?code=${encodeURIComponent(trimmedCode)}`);
            const data = await res.json();
            if (res.ok) setValidProduct(data);
            else setSearchError(data.error || 'No encontrado');
        } catch (err) {
            setSearchError('Error de red');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleAddItem = (e: React.MouseEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity);
        if (!validProduct || isNaN(qty) || qty <= 0) return;

        const existingIndex = addedItems.findIndex(item => item.code === code.trim());
        if (existingIndex !== -1) {
            const updated = [...addedItems];
            updated[existingIndex].quantity += qty;
            setAddedItems(updated);
        } else {
            setAddedItems([...addedItems, {
                key: `${validProduct._id}-${Date.now()}`,
                _id: validProduct._id,
                code: code.trim(),
                name: validProduct.name,
                category: validProduct.category,
                quantity: qty
            }]);
        }
        setCode(''); setQuantity(''); setValidProduct(null);
    };

    const handleSubmitFinalRequest = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (addedItems.length === 0) return;

        setLoadingSubmit(true);
        setSubmitError('');

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // CAMBIO CLAVE: Cambiamos 'operator' por 'operatorId' 
                    // para que coincida con tu route.js
                    operatorId: operator.id,
                    items: addedItems.map(i => ({
                        product: i._id,
                        quantityRequested: i.quantity
                    }))
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setAddedItems([]);
                alert("✅ Solicitud enviada al administrador.");
            } else {
                setSubmitError(data.error || "Error al enviar la solicitud");
            }
        } catch (err) {
            setSubmitError('Error de conexión.');
        } finally {
            setLoadingSubmit(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center">
                <div className="text-center">
                    <Icon icon="solar:restart-linear" className="animate-spin text-5xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
            {/* Header */}
            <div className="flex justify-end items-center mb-8 gap-6">
                <div className="flex gap-4 items-center border border-gray-100 bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs tracking-wider">{initials}</div>
                    <div>
                        <p className="font-bold text-gray-800 leading-none">{operator.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{operator.area}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    className="text-gray-400 bg-white p-4 rounded-full border border-gray-100 shadow-sm hover:text-red-500 transition-colors"
                >
                    <Icon icon="solar:logout-2-linear" className="text-2xl" />
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3 flex flex-col gap-8">
                    {/* Formulario Añadir */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                        {loadingSearch && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl"><Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" /></div>}
                        <h3 className="font-bold text-gray-800 mb-6">Agregar Insumo</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Código</label>
                                <div className="flex items-center text-gray-600 border-b border-gray-100 focus-within:border-blue-500 py-2">
                                    <Icon icon="glyphs:barcode-duo" className="text-gray-600 text-xl mr-2" />
                                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} onBlur={handleCodeBlur} placeholder="Ej: PIN-01" className="w-full outline-none text-gray-800 font-medium bg-transparent" />
                                </div>
                                {searchError && <p className="text-red-500 text-[10px] mt-1 font-bold">{searchError}</p>}
                                {validProduct && <p className="text-blue-500 text-[10px] mt-1 font-bold">✓ {validProduct.name}</p>}
                            </div>

                            <div>
                                <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Cantidad</label>
                                <div className="flex items-center text-gray-600 border-b border-gray-100 focus-within:border-blue-500 py-2">
                                    <Icon icon="f7:number-square-fill" className="text-gray-600 text-xl mr-2" />
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full outline-none text-gray-800 font-medium bg-transparent" disabled={!validProduct} />
                                </div>
                            </div>

                            <button type="button" onClick={handleAddItem} disabled={!validProduct} className="w-full bg-[#0095ff] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-md">
                                <Icon icon="solar:box-plus-bold" /> Añadir a lista
                            </button>
                        </div>
                    </div>

                    {/* Resumen Final */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6 text-xl">Solicitud Actual</h3>
                        <div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-2">
                            {addedItems.length === 0 && <p className="text-center py-10 text-gray-300 text-sm italic">Lista vacía</p>}
                            {addedItems.map((item) => (
                                <div key={item.key} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">{item.code} • {item.quantity} unidades</p>
                                    </div>
                                    <button type="button" onClick={() => setAddedItems(addedItems.filter(i => i.key !== item.key))} className="text-gray-300 hover:text-red-500"><Icon icon="solar:close-circle-bold" className="text-xl" /></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleSubmitFinalRequest} disabled={loadingSubmit || addedItems.length === 0} className="w-full bg-gray-800 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-black shadow-lg disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95">
                            {loadingSubmit ? <Icon icon="solar:restart-linear" className="animate-spin text-xl" /> : 'Confirmar Solicitud'}
                        </button>
                        {submitError && <p className="text-red-500 text-xs text-center mt-4 font-bold">{submitError}</p>}
                    </div>
                </div>

                {/* Tabla de Referencia */}
                <div className="lg:w-2/3 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-800">Catálogo</h3>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{dbProducts.length} productos</span>
                    </div>
                    <div className="overflow-x-auto">
                        {loadingTable ? (
                            <div className="py-20 text-center"><Icon icon="solar:restart-linear" className="animate-spin text-4xl text-blue-500 mx-auto" /></div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-gray-400 uppercase border-b border-gray-50">
                                    <tr>
                                        <th className="px-4 py-4 font-bold">Código</th>
                                        <th className="px-4 py-4 font-bold">Descripción</th>
                                        <th className="px-4 py-4 font-bold text-center">Categoría</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {dbProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-5 font-bold text-gray-700">{product.code}</td>
                                            <td className="px-4 py-5 text-gray-500">{product.name}</td>
                                            <td className="px-4 py-5 text-center">
                                                <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider">{product.category}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}