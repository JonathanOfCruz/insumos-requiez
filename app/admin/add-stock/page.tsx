"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddStockPage() {
  const [initials, setInitials] = useState("...");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Estados del Formulario
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState('');

  // Estados de UI
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [productFound, setProductFound] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.name) {
          const names = user.name.split(" ");
          const nameInitials = names.map((n: string) => n[0]).join("").toUpperCase().substring(0, 3);
          setInitials(nameInitials);
        }
      } catch (error) { setInitials("ADM"); }
    }
  }, []);

  const handleCodeBlur = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setLoadingSearch(true);
    setSearchError('');
    setProductFound(false);
    setName('');
    setCategory('');
    setCurrentStock(null);

    try {
      const res = await fetch(`/api/products/search?code=${encodeURIComponent(trimmedCode)}`);
      const data = await res.json();

      if (res.ok) {
        setName(data.name);
        setCategory(data.category);
        setCurrentStock(data.currentStock);
        setProductFound(true);
      } else {
        setSearchError(data.error || 'Producto no encontrado.');
      }
    } catch (err) {
      setSearchError('Error de conexión al buscar producto.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  // ... (mismo código de arriba hasta el handleSubmit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    // 1. Obtener el ID del admin desde localStorage
    const userData = localStorage.getItem("user");
    let adminId = "";
    if (userData) {
      const user = JSON.parse(userData);
      adminId = user.id || user._id; // Ajusta según cómo guardes el ID en el login
    }

    if (!adminId) {
      setSubmitError('No se encontró sesión activa. Por favor, vuelve a iniciar sesión.');
      return;
    }

    const qty = parseInt(quantityToAdd);

    if (!productFound) {
      setSubmitError('Primero debes ingresar un código de producto válido.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setSubmitError('La cantidad a registrar debe ser un número mayor a 0.');
      return;
    }

    setLoadingSubmit(true);

    try {
      const res = await fetch('/api/products/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ENVIAMOS EL operatorId AL BACKEND
        body: JSON.stringify({
          code: code.trim(),
          quantityToAdd: qty,
          operatorId: adminId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCode('');
        setName('');
        setCategory('');
        setCurrentStock(null);
        setQuantityToAdd('');
        setProductFound(false);
        alert(`Éxito: ${data.message}`);
      } else {
        setSubmitError(data.error || 'Ocurrió un error al actualizar el stock.');
      }
    } catch (err) {
      setSubmitError('Error de conexión con el servidor.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => setMenuOpen(false)}>
      {/* Header / Navbar Persistente */}
      <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">

          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Operaciones de Almacén</span>
          </div>

          <div className="text-sm text-gray-400 flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
            <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
            <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
            <span className="text-blue-600 font-bold">Añadir Stock</span>
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

      <div className="px-6 lg:px-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">Registrar Stock</h1>
          <p className="text-gray-400 font-medium">Introduzca las especificaciones del producto para actualizar el inventario.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* BLOQUE IZQUIERDO: Información del Producto */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8 relative overflow-hidden">

              {loadingSearch && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 backdrop-blur-[1px]">
                  <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                </div>
              )}

              <div className="relative">
                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Código del producto</label>
                <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-3 group transition-colors">
                  <Icon icon="glyphs:barcode-duo" className={`text-2xl mr-3 ${searchError ? 'text-red-400' : 'text-gray-600 group-focus-within:text-blue-500'}`} />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onBlur={handleCodeBlur}
                    placeholder="Ingresa el código del SKU"
                    className="w-full outline-none text-gray-800 placeholder:text-gray-600 text-lg bg-transparent"
                    required
                  />
                </div>
                {searchError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-bold animate-pulse"><Icon icon="solar:danger-triangle-linear" /> {searchError}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Nombre del producto</label>
                  <div className="flex items-center border-b border-gray-50 py-3">
                    <Icon icon="solar:box-minimalistic-linear" className="text-gray-600 text-2xl mr-3" />
                    <input
                      type="text"
                      value={name}
                      placeholder="Autocompletado..."
                      className="w-full outline-none text-gray-600 bg-transparent font-medium"
                      readOnly
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Clasificación</label>
                  <div className="flex items-center border-b border-gray-50 py-3">
                    <Icon icon="si:server-line" className="text-gray-600 text-2xl mr-3" />
                    <input
                      type="text"
                      value={category}
                      placeholder="Categoría..."
                      className="w-full outline-none text-gray-600 bg-transparent uppercase text-xs font-black tracking-widest"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BLOQUE DERECHO: Cantidad a Registrar */}
            <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 h-fit">

              {submitError && <p className="text-red-500 text-xs bg-red-50 p-4 rounded-xl border border-red-100 font-bold leading-relaxed">{submitError}</p>}

              <div className="relative">
                <label className="text-gray-600 text-xs mb-2 block font-bold uppercase tracking-wider">Cantidad a añadir</label>
                <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-3 group transition-colors">
                  <Icon icon="f7:number-square-fill" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
                  <input
                    type="number"
                    min="1"
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    placeholder="0"
                    className="w-full outline-none text-gray-600 font-black text-xl bg-transparent"
                    required
                    disabled={!productFound}
                  />
                </div>
                {productFound && currentStock !== null && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Stock Actual</span>
                    <span className="text-sm font-black text-blue-600">{currentStock} unidades</span>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loadingSubmit || !productFound}
                  className="w-full bg-[#0095ff] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                >
                  <Icon icon={loadingSubmit ? "solar:restart-linear" : "solar:box-plus-bold"} className={`text-xl ${loadingSubmit ? "animate-spin" : ""}`} />
                  {loadingSubmit ? 'PROCESANDO...' : 'REGISTRAR STOCK'}
                </button>
                <Link href="/admin" className="w-full py-3 text-center block text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest transition-colors">
                  Cancelar operación
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}