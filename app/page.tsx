"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import logoRequiez from './assets/logo-requiez.png';

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    // CRUCIAL: Detiene el refresco de la página
    e.preventDefault();
    
    if (!id) return alert("Ingresa tu número de empleado");

    setLoading(true);
    try {
      localStorage.clear(); // Limpiar rastro de sesiones previas

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeNumber: id.trim(),
          pin: step === 2 ? pin : null
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.action === "NEED_PIN") {
          setStep(2);
        } else if (data.success) {
          // Guardamos el objeto completo del usuario
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirección basada en rol
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/operator/request');
          }
        }
      } else {
        alert(data.error || "Número de empleado no reconocido");
      }
    } catch (error) {
      alert("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4">
      <form 
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100"
      >
        <div className="flex justify-center mb-8">
          <Image src={logoRequiez} alt="Logo Grupo Reqüiez" className="w-40 h-auto" priority />
        </div>

        {step === 1 ? (
          <div className="transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Insumos</h2>
            <p className="text-gray-400 mb-8 text-sm">Control de inventario y pedidos</p>

            <div className="text-left mb-8">
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Número de empleado</label>
              <div className="flex items-center border-b-2 border-gray-100 focus-within:border-blue-500 py-2 transition-colors">
                <Icon icon="solar:user-id-bold" className="text-blue-500 text-xl mr-3" />
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="Ingresa tu ID"
                  className="w-full outline-none text-gray-700 font-medium bg-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="transition-all duration-300">
            <Icon icon="solar:shield-check-bold" className="mx-auto text-6xl text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Verificación</h2>
            <p className="text-gray-500 mb-8">Ingresa el código de administrador</p>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-3xl text-gray-400 tracking-widest border-2 border-gray-100 rounded-xl p-3 w-36 mb-8 focus:border-blue-500 outline-none bg-gray-50"
              autoFocus
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0095ff] text-white py-4 rounded-xl flex items-center justify-center font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:bg-gray-300"
        >
          {loading ? (
            <Icon icon="solar:restart-linear" className="animate-spin text-2xl" />
          ) : (
            <>
              {step === 1 ? 'Continuar' : 'Entrar'}
              <Icon icon="solar:arrow-right-bold" className="ml-2" />
            </>
          )}
        </button>

        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium underline decoration-dotted"
          >
            Regresar
          </button>
        )}
      </form>
    </div>
  );
}