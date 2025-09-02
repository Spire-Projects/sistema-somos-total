import { memo, useState, useEffect } from 'react';
import { formatCurrency } from '@/shared/services/BatchService';
import { formatDate } from '@/shared/utils/date.utils';
import { UserService } from '@/shared/services/UserService';
import { getClientById } from '@/shared/services/ClientService';
import { findMedicById } from '@/shared/services/MedicService';
import type { Sale } from '@/shared/types/Sales';
import type { AuthUser } from '@/shared/types/User';
import type { Client } from '@/shared/types/Client';
import type { Medic } from '@/shared/types/Sales';
import { findMedicationById, getMedicationViewById } from '@/shared/services';
import type { Medication } from '@/shared/types/Medication';
import type { MedicationCatalogView } from '@/shared/types/MedicationViewTypes';

interface SaleDetailsProps {
  sale: Sale;
}

const SaleDetails = memo(({ sale }: SaleDetailsProps) => {
  const [createdByUser, setCreatedByUser] = useState<AuthUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [medic, setMedic] = useState<Medic | null>(null);

  const [loading, setLoading] = useState({
    user: false,
    client: false,
    medic: false
  });

  // Cargar información del usuario que creó la venta
  useEffect(() => {
    const fetchCreatedByUser = async () => {
      console.log('Cargando usuario creado por:', sale.createdBy);
      if (!sale.createdBy) return;

      try {
        setLoading(prev => ({ ...prev, user: true }));
        const response = await UserService.getUserById(sale.createdBy);
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
  }, [sale.createdBy]);

  // Cargar información del cliente
  useEffect(() => {
    const fetchClient = async () => {
      if (!sale.client) return;

      try {
        setLoading(prev => ({ ...prev, client: true }));
        const clientData = await getClientById(sale.client);
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
  }, [sale.client]);

  // Cargar información del médico
  useEffect(() => {
    const fetchMedic = async () => {
      if (!sale.idMedic) return;

      try {
        setLoading(prev => ({ ...prev, medic: true }));
        const medicData = await findMedicById(sale.idMedic);
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
  }, [sale.idMedic]);

  // Cargar información del medicamento
  const [medicationsMap, setMedicationsMap] = useState<Record<string, MedicationCatalogView | null>>({});
  const [medicationsLoading, setMedicationsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchMedications = async () => {
      setMedicationsLoading(true);
      const map: Record<string, MedicationCatalogView | null> = {};

      try {
        for (const item of sale.items) {
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

    if (sale.items && sale.items.length > 0) {
      fetchMedications();
    }

    return () => { mounted = false; };
  }, [sale.items]);

  // Funciones para mostrar la información
  const getCreatedByDisplay = () => {
    if (loading.user) return 'Cargando...';
    if (createdByUser) return createdByUser.fullName;
    return sale.createdBy || 'Usuario desconocido';
  };

  const getClientDisplay = () => {
    if (loading.client) return 'Cargando...';
    if (client) return client.name;
    if (sale.client) return sale.client;
    return 'Cliente general';
  };

  const getMedicDisplay = () => {
    if (loading.medic) return 'Cargando...';
    if (medic) return medic.fullName;
    if (sale.idMedic) return sale.idMedic;
    return 'Sin médico asignado';
  };return (
    <div className="bg-gray-50 p-4 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Información general */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Información General</h4>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-600">Fecha:</span>
              <span className="ml-1">{formatDate(sale.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-600">Método de pago:</span>
              <span className="ml-1 capitalize">{sale.paymentMethod}</span>
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
              <span className={`ml-1 ${sale.factured ? 'text-green-600' : 'text-orange-600'}`}>
                {sale.factured ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">Totales</h4>
          <div className="space-y-1 text-xs">
           
              <div>
                <span className="text-gray-600">Monto sin desc.:</span>
                <span className="ml-1">{formatCurrency(sale.totalWithoutDiscount?? 0)}</span>
              </div>
               <div>
                <span className="text-gray-600">Subtotal con desc.:</span>
                <span className="ml-1">
                  {formatCurrency((sale.total ?? 0) + (sale.totalDiscount ?? 0))}
                </span>
              </div>
            
            
              <div>
                <span className="text-gray-600">Descuento venta:</span>
                <span className="ml-1 text-red-600">-{formatCurrency(sale.totalDiscount?? 0)}</span>
              </div>
            
            <div>
              <span className="text-gray-600 font-semibold">Total:</span>
              <span className="ml-1 font-semibold text-green-600">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items de la venta */}
      <div>
        <h4 className="font-semibold text-sm text-gray-900 mb-3">
          Items de la venta ({sale.items.length})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 font-medium text-gray-700">Medicamento</th>
                <th className="text-right p-2 font-medium text-gray-700">Cantidad</th>
                <th className="text-right p-2 font-medium text-gray-700">Precio Unit.</th>
                {sale.items.some(item => item.listPrice) && (
                  <th className="text-right p-2 font-medium text-gray-700">Precio Lista</th>
                )}
                {sale.items.some(item => item.discount) && (
                  <th className="text-right p-2 font-medium text-gray-700">Descuento por Unidad</th>
                )}
                <th className="text-right p-2 font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sale.items.map((item, index) => {
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
                    {sale.items.some(i => i.listPrice) && (
                      <td className="p-2 text-right">
                        {item.listPrice ? formatCurrency(item.listPrice) : '-'}
                      </td>
                    )}
                    {sale.items.some(i => i.discount) && (
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
  );
});

SaleDetails.displayName = 'SaleDetails';

export default SaleDetails;
