import { memo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Search } from "lucide-react";

interface ClientSearchControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

/**
 * Controles de búsqueda y botón de crear cliente
 * Memoizado para evitar re-renders innecesarios
 */
export const ClientSearchControls = memo<ClientSearchControlsProps>(({
  searchTerm,
  onSearchChange,
  onCreateClick
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nombre o NIT..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button onClick={onCreateClick} className="whitespace-nowrap">
        <Plus className="w-4 h-4 mr-2" />
        Agregar Cliente
      </Button>
    </div>
  );
});                                                                                                                     

ClientSearchControls.displayName = "ClientSearchControls";
