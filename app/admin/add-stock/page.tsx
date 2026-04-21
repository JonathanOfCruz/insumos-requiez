"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function AddStockPage() {
  // Estado para las iniciales del header
  const [initials, setInitials] = useState("...");

  // Estados del Formulario
  const [code, setCode] = useState('');
  const [name, setName] = useState(''); // Autocompletado
  const [category, setCategory] = useState(''); // Autocompletado
  const [currentStock, setCurrentStock] = useState<number | null>(null); // Feedback visual
  const [quantityToAdd, setQuantityToAdd] = useState('');
  
  // Estados de UI
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [productFound, setProductFound] = useState(false);

  // Cargar iniciales al iniciar
  useEffect(() => {
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

  // Lógica Senior: Autocompletar al perder el foco (onBlur)
  const handleCodeBlur = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setLoadingSearch(true);
    setSearchError('');
    setProductFound(false);
    // Limpiar campos autocompletados previos
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
        // Opcional: Enfocar de nuevo el código o limpiar
      }
    } catch (err) {
      setSearchError('Error de conexión al buscar producto.');
    } finally {
      setLoadingSearch(false);
    }
  };

  // Procesar el registro del nuevo stock
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

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
        body: JSON.stringify({ code: code.trim(), quantityToAdd: qty }),
      });

      const data = await res.json();

      if (res.ok) {
        // Limpiar formulario completo
        setCode('');
        setName('');
        setCategory('');
        setCurrentStock(null);
        setQuantityToAdd('');
        setProductFound(false);
        alert(`✅ ${data.message}`);
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
    <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
      {/* Header y Breadcrumbs (Idéntico a Productos) */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Inicio</Link> 
          <Icon icon="solar:alt-arrow-right-linear" /> 
          <span className="text-blue-600 font-medium">Añadir Stock</span>
        </div>
        <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow tracking-wider">{initials}</div>
      </div>

      {/* Título de la sección */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Registrar Stock</h1>
        <p className="text-gray-400">Introduzca las especificaciones del producto en el formulario.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Grid Principal: Formulario Info (izq) y Formulario Stock (der) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* BLOQUE IZQUIERDO: Información del Producto (Lectura/Autocompletado) */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8 relative">
            
            {loadingSearch && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-2xl">
                    <Icon icon="solar:restart-linear" className="text-4xl text-blue-500 animate-spin" />
                </div>
            )}

            {/* Input: Código (Único campo de escritura aquí) */}
            <div className="relative">
              <label className="text-gray-600 text-sm mb-2 block font-medium">Código del producto</label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
                <Icon icon="glyphs:barcode-duo" className={`text-2xl mr-3 ${searchError ? 'text-red-400' : 'text-gray-600 group-focus-within:text-blue-500'}`} />
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={handleCodeBlur} // Trigger Senior de autocompletado
                  placeholder="Ingresa el código" 
                  className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-medium"
                  required
                />
              </div>
              {searchError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><Icon icon="solar:danger-triangle-linear" /> {searchError}</p>}
            </div>

            {/* Input: Nombre (Solo lectura) */}
            <div className="relative">
              <label className="text-gray-400 text-sm mb-2 block font-medium">Nombre del producto</label>
              <div className="flex items-center border-b border-gray-100 py-2">
                <Icon icon="solar:box-minimalistic-linear" className="text-gray-600 text-2xl mr-3" />
                <input 
                  type="text" 
                  value={name}
                  placeholder="Autocompletado al ingresar código" 
                  className="w-full outline-none text-gray-400 bg-transparent placeholder:text-gray-600"
                  readOnly // Senior UX: No editable
                />
              </div>
            </div>

            {/* Input: Clasificación (Solo lectura) */}
            <div className="relative">
              <label className="text-gray-400 text-sm mb-2 block font-medium">Clasificación</label>
              <div className="flex items-center border-b border-gray-100 py-2">
                <Icon icon="si:server-line" className="text-gray-600 text-2xl mr-3" />
                <input 
                  type="text" 
                  value={category}
                  placeholder="Autocompletado al ingresar código" 
                  className="w-full outline-none text-gray-400 bg-transparent placeholder:text-gray-600 uppercase text-xs font-bold tracking-wider"
                  readOnly // Senior UX: No editable
                />
              </div>
            </div>
          </div>

          {/* BLOQUE DERECHO: Cantidad a Registrar (Escritura y Acción) */}
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8 h-fit lg:mt-20">
            
            {submitError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{submitError}</p>}

            {/* Input: Stock a Registrar */}
            <div className="relative">
              <label className="text-gray-600 text-sm mb-2 block font-medium">Stock a registrar</label>
              <div className="flex items-center border-b border-gray-00 focus-within:border-blue-500 py-2 group transition-colors">
                <Icon icon="f7:number-square-fill" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
                <input 
                  type="number" 
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(e.target.value)}
                  placeholder="Ingresa el stock" 
                  className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-bold text-lg "
                  required
                  disabled={!productFound} // Senior UX: Deshabilitado hasta encontrar producto
                />
              </div>
              {productFound && currentStock !== null && (
                <p className="text-xs text-blue-500 mt-2 font-medium">Stock actual en DB: {currentStock}</p>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Cancelar</Link>
              <button 
                type="submit" 
                disabled={loadingSubmit || !productFound}
                className="bg-[#0095ff] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:bg-gray-300"
              >
                <Icon icon={loadingSubmit ? "solar:restart-linear" : "solar:box-plus-bold"} className={loadingSubmit ? "animate-spin" : ""} />
                {loadingSubmit ? 'Actualizando...' : 'Registrar stock'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}