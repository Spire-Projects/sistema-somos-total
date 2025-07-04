import { useState, useEffect, useCallback, useMemo } from "react";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import { AddClientDialog } from "./AddClientDialog";
import { ClientSearchControls } from "./ClientSearchControls";
import { ClientTable } from "./ClientTable";
import { ClientMobileList } from "./ClientMobileList";
import { ClientTableSkeleton } from "./ClientTableSkeleton";
import { DataPagination } from "@/shared/components/DataPagination";
import CustomDialog from "@/shared/components/CustomDialog";
import { getAllClientsPaginated, deleteClient } from "@/shared/services/ClientService";
import { useDebounce } from "../hooks/useDebounce";
import type { Client } from "@/shared/types/Client";
import { Button } from "@/shared/components/ui/button";

interface PaginationData {
  startIndex: number;
  endIndex: number;
}

export const ClientsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce de la búsqueda para evitar consultas excesivas
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const loadClients = useCallback(async (page: number, size: number, search: string) => {
    setLoading(true);
    try {
      const result = await getAllClientsPaginated(page, size, search || undefined);
      setClients(result.items);
      setTotalClients(result.totalItems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
      setTotalClients(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar clientes cuando cambie la página, tamaño o búsqueda
  useEffect(() => {
    loadClients(currentPage, itemsPerPage, debouncedSearchQuery);
  }, [currentPage, itemsPerPage, debouncedSearchQuery, loadClients]);

  const handleClientCreated = useCallback(() => {
    // Volver a la primera página y recargar
    setCurrentPage(1);
    loadClients(1, itemsPerPage, debouncedSearchQuery);
  }, [loadClients, itemsPerPage, debouncedSearchQuery]);

  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClient = useCallback((client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      toast.success("Cliente eliminado exitosamente");
      
      // Recargar la lista
      loadClients(currentPage, itemsPerPage, debouncedSearchQuery);
      
      // Cerrar el diálogo
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar el cliente");
      console.error("Error deleting client:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [clientToDelete, currentPage, itemsPerPage, debouncedSearchQuery, loadClients]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingClient(null);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleCreateClick = useCallback(() => {
    setEditingClient(null); // Ensure we're in create mode
    setIsDialogOpen(true);
  }, []);

  // Datos de paginación calculados
  const paginationData: PaginationData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalClients);
    return { startIndex, endIndex };
  }, [currentPage, itemsPerPage, totalClients]);

  return (
    <div className="space-y-6">
      <div className="m-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserCog className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Gestión de Clientes
            </p>
            <p className="text-gray-600">
              Administra los clientes y su información de contacto
            </p>
          </div>
        </div>
      </div>

      <div className="">
        <div className="mt-5">
          {/* Controles de búsqueda */}
          <ClientSearchControls
            searchTerm={searchQuery}
            onSearchChange={handleSearchChange}
            onCreateClick={handleCreateClick}
          />

          {/* Contenido principal */}
          {loading ? (
            <ClientTableSkeleton />
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? `No hay resultados para "${searchQuery}"`
                  : "Comienza agregando tu primer cliente."
                }
              </p>
              {!searchQuery && (
                <Button
                  variant="default"
                  onClick={handleCreateClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Agregar Cliente
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla para desktop/tablet */}
              <ClientTable 
                clients={clients} 
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />

              {/* Lista para móvil */}
              <ClientMobileList 
                clients={clients}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            </>
          )}

          {/* Paginación */}
          {!loading && clients.length > 0 && (
            <div className="mt-6">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalClients}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                startIndex={paginationData.startIndex}
                endIndex={paginationData.endIndex}
                itemName="clientes"
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Client Dialog */}
      <AddClientDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onClientCreated={handleClientCreated}
        mode={editingClient ? "edit" : "create"}
        client={editingClient}
      />

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={isDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
        title="Eliminar Cliente"
        description={
          clientToDelete 
            ? `¿Estás seguro de que deseas eliminar a "${clientToDelete.name}"? Esta acción no se puede deshacer.`
            : "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
        }
        textConfirm="Eliminar"
        textCancel="Cancelar"
      />
    </div>
  );
};
