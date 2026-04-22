"use client";
import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [initials, setInitials] = useState("...");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(0); // Para comparar si llegaron nuevas
  const router = useRouter();

  // Función para obtener conteo de pendientes
  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/requests'); // Usamos tu API de solicitudes
      const data = await res.json();
      const count = data.filter((r: any) => r.status === 'Pendiente').length;

      // Si el nuevo conteo es mayor al anterior, sonar alerta
      if (count > prevCountRef.current) {
        playNotificationSound();
      }

      setPendingCount(count);
      prevCountRef.current = count;
    } catch (error) {
      console.error("Error al obtener conteo:", error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Cambiamos a 'triangle' para que sea más audible y "metálico"
      oscillator.type = 'triangle';

      // Subimos la frecuencia a 880Hz (Nota La5) para que sea más chillón y difícil de ignorar
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

      // Subimos el volumen inicial (0.4 es bastante fuerte, el máximo recomendado es 1.0)
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);

      // Hacemos que el desvanecimiento sea un poco más lento (0.8s) para que se note más
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
    // 1. Cargar iniciales
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

    // 2. Ejecutar primer conteo y establecer intervalo (cada 10 segundos)
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
      isNotification: true, // Marcador para la lógica especial
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
    <main className="min-h-screen bg-[#f4f7fa] p-8" onClick={() => setMenuOpen(false)}>
      {/* Botón Perfil */}
      <div className="flex justify-end mb-8 relative">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase hover:bg-blue-600 transition-colors"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
              <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 font-semibold transition-colors">
                <Icon icon="solar:logout-3-bold" className="text-xl" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Resumen de Operaciones</h1>
        <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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

                {/* Contador en Rojo para Solicitudes */}
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

              {/* Efecto de fondo cuando hay alerta */}
              {hasAlert && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}