"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterOperatorPage() {
  const [initials, setInitials] = useState("...");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Estados del Formulario
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const areas = ['Costura', 'Armado', 'Tapizado', 'Montado'];

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!employeeNumber.trim() || !name.trim() || !area.trim()) {
        setError('Por favor llena todos los campos correctamente.');
        setLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNumber, name, area }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmployeeNumber('');
        setName('');
        setArea('');
        alert('✅ Operador registrado con éxito en el sistema');
      } else {
        setError(data.error || 'Ocurrió un error inesperado.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Revisa tu red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => setMenuOpen(false)}>
      {/* Header Persistente */}
      <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
            
            <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Control de Personal</span>
            </div>

            <div className="text-sm text-gray-400 flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
                <Link href="/admin" className="hover:text-blue-600 transition-colors font-medium">Inicio</Link>
                <Icon icon="solar:alt-arrow-right-linear" className="text-[10px]" />
                <span className="text-blue-600 font-bold">Registrar operador</span>
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
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Registro de operadores</h1>
          <p className="text-gray-400 font-medium">Introduzca la información de los operadores en el formulario.</p>
        </div>

        <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-12">
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200 font-bold">{error}</p>}

            <div className="relative">
              <label className="text-gray-600 text-sm mb-2 block font-medium">Número de empleado</label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
                <Icon icon="f7:number-square-fill" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
                <input 
                  type="text" 
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="Ingresa el numero de empleado" 
                  className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-medium bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-gray-600 text-sm mb-2 block font-medium">Nombre del operador</label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
                <Icon icon="solar:user-linear" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingresa el nombre" 
                  className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-medium bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-gray-600 text-sm mb-2 block font-medium">Área</label>
              <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
                <Icon icon="solar:case-linear" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full outline-none text-gray-800 bg-transparent appearance-none font-medium"
                  required
                >
                  <option value="" disabled>Selecciona un área</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <Icon icon="solar:alt-arrow-down-linear" className="text-gray-600 ml-auto" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors font-medium">Cancelar</Link>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#0095ff] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:bg-gray-300"
              >
                <Icon icon={loading ? "solar:restart-linear" : "solar:user-plus-bold"} className={loading ? "animate-spin" : ""} />
                {loading ? 'Registrando...' : 'Registrar operador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}