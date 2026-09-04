import React from 'react';
import { DATOS_PUERTO, PresupuestoWithItems, formatearNumeroPresupuesto } from '../types';
import logoUrl from '@/assets/puerto-logo.jpeg';

interface Props {
  presupuesto: PresupuestoWithItems;
}

export const PresupuestoPrintView: React.FC<Props> = ({ presupuesto }) => {
  const fechaLarga = new Date(presupuesto.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="presupuesto-print bg-white text-black p-8 max-w-[210mm] mx-auto font-sans text-sm">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-[#0A2A5A] pb-4">
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="Logo Puerto Ferretería"
            className="h-20 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-[#0A2A5A]">{DATOS_PUERTO.razon_social}</h1>
            <p className="text-xs">CUIT: {DATOS_PUERTO.cuit} · {DATOS_PUERTO.condicion_iva}</p>
            <p className="text-xs">Domicilio: {DATOS_PUERTO.domicilio}</p>
            {DATOS_PUERTO.telefono && <p className="text-xs">Tel: {DATOS_PUERTO.telefono}</p>}
          </div>
        </div>

        <div className="border-2 border-[#0A2A5A] rounded-md px-6 py-3 text-center min-w-[180px]">
          <p className="text-lg font-bold tracking-widest text-[#0A2A5A]">PRESUPUESTO</p>
          <p className="font-mono font-semibold mt-1 text-xs">
            N° {formatearNumeroPresupuesto(presupuesto)}
          </p>
          <p className="text-xs mt-1">Fecha: {fechaLarga}</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="mt-4 py-2 border-b border-gray-400">
        <p className="text-xs">
          <span className="font-semibold">Cliente:</span>{' '}
          {presupuesto.cliente_nombre?.trim() || 'Consumidor Final'}
        </p>
      </div>

      {/* Ítems */}
      <table className="w-full mt-4 border-collapse">
        <thead>
          <tr className="border-b-2 border-black text-left text-xs uppercase bg-slate-50">
            <th className="py-2 pr-2">Descripción</th>
            <th className="py-2 px-2 text-right w-20">Cant.</th>
            <th className="py-2 px-2 text-right w-28">Precio unit.</th>
            <th className="py-2 pl-2 text-right w-28">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {presupuesto.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-1.5 pr-2">{item.descripcion}</td>
              <td className="py-1.5 px-2 text-right">{item.cantidad}</td>
              <td className="py-1.5 px-2 text-right">${item.precio_unitario.toFixed(2)}</td>
              <td className="py-1.5 pl-2 text-right font-medium">
                ${(item.cantidad * item.precio_unitario).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-6 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between text-base font-bold border-t-2 border-[#0A2A5A] pt-2">
            <span>TOTAL</span>
            <span>${presupuesto.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer comercial barrial */}
      <div className="mt-10 border-t border-gray-400 pt-3 text-xs space-y-1">
        <p className="font-semibold text-[#0A2A5A]">Puerto Ferretería — Manuel Leiva 548</p>
        <p className="text-[11px] text-gray-600">
          Presupuesto sin validez temporal. Precios sujetos a modificación sin previo aviso. No válido como factura.
        </p>
        <p className="text-[10px] text-gray-500 mt-2">
          Documento generado por Gestión Puerto · Gracias por su consulta
        </p>
      </div>
    </div>
  );
};
