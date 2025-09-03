import React from "react";
import { formatDateSafe } from "@/shared/utils/date.utils";

interface DateComparisonProps {
  dateString: string;
}

/**
 * Componente temporal para comparar formatos de fecha
 * Úsalo para verificar que las fechas se muestran correctamente
 */
export const DateComparison: React.FC<DateComparisonProps> = ({ dateString }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
      <h4 className="font-semibold text-sm mb-2">🔍 Comparación de Formatos de Fecha</h4>
      <div className="text-sm space-y-1">
        <div>
          <strong>Fecha original:</strong> {dateString}
        </div>
        <div>
          <strong>new Date().toLocaleDateString():</strong>{" "}
          <span className="text-red-600">
            {new Date(dateString).toLocaleDateString("es-ES")} ❌ (puede mostrar día anterior)
          </span>
        </div>
        <div>
          <strong>formatDateSafe():</strong>{" "}
          <span className="text-green-600">
            {formatDateSafe(dateString)} ✅ (fecha correcta)
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para obtener algunas fechas de ejemplo para testing
 */
export const useTestDates = () => {
  return [
    "2025-09-03",
    "2025-09-02", 
    "2025-09-01",
    "2025-08-31"
  ];
};
