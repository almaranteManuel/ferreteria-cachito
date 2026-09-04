import React from 'react';
import {
  DATOS_EMISOR,
  FacturaWithItems,
  formatearNumeroFactura,
} from '../types';
import logoUrl from '@/assets/puerto-logo.jpeg';

interface FacturaPrintViewProps {
  factura: FacturaWithItems;
}

const CONDICIONES_IVA: Record<number, string> = {
  1: 'IVA Responsable Inscripto',
  4: 'IVA Sujeto Exento',
  5: 'Consumidor Final',
  6: 'Responsable Monotributo',
};

function descripcionCondicionIva(id: number): string {
  return CONDICIONES_IVA[id] ?? `Código ${id}`;
}

/**
 * Plantilla A4 del comprobante. En pantalla se ve dentro de un contenedor;
 * al imprimir (@media print) es lo único visible.
 */
export const FacturaPrintView: React.FC<FacturaPrintViewProps> = ({ factura }) => {
  const fechaLarga = new Date(factura.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="factura-print bg-white text-black p-8 max-w-[210mm] mx-auto font-sans text-sm">
      {/* Encabezado */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="Logo Ferretería Cachito"
            className="h-20 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-bold">{DATOS_EMISOR.razon_social}</h1>
            <p className="text-xs">CUIT: {DATOS_EMISOR.cuit}</p>
            <p className="text-xs">{DATOS_EMISOR.condicion_iva}</p>
            {DATOS_EMISOR.domicilio && (
              <p className="text-xs">Domicilio: {DATOS_EMISOR.domicilio}</p>
            )}
            {DATOS_EMISOR.telefono && <p className="text-xs">Tel: {DATOS_EMISOR.telefono}</p>}
          </div>
        </div>

        <div className="border-2 border-black rounded-md px-6 py-3 text-center">
          <p className="text-3xl font-bold tracking-widest">C</p>
          <p className="text-[10px] uppercase">Factura</p>
          <p className="font-mono font-semibold mt-1">
            N° {formatearNumeroFactura(factura)}
          </p>
          <p className="text-xs mt-1">Fecha: {fechaLarga}</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="mt-4 py-2 border-b border-gray-400">
        {factura.cliente_cuit ? (
          <div className="text-xs space-y-0.5">
            <p>
              <span className="font-semibold">Cliente:</span>{' '}
              {factura.cliente_nombre || '—'}
            </p>
            <p>
              <span className="font-semibold">CUIT:</span> {factura.cliente_cuit}
              {factura.condicion_iva_receptor_id != null && (
                <>
                  {' · '}
                  <span className="font-semibold">Condición IVA:</span>{' '}
                  {descripcionCondicionIva(factura.condicion_iva_receptor_id)}
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="text-xs">
            <span className="font-semibold">Cliente:</span> Consumidor Final
          </p>
        )}
      </div>

      {/* Ítems */}
      <table className="w-full mt-4 border-collapse">
        <thead>
          <tr className="border-b border-black text-left text-xs uppercase">
            <th className="py-2 pr-2">Descripción</th>
            <th className="py-2 px-2 text-right w-20">Cant.</th>
            <th className="py-2 px-2 text-right w-28">Precio unit.</th>
            <th className="py-2 pl-2 text-right w-28">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {factura.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-1.5 pr-2">{item.descripcion}</td>
              <td className="py-1.5 px-2 text-right">{item.cantidad}</td>
              <td className="py-1.5 px-2 text-right">
                ${item.precio_unitario.toFixed(2)}
              </td>
              <td className="py-1.5 pl-2 text-right">
                ${(item.cantidad * item.precio_unitario).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-6 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between text-base font-bold border-t-2 border-black pt-2">
            <span>TOTAL</span>
            <span>${factura.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CAE */}
      <div className="mt-10 border-t border-gray-400 pt-3 flex justify-between items-end text-xs">
        <div>
          <p>
            <span className="font-semibold">CAE N°:</span> {factura.cae ?? '—'}
          </p>
          <p>
            <span className="font-semibold">Vencimiento CAE:</span>{' '}
            {factura.cae_expiration
              ? `${factura.cae_expiration.slice(6)}/${factura.cae_expiration.slice(4, 6)}/${factura.cae_expiration.slice(0, 4)}`
              : '—'}
          </p>
          <p className="mt-1 text-[10px] text-gray-600">
            Comprobante electrónico emitido según RG de AFIP/ARCA vigente.
          </p>
        </div>
        <p className="text-[10px] text-gray-500">
          Página 1 de 1 · Documento generado por Gestión Cachito
        </p>
      </div>
    </div>
  );
};
