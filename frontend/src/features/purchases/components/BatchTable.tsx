import React from 'react';
import { Edit, Trash2, Package, DollarSign } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/table';
import { Checkbox } from '../../../shared/components/ui/checkbox';
import { Badge } from '../../../shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import type { BatchWithMedication } from '../../../shared/types/Sales';

interface BatchTableProps {
  batches: BatchWithMedication[];
  onEditBatch: (batch: BatchWithMedication) => void;
  onDeleteBatch: (batch: BatchWithMedication) => void;
  loading: boolean;
}

export const BatchTable: React.FC<BatchTableProps> = ({
  batches,
  onEditBatch,
  onDeleteBatch,
  loading
}) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO');
  };

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'Vencido', color: 'destructive' };
    } else if (diffDays <= 30) {
      return { status: 'expiring', label: 'Por vencer', color: 'warning' };
    } else if (diffDays <= 90) {
      return { status: 'near_expiry', label: 'Próximo a vencer', color: 'secondary' };
    } else {
      return { status: 'valid', label: 'Vigente', color: 'default' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay lotes registrados
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza agregando el primer lote de medicamentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Lotes de Medicamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
               
                <TableHead>Medicamento</TableHead>
                <TableHead>Lote ID</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>F. Compra</TableHead>
                <TableHead>F. Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>P. Compra</TableHead>
                <TableHead>P. Venta</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                
                const expirationStatus = getExpirationStatus(batch.expirationDate);
                const margin = batch.sellingPrice > 0 
                  ? (((batch.sellingPrice - batch.purchasePrice) / batch.purchasePrice) * 100)
                  : 0;

                return (
                  <TableRow 
                    key={batch.batchId}
                  
                  >
                    <TableCell>
                     
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{batch.medication.tradeName}</div>
                        <div className="text-sm text-gray-500">
                          {batch.medication.genericName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {batch.medication.concentration} - {batch.medication.presentation}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {batch.batchId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        {batch.quantity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {batch.purchaseDate ? formatDate(batch.purchaseDate) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(batch.expirationDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expirationStatus.color as any}>
                        {expirationStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {formatCurrency(batch.purchasePrice)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        {formatCurrency(batch.sellingPrice)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {batch.supplier || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onEditBatch(batch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => onDeleteBatch(batch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
