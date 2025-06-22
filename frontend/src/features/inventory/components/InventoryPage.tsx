import { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import { Badge } from "../../../shared/components/ui/badge";
import { Avatar, AvatarFallback } from "../../../shared/components/ui/avatar";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { Search, Edit, Eye, Filter } from 'lucide-react';
import { AddMedicationDialog } from './AddMedicationDialog';
import { findAllMedications } from '../../../shared/services';
import type { Medication } from '../../../shared/types/Medication';

const ITEMS_PER_PAGE = 10;

export const InventoryPage = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Cargar medicamentos desde la base de datos
  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const medicationsData = await findAllMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
      setMedications([]); // Fallback a array vacío
    } finally {
      setLoading(false);
    }
  };

  // Funciones helper
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sin stock', variant: 'destructive' as const };
    if (stock <= 10) return { label: 'Stock bajo', variant: 'secondary' as const };
    return { label: 'Normal', variant: 'default' as const };
  };

  const getMedicationIcon = (categoryId: string) => {
    const iconMap: Record<string, string> = {
      'CAT-001': '💊', // Analgésicos
      'CAT-002': '🦠', // Antibióticos
      'CAT-003': '🤧', // Antihistamínicos
      'CAT-004': '❤️', // Cardiovasculares
      'CAT-005': '🩸', // Antidiabéticos
      'CAT-006': '🟡', // Vitaminas
      'CAT-007': '🫄', // Gastrointestinales
      'CAT-008': '🫁', // Respiratorios
      'CAT-009': '❤️', // Cardiovasculares (duplicado)
      'CAT-011': '🧠', // Ansiolíticos
    };
    return iconMap[categoryId] || '💊';
  };

  const getCategoryName = (categoryId: string) => {
    const categoryMap: Record<string, string> = {
      'CAT-001': 'Analgésicos',
      'CAT-002': 'Antibióticos',
      'CAT-003': 'Antihistamínicos',
      'CAT-004': 'Cardiovasculares',
      'CAT-005': 'Antidiabéticos',
      'CAT-006': 'Vitaminas',
      'CAT-007': 'Gastrointestinales',
      'CAT-008': 'Respiratorios',
      'CAT-009': 'Cardiovasculares',
      'CAT-011': 'Ansiolíticos',
    };
    return categoryMap[categoryId] || 'Sin categoría';
  };

  // Filtrar medicamentos
  const filteredMedications = useMemo(() => {
    return medications.filter(med => {
      const matchesSearch = 
        med.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.barcode?.includes(searchTerm) ||
        false;
      
      const matchesCategory = selectedCategory === 'all' || med.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory && !med.isDeleted;
    });
  }, [medications, searchTerm, selectedCategory]);

  // Paginación
  const totalPages = Math.ceil(filteredMedications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMedications = filteredMedications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="!text-2xl lg:text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestión de medicamentos y control de stock</p>
        </div>
        <AddMedicationDialog onMedicationAdded={loadMedications} />
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{medications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {medications.filter(med => med.totalStock <= 10 && med.totalStock > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sin Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {medications.filter(med => med.totalStock === 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Próximos a Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {medications.filter(med => {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
                return med.batches.some(batch => new Date(batch.expirationDate) <= thirtyDaysFromNow);
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Buscar y filtrar medicamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, código, categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtro por categoría */}
            <div className="w-full lg:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CAT-001">Analgésicos</SelectItem>
                  <SelectItem value="CAT-002">Antibióticos</SelectItem>
                  <SelectItem value="CAT-003">Antihistamínicos</SelectItem>
                  <SelectItem value="CAT-004">Cardiovasculares</SelectItem>
                  <SelectItem value="CAT-005">Antidiabéticos</SelectItem>
                  <SelectItem value="CAT-006">Vitaminas</SelectItem>
                  <SelectItem value="CAT-007">Gastrointestinales</SelectItem>
                  <SelectItem value="CAT-008">Respiratorios</SelectItem>
                  <SelectItem value="CAT-009">Cardiovasculares</SelectItem>
                  <SelectItem value="CAT-011">Ansiolíticos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de medicamentos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Productos ({filteredMedications.length})</CardTitle>
              <CardDescription>
                Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredMedications.length)} de {filteredMedications.length} productos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Vista Desktop */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Mostrar skeletons mientras carga
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><div className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedMedications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron medicamentos
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMedications.map((medication) => {
                  const stockStatus = getStockStatus(medication.totalStock);
                  const oldestBatch = medication.batches && medication.batches.length > 0 
                    ? medication.batches.reduce((oldest, current) => 
                        new Date(current.expirationDate) < new Date(oldest.expirationDate) ? current : oldest
                      )
                    : null;
                  
                  return (
                    <TableRow key={medication.id}>
                      <TableCell className="font-mono text-xs">
                        {medication.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getMedicationIcon(medication.categoryId)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{medication.tradeName}</div>
                            <div className="text-sm text-gray-500">{medication.genericName}</div>
                            <div className="text-xs text-gray-400">{medication.presentation}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryName(medication.categoryId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-bold">{medication.totalStock} uds.</div>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {oldestBatch ? formatPrice(oldestBatch.sellingPrice) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {oldestBatch ? formatDate(oldestBatch.expirationDate) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Lote: {oldestBatch ? oldestBatch.batchId : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {oldestBatch ? oldestBatch.supplier : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={medication.sincronized ? "default" : "secondary"}>
                          {medication.sincronized ? 'Sincronizado' : 'Local'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }))}
              </TableBody>
            </Table>
          </div>

          {/* Vista Mobile/Tablet */}
          <div className="lg:hidden p-4 space-y-4">
            {loading ? (
              // Mostrar skeletons mientras carga
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24 mb-1" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Skeleton className="h-6 w-8" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : paginatedMedications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron medicamentos
              </div>
            ) : (
              paginatedMedications.map((medication) => {
              const stockStatus = getStockStatus(medication.totalStock);
              const oldestBatch = medication.batches && medication.batches.length > 0 
                ? medication.batches.reduce((oldest, current) => 
                    new Date(current.expirationDate) < new Date(oldest.expirationDate) ? current : oldest
                  )
                : null;

              return (
                <Card key={medication.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getMedicationIcon(medication.categoryId)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{medication.tradeName}</h3>
                          <p className="text-sm text-gray-500 truncate">{medication.genericName}</p>
                          <p className="text-xs text-gray-400">{medication.presentation}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="font-bold text-lg">{medication.totalStock}</div>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Categoría:</span>
                        <div>{getCategoryName(medication.categoryId)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Precio:</span>
                        <div className="font-medium">{oldestBatch ? formatPrice(oldestBatch.sellingPrice) : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Vencimiento:</span>
                        <div>{oldestBatch ? formatDate(oldestBatch.expirationDate) : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Código:</span>
                        <div className="font-mono text-xs">{medication.id}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <Badge variant={medication.sincronized ? "default" : "secondary"}>
                        {medication.sincronized ? 'Sincronizado' : 'Local'}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }))}
          </div>
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {/* Números de página */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
