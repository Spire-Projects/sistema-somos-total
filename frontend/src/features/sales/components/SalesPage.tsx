import { useState } from "react";
import { Button } from "@/shared/components/ui/button.tsx";
import { Input } from "@/shared/components/ui/input.tsx";
import { BriefcaseMedical } from "lucide-react";
import NewSaleDialog from "./NewSaleDialog.tsx";

export const SalesPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg self-center mt-1">
              <BriefcaseMedical className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Ventas
              </p>
              <p className="text-gray-500 text-sm sm:text-gray-600">
                Registra una nueva venta o consulta las ventas registradas
              </p>
            </div>
          </div>
        </div>
        {/* Searcher and Actions */}
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar venta..."
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <Button variant="default" onClick={() => setDialogOpen(true)}>Nueva venta</Button>
          </div>
        </div>
      </div>

      {/* New Sale Dialog */}
      <NewSaleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};
