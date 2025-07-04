import { useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { UserCog, Plus, Search } from "lucide-react";
import { AddClientDialog } from "./AddClientDialog";
import { getAllClientsPaginated } from "@/shared/services/ClientService";
import type { Client } from "@/shared/types/Client";

export const ClientsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const pageSize = 10;

  const loadClients = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const result = await getAllClientsPaginated(page, pageSize, search || undefined);

      setClients(result.items);
      setTotalClients(result.totalItems);
      setHasNextPage(page < result.totalPages);
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
      setTotalClients(0);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadClients(currentPage, searchQuery);
  }, [currentPage, searchQuery, loadClients]);

  const handleClientCreated = useCallback(() => {
    // Volver a la primera página y recargar
    setCurrentPage(1);
    loadClients(1, searchQuery);
  }, [loadClients, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Clientes Frecuentes
              </p>
              <p className="text-gray-600">
                Administra los clientes frecuentes y su información
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes por nombre, email o NIT..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Cliente
          </Button>
        </div>

      
        {/* Add Client Dialog */}
        <AddClientDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onClientCreated={handleClientCreated}
        />
      </div>
    </div>
  );
};
