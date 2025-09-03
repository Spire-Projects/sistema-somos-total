import { memo, useState, useEffect } from 'react';
import { formatCurrency } from '@/shared/services/BatchService';
import { formatDate } from '@/shared/utils/date.utils';
import { UserService } from '@/shared/services/UserService';
import { getClientById } from '@/shared/services/ClientService';
import { findMedicById } from '@/shared/services/MedicService';
import { updateSaleFacturedStatus } from '@/shared/services/SalesService';
import { Button } from '@/shared/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Sale } from '@/shared/types/Sales';
import type { AuthUser } from '@/shared/types/User';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';
import { getMedicationViewById } from '@/shared/services';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface SaleDetailsProps {
  sale: Sale;
  onSaleUpdate?: (updatedSale: Sale) => void;
}

const SaleDetails = memo(({ sale, onSaleUpdate }: SaleDetailsProps) => {
  const [createdByUser, setCreatedByUser] = useState<AuthUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [medic, setMedic] = useState<Medic | null>(null);
  const [currentSale, setCurrentSale] = useState<Sale>(sale);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [updatingFactured, setUpdatingFactured] = useState(false);

  const [loading, setLoading] = useState({
    user: false,
    client: false,
    medic: false
  });

  // Actualizar el estado local cuando cambie la prop sale
  useEffect(() => {
    setCurrentSale(sale);
  }, [sale]);

  // Manejar actualización del estado de facturación
  const handleToggleFactured = async () => {
    if (!currentSale.factured) {
      // Si va a marcar como facturado, hacerlo directamente
      await updateFacturedStatus(true);
    } else {
      // Si va a desmarcar, mostrar diálogo de confirmación
      setShowConfirmDialog(true);
    }
  };

  // Actualizar estado de facturación
  const updateFacturedStatus = async (factured: boolean) => {
    try {
      setUpdatingFactured(true);
      const updatedSale = await updateSaleFacturedStatus(currentSale.id, factured);
      setCurrentSale(updatedSale);
      
      // Notificar al componente padre si existe la función
      if (onSaleUpdate) {
        onSaleUpdate(updatedSale);
      }
    } catch (error) {
      console.error('Error updating factured status:', error);
      // TODO: Mostrar toast de error
    } finally {
      setUpdatingFactured(false);
      setShowConfirmDialog(false);
    }
  };

  // Confirmar desmarcado de facturación
  const handleConfirmUnmark = async () => {
    await updateFacturedStatus(false);
  };

  // Cargar información del usuario que creó la venta
  useEffect(() => {
    const fetchCreatedByUser = async () => {
      console.log('Cargando usuario creado por:', currentSale.createdBy);
      if (!currentSale.createdBy) return;

      try {
        setLoading(prev => ({ ...prev, user: true }));
        const response = await UserService.getUserById(currentSale.createdBy);
        console.log('Respuesta del usuario:', response);
        if (response.success && response.user) {
          setCreatedByUser(response.user);
          console.log('Usuario creado por:', response.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(prev => ({ ...prev, user: false }));
      }
    };

    fetchCreatedByUser();
  }, [currentSale.createdBy]);

  // Cargar información del cliente
  useEffect(() => {
    const fetchClient = async () => {
      if (!currentSale.client) return;

      try {
        setLoading(prev => ({ ...prev, client: true }));
        const clientData = await getClientById(currentSale.client);
        if (clientData) {
          setClient(clientData);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(prev => ({ ...prev, client: false }));
      }
    };

    fetchClient();
  }, [currentSale.client]);

  // Cargar información del médico
  useEffect(() => {
    const fetchMedic = async () => {
      if (!currentSale.idMedic) return;

      try {
        setLoading(prev => ({ ...prev, medic: true }));
        const medicData = await findMedicById(currentSale.idMedic);
        if (medicData) {
          setMedic(medicData);
        }
      } catch (error) {
        console.error('Error fetching medic:', error);
      } finally {
        setLoading(prev => ({ ...prev, medic: false }));
      }
    };

    fetchMedic();
  }, [currentSale.idMedic]);

  // Cargar información del medicamento
  const [medicationsMap, setMedicationsMap] = useState<Record<string, MedicationCatalogView | null>>({});
  const [medicationsLoading, setMedicationsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

        const fetchMedications = async () => {
          setMedicationsLoading(true);
          const map: Record<string, MedicationCatalogView | null> = {};

          try {
            for (const item of currentSale.items) {
              try {
                const med = await getMedicationViewById(item.medicationId);
                map[item.medicationId] = med ?? null;
              } catch (err) {
                console.error('Error fetching medication', item.medicationId, err);
                map[item.medicationId] = null;
              }
            }
          } finally {
            if (mounted) {
              setMedicationsMap(map);
              setMedicationsLoading(false);
            }
          }
        };

        if (currentSale.items && currentSale.items.length > 0) {
          fetchMedications();
        }

        return () => { mounted = false; };
      }, [currentSale.items]);

  // Funciones para mostrar la información
  const getCreatedByDisplay = () => {
    if (loading.user) return 'Cargando...';
    if (createdByUser) return createdByUser.fullName;
    return currentSale.createdBy || 'Usuario desconocido';
  };

  const getClientDisplay = () => {
    if (loading.client) return 'Cargando...';
    if (client) return client.name;
    if (currentSale.client) return currentSale.client;
    return 'Cliente general';
  };

  const getMedicDisplay = () => {
    if (loading.medic) return 'Cargando...';
    if (medic) return medic.fullName;
    if (currentSale.idMedic) return currentSale.idMedic;
    return 'Sin médico asignado';
  };

  return (
    <>
      <div className="bg-gray-50 p-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Información general */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Información General</h4>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-600">Fecha:</span>
                <span className="ml-1">{formatDate(currentSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Método de pago:</span>
                <span className="ml-1 capitalize">{currentSale.paymentMethod}</span>
              </div>
              <div>
                <span className="text-gray-600">Creado por:</span>
                <span className="ml-1">{getCreatedByDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Cliente y médico */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Cliente y Médico</h4>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-600">Cliente:</span>
                <span className="ml-1">{getClientDisplay()}</span>
              </div>
              <div>
                <span className="text-gray-600">Médico:</span>
                <span className="ml-1">{getMedicDisplay()}</span>
              </div>
              <div>
                <span className="text-gray-600">Facturado:</span>
                <span className={`ml-1 ${currentSale.factured ? 'text-green-600' : 'text-orange-600'}`}>
                  {currentSale.factured ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de NIT */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Información de NIT</h4>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-600">NIT:</span>
                <span className="ml-1">{currentSale.nitClient || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-gray-600">Razón Social:</span>
                <span className="ml-1">{currentSale.socialReasonClient || 'No especificada'}</span>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-900">Totales</h4>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-gray-600">Monto sin desc.:</span>
                <span className="ml-1">{formatCurrency(currentSale.totalWithoutDiscount ?? 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Subtotal con desc.:</span>
                <span className="ml-1">
                  {formatCurrency((currentSale.total ?? 0) + (currentSale.totalDiscount ?? 0))}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Descuento venta:</span>
                <span className="ml-1 text-red-600">-{formatCurrency(currentSale.totalDiscount ?? 0)}</span>
              </div>
              <div>
                <span className="text-gray-600 font-semibold">Total:</span>
                <span className="ml-1 font-semibold text-green-600">{formatCurrency(currentSale.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas de venta */}
        {currentSale.saleNotes && currentSale.saleNotes.trim() && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
              <span>📝</span>
              Notas de la Venta
            </h4>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{currentSale.saleNotes}</p>
          </div>
        )}

        {/* Botón de facturación */}
        <div className="mb-4 flex justify-end">
          <Button
            onClick={handleToggleFactured}
            disabled={updatingFactured}
            size="sm"
            variant={currentSale.factured ? "outline" : "default"}
            className={`${
              currentSale.factured 
                ? "text-red-600 border-red-600 hover:bg-red-50" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {updatingFactured ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : currentSale.factured ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Desmarcar como Facturado
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como Facturado
              </>
            )}
          </Button>
        </div>

        {/* Items de la venta */}
        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-3">
            Items de la venta ({currentSale.items.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2 font-medium text-gray-700">Medicamento</th>
                  <th className="text-right p-2 font-medium text-gray-700">Cantidad</th>
                  <th className="text-right p-2 font-medium text-gray-700">Precio Unit.</th>
                  {currentSale.items.some(item => item.listPrice) && (
                    <th className="text-right p-2 font-medium text-gray-700">Precio Lista</th>
                  )}
                  {currentSale.items.some(item => item.discount) && (
                    <th className="text-right p-2 font-medium text-gray-700">Descuento por Unidad</th>
                  )}
                  <th className="text-right p-2 font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentSale.items.map((item, index) => {
                  const medication = medicationsMap[item.medicationId];
                  const medicationLabel = medication?.comercialName || "nada" || (medicationsLoading ? 'Cargando...' : 'Medicamento desconocido');
                  
                  return (
                    <tr key={`${item.batchId}-${index}`} className="hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{medicationLabel}</div>
                          <div className="text-gray-500">Lote: {item.batchId}</div>
                        </div>
                      </td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      {currentSale.items.some(i => i.listPrice) && (
                        <td className="p-2 text-right">
                          {item.listPrice ? formatCurrency(item.listPrice) : '-'}
                        </td>
                      )}
                      {currentSale.items.some(i => i.discount) && (
                        <td className="p-2 text-right text-red-600">
                          {item.discount ? `-${formatCurrency(item.discount)}` : '-'}
                        </td>
                      )}
                      <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Confirmar Desmarcado
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desmarcar esta venta como facturada?
              Esta acción cambiará el estado de facturación de "Facturado" a "Pendiente".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={updatingFactured}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmUnmark}
              disabled={updatingFactured}
            >
              {updatingFactured ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Sí, Desmarcar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

SaleDetails.displayName = 'SaleDetails';

export default SaleDetails;
