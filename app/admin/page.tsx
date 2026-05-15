"use client";
import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [initials, setInitials] = useState("...");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(0);
  const router = useRouter();

  const fetchPendingCount = async () => {
    try {
      // CORREGIDO: Añadir la barra inicial y la 's' al final
      const res = await fetch('/api/requests');  // ✅ Cambiado de 'api/request'
      const data = await res.json()

      if (!res.ok) {
        console.error("Error en la API: ", data.error)
        setPendingCount(0)
        return
      }

      if (data?.error) {
        console.error("Error devuelto por la API: ", data.error)
        setPendingCount(0)
        return
      }

      let requests = []

      if (Array.isArray(data)) {
        requests = data
      } else if (data?.data && Array.isArray(data.data)) {
        requests = data.data
      } else {
        console.warn("La api no devolvio un array: ", typeof data, data)
        setPendingCount(0)
        return
      }

      const count = requests.filter((r: any) => r.status === 'Pendiente').length;

      if (count > prevCountRef.current) {
        playNotificationSound();
      }

      setPendingCount(count)
      // CORREGIDO: Usar asignación (=) en lugar de comparación (==)
      prevCountRef.current = count  // ✅ Cambiado de == a =
    } catch (error) {
      console.error("Error al obtener conteo: ", error)
      setPendingCount(0)
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log("Error al reproducir sonido:", e);
    }
  };

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
      } catch (e) { setInitials("ADM"); }
    }

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const cards = [
    {
      title: "Productos",
      desc: "Inicializar nuevos registros de SKU en la base de datos central.",
      icon: "solar:box-bold",
      path: "/admin/productos",
    },
    {
      title: "Añadir Stock",
      desc: "Registrar envíos entrantes y ejecutar protocolos de reabastecimiento.",
      icon: "proicons:box-add",
      path: "/admin/add-stock",
    },
    {
      title: "Solicitudes de Insumo",
      desc: "Acceder al libro mayor de inventario. Buscar, filtrar y auditar.",
      icon: "solar:bell-bold",
      path: "/admin/requests",
      isNotification: true,
    },
    {
      title: "Registrar operadores",
      desc: "Provisión de nuevas cuentas de usuario y definición de jerarquías.",
      icon: "solar:user-plus-bold",
      path: "/admin/register-operator",
    },
    {
      title: "Ver operadores",
      desc: "Monitorear personal activo, revisar registros de sesión y permisos.",
      icon: "solar:users-group-two-rounded-bold",
      path: "/admin/ver-operadores",
    },
    {
      title: "Mantenimiento",
      desc: "Monitorear equipos y herramientas en mantenimiento.",
      icon: "ix:maintenance",
      path: "/admin/mantenimiento",
    },
    {
      title: "Control de Entradas y Salidas",
      desc: "Monitorear equipos y herramientas en movimientos de stock.",
      icon: "mingcute:inventory-line",
      path: "/admin/entrada-salida",
    },
  ];

  return (
    // Agregamos pb-20 para dar espacio abajo
    <main className="min-h-screen bg-[#f4f7fa] pb-20" onClick={() => setMenuOpen(false)}>
      <header className="flex justify-between items-center mb-8 p-4 bg-white/80 backdrop-blur-md border border-white shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-2 bg-[#0095ff] rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Panel Administrativo</span>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase">Opciones</p>
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

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resumen de Operaciones</h1>
        <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
        {cards.map((card, index) => {
          const isRequestCard = card.isNotification;
          const hasAlert = isRequestCard && pendingCount > 0;

          return (
            <div
              key={index}
              onClick={() => router.push(card.path)}
              className={`bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border relative group overflow-hidden ${hasAlert ? "border-red-200 bg-red-50/30" : "border-gray-100"
                }`}
            >
              <div className="relative z-10">
                <Icon
                  icon={card.icon}
                  className={`text-7xl mb-6 transition-colors ${hasAlert ? "text-red-500 animate-bounce" : "text-gray-200 group-hover:text-blue-100"
                    }`}
                />

                {hasAlert && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg animate-pulse">
                    {pendingCount}
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 ${hasAlert ? "text-red-700" : "text-gray-800"}`}>
                  {card.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </div>

              {hasAlert && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Separación y Footer sutil al final */}
      <div className="mt-20 flex flex-col items-center">
        <div className="w-12 h-1 bg-gray-200 rounded-full mb-5"></div>
        <p className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em] mb-5">Sistema de Gestión de Insumos</p>
      </div>
    </main>
  );
}