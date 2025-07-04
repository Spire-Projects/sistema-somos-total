import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { UserCog, Plus, Search, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { AddClientDialog } from "./AddClientDialog";
import { DataPagination } from "@/shared/components/DataPagination";
import { getAllClientsPaginated, getLoyaltyLevel, getLoyaltyLevelColor, getLoyaltyLevelText } from "@/shared/services/ClientService";
import type { Client } from "@/shared/types/Client";

// Hook personalizado para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Componente de esqueleto para la tabla
const ClientTableSkeleton = () => (
  <div className="w-full">
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">NIT</TableHead>
            <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
            <TableHead className="hidden xl:table-cell">Puntos</TableHead>
            <TableHead className="text-right">Nivel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-6 w-16 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

// Componente de lista móvil para clientes
const ClientMobileCard = ({ client }: { client: Client }) => {
  const loyaltyLevel = getLoyaltyLevel(client.loyaltyPoints || 0);
  const levelColor = getLoyaltyLevelColor(loyaltyLevel);
  const levelText = getLoyaltyLevelText(loyaltyLevel);

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{client.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${levelColor}`}>
              {levelText}
            </Badge>
            {client.loyaltyPoints && client.loyaltyPoints > 0 && (
              <span className="text-sm text-gray-500">
                {client.loyaltyPoints} pts
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.nit && (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span>NIT: {client.nit}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ClientsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  }, []);

  // Datos para la paginación
  const paginationData = useMemo(() => ({
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: currentPage * itemsPerPage
  }), [currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2 sm:p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Clientes Frecuentes
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
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
              placeholder="Buscar por nombre o NIT..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Crear Cliente
          </Button>
        </div>

        {/* Tabla para desktop y tablet */}
        <div className="hidden sm:block">
          {loading ? (
            <ClientTableSkeleton />
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">NIT</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden xl:table-cell">Puntos</TableHead>
                    <TableHead className="text-right">Nivel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchQuery ? (
                          <div className="text-gray-500">
                            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No se encontraron clientes que coincidan con "{searchQuery}"</p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <UserCog className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No hay clientes registrados</p>
                            <p className="text-sm">Crea tu primer cliente para comenzar</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => {
                      const loyaltyLevel = getLoyaltyLevel(client.loyaltyPoints || 0);
                      const levelColor = getLoyaltyLevelColor(loyaltyLevel);
                      const levelText = getLoyaltyLevelText(loyaltyLevel);

                      return (
                        <TableRow key={client.id} className="hover:bg-gray-50 cursor-pointer">
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{client.name}</div>
                              {client.address && (
                                <div className="text-sm text-gray-500 truncate max-w-[180px]">
                                  {client.address}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {client.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {client.nit ? (
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {client.nit}
                              </code>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {client.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{client.phone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {client.loyaltyPoints && client.loyaltyPoints > 0 ? (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{client.loyaltyPoints}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={`${levelColor}`}>
                              {levelText}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Lista móvil */}
        <div className="sm:hidden">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Sin resultados</p>
                  <p>No se encontraron clientes que coincidan con "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <UserCog className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No hay clientes</p>
                  <p>Crea tu primer cliente para comenzar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <ClientMobileCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && totalClients > 0 && (
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
        )}

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
