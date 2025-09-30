import type { Sale } from '../types/Sales';
import { findSaleById } from './SalesService';
import { findMedicationById } from './MedicationService';
import { findMedicationBatchById } from './MedicationBatchService';
import { getClientById } from './ClientService';
import { UserService } from './UserService';

interface ReportData {
  sale: Sale;
  client?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  seller?: {
    fullName: string;
  };
  items: Array<{
    medication: {
      tradeName: string;
      genericName?: string;
      concentration?: string;
      presentation?: string;
    };
    batch: {
      batchId: string;
      expirationDate?: string;
    };
    quantity: number;
    unitPrice: number;
    listPrice?: number;
    discount?: number;
    total: number;
  }>;
}

/**
 * Obtiene todos los datos necesarios para generar el reporte
 */
const getSaleReportData = async (saleId: string): Promise<ReportData> => {
  const sale = await findSaleById(saleId);
  if (!sale) {
    throw new Error('Venta no encontrada');
  }

  // Obtener datos del cliente si existe
  let client = undefined;
  if (sale.client && sale.client.trim() !== '') {
    try {
      const clientData = await getClientById(sale.client);
      if (clientData) {
        client = {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address
        };
      }
    } catch (error) {
      console.warn('Error al obtener datos del cliente:', error);
    }
  }

  // Obtener datos del vendedor
  let seller = undefined;
  if (sale.createdBy) {
    try {
      const sellerResult = await UserService.getUserById(sale.createdBy);
      if (sellerResult.user) {
        seller = {
          fullName: sellerResult.user.fullName
        };
      }
    } catch (error) {
      console.warn('Error al obtener datos del vendedor:', error);
    }
  }

  // Obtener datos de medicamentos y lotes
  const items = await Promise.all(
    sale.items.map(async (item) => {
      try {
        const [medication, batch] = await Promise.all([
          findMedicationById(item.medicationId),
          findMedicationBatchById(item.batchId)
        ]);

        return {
          medication: {
            tradeName: medication?.comercialName || medication?.tradeName || 'Medicamento desconocido',
            genericName: medication?.genericName,
            concentration: medication?.concentration,
            presentation: medication?.presentation
          },
          batch: {
            batchId: batch?.batchId || item.batchId,
            expirationDate: batch?.expirationDate
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          listPrice: item.listPrice,
          discount: item.discount,
          total: item.total
        };
      } catch (error) {
        console.warn('Error al obtener datos del item:', error);
        return {
          medication: {
            tradeName: 'Medicamento desconocido'
          },
          batch: {
            batchId: item.batchId
          },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          listPrice: item.listPrice,
          discount: item.discount,
          total: item.total
        };
      }
    })
  );

  return {
    sale,
    client,
    seller,
    items
  };
};

/**
 * Genera el HTML para la nota de venta
 */
const generateSaleHTML = (data: ReportData): string => {
  const { sale, client, items } = data;
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nota de Venta - ${sale.id}</title>
      <style>
        @page {
          margin: 10mm;
          size: A4;
        }
        
        html {
          display: flex;
          justify-content: center;
          align-items: center;
          width: auto;
          height: auto;
          padding: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          background-color: #fff;
          min-width: 210mm;
          margin: 0 auto;
          padding: 20px;
        }
        
        /* Mejoras para vista previa en pantalla */
        @media screen {
          body {
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            margin: 20px auto;
            background: white;
          }
          
          .header {
            animation: fadeInDown 0.6s ease-out;
          }
          
          .client-info {
            animation: fadeInLeft 0.8s ease-out;
          }
          
          .items-table {
            animation: fadeInUp 1s ease-out;
          }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
        }
        
        
        .logo-section {
          flex: 1;
        }
        
        .logo {
          width: 250px;
          height: auto;
          margin-bottom: 15px;
         
        }
        
        .company-info {
          font-size: 11px;
          color: #666;
          line-height: 1.6;
        }
        
        .invoice-info {
          text-align: right;
          flex: 1;
        }
        
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #dd1a80;
          margin-bottom: 15px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          letter-spacing: 1px;
        }
        
        .invoice-details {
          
          padding-left: 20px;
          padding-right: 20px;
          border-radius: 12px;
         
          
        }
        
        .invoice-details table {
          width: 100%;
        }
        
        .invoice-details td {
          padding: 6px 0;
          font-size: 12px;
        }
        
        .invoice-details td:first-child {
          font-weight: bold;
          color: #495057;
          min-width: 120px;
        }
        
        .client-info {
          
          padding: 0px 20px 20px 20px;
         
          border-radius: 12px;
          
         
        }
        
        .client-info h3 {
          margin-bottom: 15px;
          
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .client-info h3::before {
         
          font-size: 18px;
        }
        
        .client-grid {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 8px 18px;
          align-items: center;
        }

        /* Cada fila del cliente: una etiqueta a la izquierda y el valor a la derecha */
        .client-row {
          display: contents; /* permite que los hijos participen del grid */
        }

        .client-label {
          font-weight: 700;
          color: #495057;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 6px 0;
        }

        .client-value {
          border-bottom: 2px solid #dee2e6;
          padding: 6px 0;
          min-height: 20px;
          font-weight: 600;
          color: #222;
        }

        @media (max-width: 520px) {
          .client-grid {
            grid-template-columns: 1fr;
          }

          .client-label {
            text-transform: none;
            font-size: 12px;
            color: #666;
          }

          .client-value {
            padding-left: 0;
          }
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .items-table th {
          background: linear-gradient(135deg, #FF6B6B 0%, #ee5555 100%);
          color: white;
          padding: 16px 12px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: none;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        
        .items-table td {
          padding: 14px 12px;
          text-align: center;
          border-bottom: 1px solid #e9ecef;
          font-size: 11px;
          vertical-align: middle;
        }
        
        .items-table tbody tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .items-table tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }
        
        .items-table tbody tr:hover {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
          transform: scale(1.01);
          transition: all 0.3s ease;
        }
        
        .item-description {
          text-align: left;
          max-width: 300px;
        }
        
        .item-name {
          font-weight: 500;
          text-align: left;
          margin-bottom: 4px;
          color: #2c3e50;
          font-size: 12px;
        }
        
        .item-details {
          color: #6c757d;
          font-size: 10px;
          line-height: 1.4;
        }
        
        .currency {
          text-align: right;
          font-weight: 600;
         
        }
        
        .totals-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .comments-section {
          flex: 1;
          margin-right: 30px;
        }
        
        .comments-box {
          border: 1px solid #ddd;
          padding: 15px;
          min-height: 80px;
          border-radius: 4px;
          background-color: #fafafa;
        }
        
        .comments-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #666;
        }
        
        .totals-table {
          border-collapse: collapse;
          min-width: 250px;
        }
        
        .totals-table td {
          padding: 8px 15px;
          border: none;
        }
        
        .totals-table td:first-child {
          text-align: right;
          font-weight: bold;
          color: #666;
        }
        
        .totals-table td:last-child {
          text-align: right;
          border-bottom: 1px solid #eee;
        }
        
        .total-final {
         
          
          font-weight: bold;
          font-size: 14px;
        }
        
        .footer {
          
          text-align: center;
          
          color: #666;
          font-size: 16px;
        }
        
        .company-footer {
          margin-top: 10px;
          color: #dd1a80;
          font-weight: bold;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .invoice-info {
            page-break-inside: avoid;
          }
          
          .items-table {
            page-break-inside: auto;
          }
          
          .items-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .totals-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <img src="/logo.png" alt="Logo de la empresa" class="logo" />
          
        </div>
        
        <div class="invoice-info">
          <div class="invoice-title">NOTA DE VENTA</div>
          <div class="invoice-details">
            <table>
              <tr>
                <td>Nota de venta No.:</td>
                <td>${sale.numberInvoice}</td>
              </tr>
              <tr>
                <td>Fecha:</td>
                <td>${formatDate(sale.createdAt)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      
      <div class="client-info">
       
        <div class="client-grid">
          <div class="client-row">
            <div class="client-label">Nombre del cliente</div>
            <div class="client-value">${client?.name || 'Cliente general'}</div>
          </div>

          <div class="client-row">
            <div class="client-label">Email</div>
            <div class="client-value">${client?.email || ''}</div>
          </div>

          <div class="client-row">
            <div class="client-label">Teléfono</div>
            <div class="client-value">${client?.phone || ''}</div>
          </div>

         
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Cantidad</th>
            <th>Descripción</th>
            <th>Precio unitario</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.quantity}</td>
              <td class="item-description">
                <div class="item-name">${item.medication.tradeName}</div>
                
                
                </div>
              </td>
              <td class="currency">${formatCurrency(item.unitPrice)}</td>
              <td class="currency">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
          ${Array.from({ length: Math.max(0, 10 - items.length) }, (_, index) => `
            <tr>
              <td>${items.length + index + 1}</td>
              <td></td>
              <td class="item-description"></td>
              <td class="currency"></td>
              <td class="currency"></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals-section">
        <div class="comments-section">
          <div class="comments-title">Comentarios</div>
          <div class="comments-box">
            ${sale.saleNotes || ''}
          </div>
        </div>
        
        <table class="totals-table">
          <tr>
            <td>Subtotal</td>
            <td class="currency">${formatCurrency((sale.totalDiscount || 0) + (sale.total || 0))}</td>
          </tr>
           <tr>
            <td>Descuento</td>
            <td class="currency">${formatCurrency(sale.totalDiscount || 0)}</td>
          </tr>
         
          <tr class="total-final">
            <td>Total</td>
            <td class="currency">${formatCurrency(sale.total)}</td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <div class="company-footer">Farmacia La Bonita</div>
        <div>farmaciaslabonita@gmail.com / 76135456</div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera y muestra el reporte de venta para imprimir
 */
export const generateSaleReport = async (saleId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Generando reporte para venta:', saleId);
    
    // Obtener los datos de la venta
    const reportData = await getSaleReportData(saleId);
    
    // Generar el HTML
    const htmlContent = generateSaleHTML(reportData);
    
    // Mejor detección de Electron
    const isElectron = typeof window !== 'undefined' && 
                     (window as any).electronAPI !== undefined ||
                     (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'));
    
    console.log('¿Es Electron?', isElectron);
    
    if (isElectron) {
      // Solución para Electron: crear el contenido en la misma ventana
      return await generateSaleReportElectron(htmlContent);
    } else {
      // En navegador web regular
      return await generateSaleReportBrowser(htmlContent);
    }
    
  } catch (error) {
    console.error('Error al generar el reporte de venta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al generar el reporte' 
    };
  }
};

/**
 * Generar reporte específicamente para Electron
 */
const generateSaleReportElectron = async (htmlContent: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Crear un iframe oculto para contener el contenido de impresión
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    // Escribir el contenido al iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (!frameDoc) {
      throw new Error('No se pudo acceder al documento del iframe');
    }
    
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();
    
    // Esperar a que el contenido cargue completamente
    await new Promise<void>((resolve) => {
      const checkLoaded = () => {
        if (frameDoc.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
    
    // Crear una ventana de vista previa usando un div modal
    const modal = createPrintModal(htmlContent);
    document.body.appendChild(modal);
    
    // Limpiar el iframe
    setTimeout(() => {
      if (printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }
    }, 100);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error en generateSaleReportElectron:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al generar el reporte en Electron' 
    };
  }
};

/**
 * Generar reporte para navegador web
 */
const generateSaleReportBrowser = async (htmlContent: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Intentar con window.open primero
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      // Si falla window.open, usar el modal como fallback
      console.log('window.open falló, usando modal como fallback');
      const modal = createPrintModal(htmlContent);
      document.body.appendChild(modal);
      return { success: true };
    }
    
    // Escribir el contenido HTML
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que cargue completamente y luego abrir el diálogo de impresión
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
    
    return { success: true };
    
  } catch (error) {
    console.error('Error en generateSaleReportBrowser:', error);
    
    // Como último recurso, crear el modal
    try {
      const modal = createPrintModal(htmlContent);
      document.body.appendChild(modal);
      return { success: true };
    } catch (modalError) {
      console.error('Error creando modal:', modalError);
      return { 
        success: false, 
        error: 'No se pudo generar el reporte. Intente nuevamente.' 
      };
    }
  }
};

/**
 * Crear un modal de vista previa e impresión para Electron
 */
const createPrintModal = (htmlContent: string): HTMLElement => {
  // Crear overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  overlay.style.zIndex = '10000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.padding = '20px';
  
  // Crear contenedor del modal - MUCHO MÁS ANCHO
  const modal = document.createElement('div');
  modal.style.backgroundColor = 'white';
  modal.style.borderRadius = '12px';
  modal.style.padding = '0';
  modal.style.width = '95vw';  // 95% del ancho de la ventana
  modal.style.height = '95vh'; // 95% del alto de la ventana
  modal.style.maxWidth = '1400px'; // Máximo muy amplio
  modal.style.maxHeight = '900px';  // Alto máximo
  modal.style.overflow = 'hidden';
  modal.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
  modal.style.position = 'relative';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  
  // Crear header con botones - MÁS PROMINENTE
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.padding = '20px 24px';
  
  header.style.backgroundColor = '#f9fafb';
  header.style.borderRadius = '12px 12px 0 0';
  header.style.flexShrink = '0';
  
  const title = document.createElement('h2');
  title.textContent = '📄 Vista Previa - Nota de Venta';
  title.style.margin = '0';
  title.style.color = '#1f2937';
  title.style.fontSize = '20px';
  title.style.fontWeight = '600';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '8px';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '12px';
  
  // Botón de imprimir - MÁS GRANDE Y PROMINENTE
  const printButton = document.createElement('button');
  printButton.innerHTML = '🖨️ Imprimir Documento';
  printButton.style.padding = '12px 24px';
  printButton.style.backgroundColor = '#10b981';
  printButton.style.color = 'white';
  printButton.style.border = 'none';
  printButton.style.borderRadius = '8px';
  printButton.style.cursor = 'pointer';
  printButton.style.fontSize = '16px';
  printButton.style.fontWeight = '600';
  printButton.style.transition = 'all 0.2s ease';
  printButton.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
  
  // Efectos hover para el botón de imprimir
  printButton.addEventListener('mouseenter', () => {
    printButton.style.backgroundColor = '#059669';
    printButton.style.transform = 'translateY(-1px)';
    printButton.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
  });
  
  printButton.addEventListener('mouseleave', () => {
    printButton.style.backgroundColor = '#10b981';
    printButton.style.transform = 'translateY(0)';
    printButton.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
  });
  
  // Botón de cerrar - MÁS GRANDE
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕ Cerrar';
  closeButton.style.padding = '12px 24px';
  closeButton.style.backgroundColor = '#ef4444';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '8px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  closeButton.style.fontWeight = '600';
  closeButton.style.transition = 'all 0.2s ease';
  closeButton.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
  
  // Efectos hover para el botón de cerrar
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = '#dc2626';
    closeButton.style.transform = 'translateY(-1px)';
    closeButton.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
  });
  
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = '#ef4444';
    closeButton.style.transform = 'translateY(0)';
    closeButton.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
  });
  
  // Crear iframe para mostrar el contenido - OCUPA TODO EL ESPACIO
  const contentFrame = document.createElement('iframe');
  contentFrame.style.width = '100%';
  contentFrame.style.height = '100%';
  contentFrame.style.border = 'none';
  contentFrame.style.borderRadius = '0 0 12px 12px';
  contentFrame.style.flex = '1';
  contentFrame.style.backgroundColor = 'white';
  
  // Contenedor para el iframe con scroll si es necesario
  const contentContainer = document.createElement('div');
  contentContainer.style.flex = '1';
  contentContainer.style.overflow = 'auto';
  contentContainer.style.backgroundColor = '#f3f4f6';
  contentContainer.style.padding = '0';
  contentContainer.appendChild(contentFrame);
  
  // Ensamblar el modal
  buttonContainer.appendChild(printButton);
  buttonContainer.appendChild(closeButton);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  modal.appendChild(header);
  modal.appendChild(contentContainer); // Usar el contenedor en lugar del iframe directo
  overlay.appendChild(modal);
  
  // Escribir contenido al iframe con mejor carga
  setTimeout(() => {
    const frameDoc = contentFrame.contentDocument || contentFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
      
      // Optimizar el contenido para vista previa
      setTimeout(() => {
        const style = frameDoc.createElement('style');
        style.textContent = `
          body {
            zoom: 0.8; /* Zoom out para mejor vista previa */
            margin: 20px;
            transform-origin: top left;
          }
          @media screen {
            .invoice-info {
              page-break-inside: avoid;
            }
            .items-table {
              font-size: 11px;
            }
          }
        `;
        frameDoc.head.appendChild(style);
      }, 200);
    }
  }, 100);
  
  // Event listeners con feedback visual
  printButton.addEventListener('click', () => {
    const frameWindow = contentFrame.contentWindow;
    if (frameWindow) {
      // Mostrar indicador de carga
      printButton.innerHTML = '⏳ Preparando impresión...';
      printButton.disabled = true;
      
      setTimeout(() => {
        frameWindow.print();
        // Restaurar botón después de un momento
        setTimeout(() => {
          printButton.innerHTML = '🖨️ Imprimir Documento';
          printButton.disabled = false;
        }, 1000);
      }, 100);
    }
  });
  
  closeButton.addEventListener('click', () => {
    // Animación de cierre suave
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 300);
  });
  
  // Cerrar al hacer clic en el overlay (fuera del modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      // Animación de cierre suave
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  });
  
  // Cerrar con Escape con animación
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        document.removeEventListener('keydown', handleKeyPress);
      }, 300);
    }
  };
  document.addEventListener('keydown', handleKeyPress);
  
  // Animación de entrada suave
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.3s ease';
  }, 50);
  
  return overlay;
};

/**
 * Versión alternativa que abre el reporte en la misma ventana (para Electron)
 */
export const generateSaleReportInline = async (saleId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Generando reporte inline para venta:', saleId);
    
    // Obtener los datos de la venta
    const reportData = await getSaleReportData(saleId);
    
    // Generar el HTML
    const htmlContent = generateSaleHTML(reportData);
    
    // Crear un blob con el contenido HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Abrir en la misma ventana
    window.location.href = url;
    
    return { success: true };
    
  } catch (error) {
    console.error('Error al generar el reporte de venta inline:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al generar el reporte' 
    };
  }
};