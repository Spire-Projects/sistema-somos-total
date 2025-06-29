import React, { useState } from 'react';
import { Edit, Trash2, Package, DollarSign, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/table';
import { Badge } from '../../../shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import type { Medication, MedicationBatch } from '../../../shared/types/Medication';
import type { BatchWithMedication } from '../../../shared/types/Sales';

interface MedicationWithBatchesData {
  medication: Medication;
  batchCount: number;
  totalStock: number;
  oldestBatch?: MedicationBatch;
}

interface MedicationAccordionTableProps {
  medications: Medication[];
  onEditBatch: (batch: BatchWithMedication) => void;
  onDeleteBatch: (batch: BatchWithMedication) => void;
  onCreateBatch: (medicationId: string) => void;
  loading: boolean;
}

export const MedicationAccordionTable: React.FC<MedicationAccordionTableProps> = ({
  medications,
  onEditBatch,
  onDeleteBatch,
  onCreateBatch,
  loading
}) => {
  const [expandedMedications, setExpandedMedications] = useState<Set<string>>(new Set());

  const toggleMedication = (medicationId: string) => {
    const newExpanded = new Set(expandedMedications);
    if (newExpanded.has(medicationId)) {
      newExpanded.delete(medicationId);
    } else {
      newExpanded.add(medicationId);
    }
    setExpandedMedications(newExpanded);
  };

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

  const getMedicationData = (medication: Medication): MedicationWithBatchesData => {
    const batchCount = medication.batches.length;
    const totalStock = medication.totalStock;
    const oldestBatch = medication.batches.length > 0 
      ? medication.batches.reduce((oldest, current) => 
          new Date(current.expirationDate) < new Date(oldest.expirationDate) ? current : oldest
        )
      : undefined;

    return {
      medication,
      batchCount,
      totalStock,
      oldestBatch
    };
  };

  const handleBatchEdit = (medication: Medication, batch: MedicationBatch) => {
    const batchWithMedication: BatchWithMedication = {
      ...batch,
      medication
    };
    onEditBatch(batchWithMedication);
  };

  const handleBatchDelete = (medication: Medication, batch: MedicationBatch) => {
    const batchWithMedication: BatchWithMedication = {
      ...batch,
      medication
    };
    onDeleteBatch(batchWithMedication);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (medications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay medicamentos registrados
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza agregando el primer medicamento al inventario.
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
          Medicamentos y Lotes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Vista Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Lotes</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Próximo Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication) => {
                const medicationData = getMedicationData(medication);
                const isExpanded = expandedMedications.has(medication.id);
                const oldestBatchStatus = medicationData.oldestBatch 
                  ? getExpirationStatus(medicationData.oldestBatch.expirationDate)
                  : null;

                return (
                  <React.Fragment key={medication.id}>
                    {/* Fila principal del medicamento */}
                    <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleMedication(medication.id)}>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{medication.tradeName}</div>
                          <div className="text-xs text-gray-400">
                            {medication.concentration} - {medication.presentation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          {medicationData.batchCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{medicationData.totalStock}</div>
                      </TableCell>
                      <TableCell>
                        {medicationData.oldestBatch ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(medicationData.oldestBatch.expirationDate)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {oldestBatchStatus ? (
                          <Badge variant={oldestBatchStatus.color as any}>
                            {oldestBatchStatus.label}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateBatch(medication.id);
                          }}
                        >
                          Agregar Lote
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Fila expandida con los lotes */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <div className="bg-gray-50 p-4 border-t">
                            <h4 className="font-medium mb-3 text-gray-700">
                              Lotes de {medication.tradeName}
                            </h4>
                            {medication.batches.length > 0 ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
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
                                    {medication.batches.map((batch) => {
                                      const batchStatus = getExpirationStatus(batch.expirationDate);
                                      const margin = batch.sellingPrice > 0 
                                        ? (((batch.sellingPrice - batch.purchasePrice) / batch.purchasePrice) * 100)
                                        : 0;

                                      return (
                                        <TableRow key={batch.batchId}>
                                          <TableCell className="font-mono font-medium">
                                            {batch.batchId}
                                          </TableCell>
                                          <TableCell>{batch.quantity}</TableCell>
                                          <TableCell>
                                            {batch.purchaseDate ? formatDate(batch.purchaseDate) : '-'}
                                          </TableCell>
                                          <TableCell>{formatDate(batch.expirationDate)}</TableCell>
                                          <TableCell>
                                            <Badge variant={batchStatus.color as any}>
                                              {batchStatus.label}
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
                                          <TableCell>{batch.supplier || '-'}</TableCell>
                                          <TableCell>
                                            <div className="flex gap-1">
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => handleBatchEdit(medication, batch)}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                                onClick={() => handleBatchDelete(medication, batch)}
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
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                No hay lotes registrados para este medicamento
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Vista Mobile */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {medications.map((medication) => {
              const medicationData = getMedicationData(medication);
              const isExpanded = expandedMedications.has(medication.id);
              const oldestBatchStatus = medicationData.oldestBatch 
                ? getExpirationStatus(medicationData.oldestBatch.expirationDate)
                : null;

              return (
                <Card key={medication.id}>
                  <CardContent className="p-4">
                    {/* Header del medicamento */}
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleMedication(medication.id)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{medication.tradeName}</h3>
                        <p className="text-xs text-gray-500">{medication.genericName}</p>
                        <p className="text-xs text-gray-400">{medication.concentration}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">{medicationData.totalStock}</div>
                          <div className="text-xs text-gray-500">{medicationData.batchCount} lotes</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Estado y acciones */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        {oldestBatchStatus && (
                          <Badge variant={oldestBatchStatus.color as any} className="text-xs">
                            {oldestBatchStatus.label}
                          </Badge>
                        )}
                        {medicationData.oldestBatch && (
                          <span className="text-xs text-gray-500">
                            Vence: {formatDate(medicationData.oldestBatch.expirationDate)}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateBatch(medication.id);
                        }}
                      >
                        + Lote
                      </Button>
                    </div>

                    {/* Lotes expandidos */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3 text-sm">Lotes</h4>
                        {medication.batches.length > 0 ? (
                          <div className="space-y-3">
                            {medication.batches.map((batch) => {
                              const batchStatus = getExpirationStatus(batch.expirationDate);
                              const margin = batch.sellingPrice > 0 
                                ? (((batch.sellingPrice - batch.purchasePrice) / batch.purchasePrice) * 100)
                                : 0;

                              return (
                                <div key={batch.batchId} className="bg-white border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-sm font-medium">{batch.batchId}</span>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleBatchEdit(medication, batch)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-red-600 hover:text-red-700"
                                        onClick={() => handleBatchDelete(medication, batch)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Cantidad:</span> {batch.quantity}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Vencimiento:</span> {formatDate(batch.expirationDate)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">P. Compra:</span> {formatCurrency(batch.purchasePrice)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">P. Venta:</span> {formatCurrency(batch.sellingPrice)}
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Margen:</span> 
                                      <span className={margin > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {margin.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Proveedor:</span> {batch.supplier || '-'}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-2">
                                    <Badge variant={batchStatus.color as any} className="text-xs">
                                      {batchStatus.label}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No hay lotes registrados
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
