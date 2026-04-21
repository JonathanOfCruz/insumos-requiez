"use client";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [initials, setInitials] = useState("...");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.name) {
          const names = user.name.split(" ");
          const nameInitials = names
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 3);
          setInitials(nameInitials);
        } else {
          setInitials("ABC");
        }
      } catch (error) {
        setInitials("ABC");
      }
    }
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
      title: "Peticiones",
      desc: "Acceder al libro mayor de inventario. Buscar, filtrar y auditar.",
      icon: "solar:bell-bold",
      path: "/admin/requests",
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
      desc: "Monitorear equipos y herramientas en mantenimiento .",
      icon: "ix:maintenance",
      path: "/admin/mantenimiento",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f7fa] p-8" onClick={() => setMenuOpen(false)}>
      {/* Header con Menú Desplegable */}
      <div className="flex justify-end mb-8 relative">
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-10 h-10 bg-[#0095ff] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg uppercase hover:bg-blue-600 transition-colors"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <Icon icon="solar:logout-3-bold" className="text-xl" />
                <span className="font-semibold">Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Resumen de Operaciones del Sistema
        </h1>
        <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => card.path && router.push(card.path)} // Ejecuta la navegación si existe el path
            className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group ${
              index === 0 ? "md:col-span-1" : ""
            }`}
          >
            <div className="relative">
              <Icon
                icon={card.icon}
                className="text-7xl text-gray-200 mb-6 group-hover:text-blue-100 transition-colors"
              />
              {index === 0 && (
                <span className="absolute top-0 right-0 bg-gray-200 text-[10px] font-bold px-2 py-1 rounded text-gray-600">
                  Función Principal
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            
            {index === 4 && (
                <div className="flex justify-end mt-4">
                    <Icon icon="solar:arrow-right-linear" className="text-4xl text-gray-300" />
                </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}