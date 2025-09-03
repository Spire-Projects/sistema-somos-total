import React from "react";
import { useSalesDateAnalysis, formatDateToLocal } from "./useSalesDateAnalysis";
import type { Sale } from "@/shared/types/Sales";

interface SalesDebugPanelProps {
  sales: Sale[];
  dateFrom: string;
  dateTo: string;
  isVisible?: boolean;
}

export const SalesDebugPanel: React.FC<SalesDebugPanelProps> = ({
  sales,
  dateFrom,
  dateTo,
  isVisible = false
}) => {
  const analysis = useSalesDateAnalysis(sales);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 my-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800">🔍 Debug Panel - Análisis de Fechas</h3>
      
      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm text-gray-600">Total Ventas</h4>
          <p className="text-xl font-bold text-blue-600">{analysis.totalSales}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm text-gray-600">Rango Solicitado</h4>
          <p className="text-sm text-gray-800">{dateFrom} → {dateTo}</p>
        </div>
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-sm text-gray-600">Rango Real</h4>
          <p className="text-sm text-gray-800">
            {analysis.dateRange.earliest} → {analysis.dateRange.latest}
          </p>
        </div>
      </div>

      {/* Zona horaria */}
      <div className="bg-white p-3 rounded border mb-4">
        <h4 className="font-semibold text-sm text-gray-600 mb-2">Información de Zona Horaria</h4>
        <p className="text-sm">
          <strong>Zona:</strong> {analysis.timezoneInfo.localTimezone} | 
          <strong> Offset:</strong> {analysis.timezoneInfo.offsetMinutes} minutos
        </p>
      </div>

      {/* Problemas detectados */}
      {analysis.potentialIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <h4 className="font-semibold text-sm text-red-600 mb-2">⚠️ Problemas Detectados</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {analysis.potentialIssues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Ventas por fecha */}
      <div className="bg-white border rounded">
        <h4 className="font-semibold text-sm text-gray-600 p-3 border-b">📅 Ventas por Fecha</h4>
        <div className="max-h-60 overflow-y-auto">
          {Object.entries(analysis.salesByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => (
              <div key={date} className="flex justify-between items-center p-2 border-b last:border-b-0 hover:bg-gray-50">
                <div>
                  <span className="font-medium">{date}</span>
                  <div className="text-xs text-gray-500">
                    Primera: {formatDateToLocal(data.sales[0]?.createdAt || '')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{data.count} ventas</div>
                  <div className="text-xs text-gray-600">
                    ${data.totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Muestras de fechas */}
      {sales.length > 0 && (
        <div className="bg-white border rounded mt-4">
          <h4 className="font-semibold text-sm text-gray-600 p-3 border-b">🔬 Muestra de Fechas (primeras 5 ventas)</h4>
          <div className="p-3 space-y-2">
            {sales.slice(0, 5).map((sale, index) => (
              <div key={sale.id} className="text-xs bg-gray-50 p-2 rounded">
                <div><strong>Venta {index + 1}:</strong> ID {sale.id}</div>
                <div><strong>Fecha original:</strong> {sale.createdAt}</div>
                <div><strong>Fecha local:</strong> {formatDateToLocal(sale.createdAt)}</div>
                <div><strong>Total:</strong> ${sale.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
