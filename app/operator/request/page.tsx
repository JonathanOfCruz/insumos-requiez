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

    // ESTADOS DE SEGUIMIENTO (La Card depende de estos dos)
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
    const [requestStatus, setRequestStatus] = useState<string | null>(null);

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

    // 1. FUNCIÓN DE CONSULTA (Polling) - Validada para evitar "undefined"
    const checkStatus = useCallback(async (id: string) => {
        if (!id || id === 'undefined' || id === 'null') return;
        try {
            const res = await fetch(`/api/requests/${id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.status && data.status !== requestStatus) {
                    setRequestStatus(data.status);
                    localStorage.setItem("activeRequestStatus", data.status);
                }
            }
        } catch (error) {
            console.error("Error consultando estado:", error);
        }
    }, [requestStatus]);

    // 2. CONTROL DEL INTERVALO
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeRequestId && activeRequestId !== 'undefined' && requestStatus === 'Pendiente') {
            interval = setInterval(() => checkStatus(activeRequestId), 5000);
        }
        return () => clearInterval(interval);
    }, [activeRequestId, requestStatus, checkStatus]);

    // 3. CARGA DE PRODUCTOS
    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (res.ok) setDbProducts(data);
        } finally {
            setLoadingTable(false);
        }
    }, []);

    // 4. VERIFICACIÓN DE SESIÓN Y RECUPERACIÓN DE DATOS
    useEffect(() => {
        if (typeof window === "undefined") return;
        const userData = localStorage.getItem("user");
        if (!userData) { router.replace('/'); return; }

        try {
            const user = JSON.parse(userData);
            const opId = user._id || user.id || user.employeeNumber;
            setOperator({ id: String(opId), name: user.name || 'Operador', area: user.area || 'General' });

            // Recuperar ID guardado con limpieza estricta
            const savedId = localStorage.getItem("activeRequestId");
            const savedStatus = localStorage.getItem("activeRequestStatus");

            if (savedId && savedId !== 'undefined' && savedId !== 'null') {
                setActiveRequestId(savedId);
                setRequestStatus(savedStatus || 'Pendiente');
            }

            const names = (user.name || "OP").split(" ");
            setInitials(names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3));
            setIsAuthorized(true);
            fetchProducts();
        } catch (error) { router.replace('/'); }
    }, [router, fetchProducts]);

    const handleCodeBlur = async () => {
        if (!code.trim()) return;
        setLoadingSearch(true);
        setSearchError('');
        try {
            const res = await fetch(`/api/products/autocomplete?code=${encodeURIComponent(code.trim())}`);
            const data = await res.json();
            if (res.ok) setValidProduct(data);
            else setSearchError(data.error || 'No encontrado');
        } finally { setLoadingSearch(false); }
    };

    const handleAddItem = (e: React.MouseEvent) => {
        e.preventDefault();
        const qty = parseInt(quantity);
        if (!validProduct || isNaN(qty) || qty <= 0) return;
        setAddedItems([...addedItems, {
            key: `${validProduct._id}-${Date.now()}`,
            _id: validProduct._id,
            code: code.trim(),
            name: validProduct.name,
            category: validProduct.category,
            quantity: qty
        }]);
        setCode(''); setQuantity(''); setValidProduct(null);
    };

    // 5. ENVÍO DE SOLICITUD - AQUÍ SE ACTIVA LA CARD
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
                    operatorId: operator.id,
                    items: addedItems.map(i => ({ product: i._id, quantityRequested: i.quantity }))
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // CAMBIO AQUÍ: Tu API devuelve "requestId"
                const newId = data.requestId || data._id || data.id;

                if (newId) {
                    const stringId = String(newId);
                    setAddedItems([]);
                    setActiveRequestId(stringId);
                    setRequestStatus('Pendiente');
                    localStorage.setItem("activeRequestId", stringId);
                    localStorage.setItem("activeRequestStatus", 'Pendiente');
                    // La Card aparecerá ahora porque activeRequestId ya no es nulo
                } else {
                    setSubmitError("Solicitud enviada, pero el servidor no retornó el ID.");
                }
            } else {
                setSubmitError(data.error || "Error al procesar la solicitud");
            }
        } catch (err) {
            setSubmitError('Error de red.');
        } finally {
            setLoadingSubmit(false);
        }
    };

    const closeStatusCard = () => {
        setActiveRequestId(null);
        setRequestStatus(null);
        localStorage.removeItem("activeRequestId");
        localStorage.removeItem("activeRequestStatus");
    };

    if (!isAuthorized) return null;

    return (
        <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
            {/* Header con botón de salir */}
            <div className="flex justify-end items-center mb-8 gap-6">
                <div className="flex gap-4 items-center border border-gray-100 bg-white p-4 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs tracking-wider">{initials}</div>
                    <div>
                        <p className="font-bold text-gray-800 leading-none">{operator.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{operator.area}</p>
                    </div>
                </div>
                <button
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    className="text-gray-400 bg-white p-4 rounded-full border border-gray-100 shadow-sm hover:text-red-500 transition-all active:scale-90"
                >
                    <Icon icon="solar:logout-2-linear" className="text-2xl" />
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3 flex flex-col gap-8">

                    {/* --- CARD DE ESTADO (Prioritaria) --- */}
                    {activeRequestId && activeRequestId !== 'undefined' && (
                        <div className={`p-8 rounded-2xl shadow-xl border-2 transition-all duration-500 transform scale-100 ${requestStatus === 'Pendiente' ? 'bg-blue-50 border-blue-200' :
                                requestStatus === 'Aprobada' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center gap-4 mb-4">
                                <Icon
                                    icon={requestStatus === 'Pendiente' ? "solar:clock-circle-bold-duotone" : requestStatus === 'Aprobada' ? "solar:check-circle-bold" : "solar:close-circle-bold"}
                                    className={`text-4xl ${requestStatus === 'Pendiente' ? 'text-blue-500 animate-pulse' : requestStatus === 'Aprobada' ? 'text-green-500' : 'text-red-500'}`}
                                />
                                <h3 className="font-bold text-gray-800 text-lg uppercase tracking-tight">
                                    {requestStatus === 'Pendiente' ? 'Revisión en curso' :
                                        requestStatus === 'Aprobada' ? 'Aprobado' : 'Rechazado'}
                                </h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                                {requestStatus === 'Pendiente' ? 'Hemos recibido tu lista. En breve el administrador dará respuesta.' :
                                    requestStatus === 'Aprobada' ? 'Todo listo. Puedes retirar tus productos en el almacén.' :
                                        'Tu solicitud no pudo ser procesada. Intenta de nuevo o pregunta al jefe de área.'}
                            </p>
                            {requestStatus !== 'Pendiente' && (
                                <button onClick={closeStatusCard} className="w-full bg-gray-800 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-all">
                                    Cerrar Notificación
                                </button>
                            )}
                        </div>
                    )}

                    {/* Formulario e Inputs */}
                    <div className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative transition-opacity ${activeRequestId && requestStatus === 'Pendiente' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        {loadingSearch && <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl"><Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" /></div>}
                        <h3 className="font-bold text-gray-800 mb-6">Nuevo Insumo</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-gray-400 text-[10px] font-bold uppercase mb-1 block">Código de Barras</label>
                                <div className="flex items-center text-gray-600 border-b border-gray-100 focus-within:border-blue-500 py-2">
                                    <Icon icon="glyphs:barcode-duo" className="text-gray-600 text-xl mr-2" />
                                    <input type="text" value={code} onChange={(e) => setCode(e.target.value)} onBlur={handleCodeBlur} placeholder="PIN-01" className="w-full outline-none text-gray-800 font-medium bg-transparent" />
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
                            <button type="button" onClick={handleAddItem} disabled={!validProduct} className="w-full bg-[#0095ff] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-blue-600 disabled:bg-gray-100 transition-all">
                                <Icon icon="solar:box-plus-bold" /> Añadir a lista
                            </button>
                        </div>
                    </div>

                    {/* Resumen Final */}
                    <div className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-opacity ${activeRequestId && requestStatus === 'Pendiente' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <h3 className="font-bold text-gray-800 mb-6 text-xl">Confirmar</h3>
                        <div className="space-y-3 mb-8 max-h-64 overflow-y-auto pr-2">
                            {addedItems.length === 0 && <p className="text-center py-10 text-gray-300 text-sm italic">Sin elementos</p>}
                            {addedItems.map((item) => (
                                <div key={item.key} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">{item.code} x{item.quantity}</p>
                                    </div>
                                    <button onClick={() => setAddedItems(addedItems.filter(i => i.key !== item.key))} className="text-gray-300 hover:text-red-500"><Icon icon="solar:close-circle-bold" className="text-xl" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSubmitFinalRequest} disabled={loadingSubmit || addedItems.length === 0} className="w-full bg-gray-800 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-black shadow-lg disabled:bg-gray-100 transition-all">
                            {loadingSubmit ? <Icon icon="solar:restart-linear" className="animate-spin text-xl" /> : 'Confirmar Pedido'}
                        </button>
                        {submitError && <p className="text-red-500 text-xs text-center mt-4 font-bold">{submitError}</p>}
                    </div>
                </div>

                {/* Catálogo (Derecha) */}
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