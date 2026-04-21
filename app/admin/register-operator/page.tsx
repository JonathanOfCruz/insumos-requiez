"use client";
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function RegisterOperatorPage() {
  // Estado para las iniciales del header
  const [initials, setInitials] = useState("...");

  // Estados del Formulario
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Áreas simuladas para el select (según captura)
  const areas = ['Costura', 'Armado', 'Tapizado', 'Montado'];

  // Cargar iniciales al iniciar (Idéntico a Productos)
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

  // Procesar el registro (Lógica POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Limpiar errores previos

    // Validación básica frontend
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
        // Limpiar formulario tras éxito
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
    <main className="min-h-screen bg-[#f4f7fa] p-6 lg:p-10">
      {/* Header y Breadcrumbs (Idéntico a Productos) */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Inicio</Link> 
          <Icon icon="solar:alt-arrow-right-linear" /> 
          <span className="text-blue-600 font-medium">Registrar operador</span>
        </div>
        <div className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow tracking-wider">{initials}</div>
      </div>

      {/* Título de la sección */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Registro de operadores</h1>
        <p className="text-gray-400">Introduzca la información de los operadores en el formulario.</p>
      </div>

      {/* Formulario Principal (Idéntico en diseño a Productos pero con datos de operador) */}
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {/* Input: Número de Empleado */}
          <div className="relative">
            <label className="text-gray-600 text-sm mb-2 block font-medium">Número de empleado</label>
            <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
              <Icon icon="f7:number-square-fill" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
              <input 
                type="text" 
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="Ingresa el numero de empleado" 
                className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Input: Nombre completo */}
          <div className="relative">
            <label className="text-gray-600 text-sm mb-2 block font-medium">Nombre del operador</label>
            <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
              <Icon icon="solar:user-linear" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa el nombre" 
                className="w-full outline-none text-gray-800 placeholder:text-gray-600 font-medium"
                required
              />
            </div>
          </div>

          {/* Input: Área (Select según captura) */}
          <div className="relative">
            <label className="text-gray-600 text-sm mb-2 block font-medium">Área</label>
            <div className="flex items-center border-b border-gray-200 focus-within:border-blue-500 py-2 group transition-colors">
              <Icon icon="solar:case-linear" className="text-gray-600 group-focus-within:text-blue-500 text-2xl mr-3" />
              <select 
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full outline-none text-gray-800 bg-transparent appearance-none font-medium required:text-gray-600"
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

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">Cancelar</Link>
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
    </main>
  );
}