import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SaleState } from '@/shared/types/modelTypes/Sale';
import { logoBase64 } from '@/assets/logoBase64';

interface QuotationPdfOptions {
  saleState: SaleState;
  quotationNumber?: string;
  sellerName?: string;
}

export class QuotationPdfService {
  private static readonly COMPANY_NAME = 'Sistema SOMOS Total';
  private static readonly COLORS = {
    primary: '#016c72',
    secondary: '#64748b',
    text: '#1e293b',
    lightGray: '#f1f5f9',
  };

  /**
   * Genera un PDF de cotización
   */
  static generateQuotationPdf(options: QuotationPdfOptions): jsPDF {
    const { saleState, quotationNumber = 'COTIZ-001', sellerName = 'Vendedor' } = options;
    const doc = new jsPDF();

    // Configuración del documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header - Información de la empresa y cotización
    this.addHeaderWithQuotationInfo(doc, pageWidth, margin, quotationNumber, saleState, sellerName);

    // Tabla de productos
    this.addProductsTable(doc, saleState);

    // Resumen de totales
    this.addTotalsSummary(doc, saleState, pageWidth, margin);

    // Notas
    if (saleState.saleNotes) {
      this.addNotes(doc, saleState.saleNotes, margin);
    }

    // Footer
    this.addFooter(doc, pageWidth);

    return doc;
  }

  /**
   * Agrega el encabezado y la información principal de la cotización
   */
  private static addHeaderWithQuotationInfo(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    quotationNumber: string,
    saleState: SaleState,
    sellerName: string
  ): void {
    // Título "COTIZACIÓN" en la parte superior izquierda
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(this.COLORS.text);
    doc.text('COTIZACIÓN', margin, 20);

    // Número de cotización en la esquina superior derecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(this.COLORS.text);
    doc.text(`${quotationNumber}`, pageWidth - margin, 12, { align: 'right' });

    // Logo debajo del número de cotización en la parte superior derecha
    doc.addImage(logoBase64, 'PNG', pageWidth - margin - 42, 16, 40, 20);

    // Información principal: Fecha, Vendedor, Cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(this.COLORS.secondary);

    const currentDate = new Date().toLocaleDateString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const vendedor = sellerName || 'Vendedor';
    const cliente = saleState.clientName || 'Cliente General';

    let infoY = 34;
    doc.text(`FECHA:      ${currentDate}`, margin, infoY);
    infoY += 6;
    doc.text(`VENDEDOR:   ${vendedor}`, margin, infoY);
    infoY += 6;
    doc.text(`CLIENTE:    ${cliente}`, margin, infoY);
  }

  /**
   * Agrega la tabla de productos
   */
  private static addProductsTable(doc: jsPDF, saleState: SaleState): void {
    const tableData = saleState.items.map((item, index) => [
      (index + 1).toString(),
      item.productName,
     
      item.quantity.toString(),
      this.formatCurrency(item.unitPrice, saleState.paymentCurrency),
      this.formatCurrency(item.total, saleState.paymentCurrency),
    ]);

    autoTable(doc, {
      startY: saleState.nitClient || saleState.socialReasonClient ? 70 : 60,
      head: [['#', 'Producto', 'Cant.', 'Precio Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.COLORS.primary,
        textColor: '#ffffff',
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: this.COLORS.text,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: this.COLORS.lightGray,
      },
    });
  }

  /**
   * Agrega el resumen de totales
   */
  private static addTotalsSummary(
    doc: jsPDF,
    saleState: SaleState,
    pageWidth: number,
    margin: number
  ): void {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    let yPosition = finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const rightAlign = pageWidth - margin;
    const labelX = rightAlign - 60;
    const valueX = rightAlign;

    // Subtotal
    doc.setTextColor(this.COLORS.secondary);
    doc.text('Subtotal:', labelX, yPosition, { align: 'right' });
    doc.text(
      this.formatCurrency(saleState.subtotal, saleState.paymentCurrency),
      valueX,
      yPosition,
      { align: 'right' }
    );

    // Descuentos
    if (saleState.totalDiscount > 0) {
      yPosition += 6;
      doc.text('Descuentos:', labelX, yPosition, { align: 'right' });
      doc.setTextColor('#dc2626');
      doc.text(
        `- ${this.formatCurrency(saleState.totalDiscount, saleState.paymentCurrency)}`,
        valueX,
        yPosition,
        { align: 'right' }
      );
    }

    // Total
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.COLORS.primary);
    doc.text('TOTAL:', labelX, yPosition, { align: 'right' });
    doc.text(
      this.formatCurrency(saleState.total, saleState.paymentCurrency),
      valueX,
      yPosition,
      { align: 'right' }
    );
  }

  /**
   * Agrega notas adicionales
   */
  private static addNotes(doc: jsPDF, notes: string, margin: number): void {
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    const yPosition = finalY + 30;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(this.COLORS.text);
    doc.text('NOTAS:', margin, yPosition);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(this.COLORS.secondary);
    
    const splitNotes = doc.splitTextToSize(notes, 180);
    doc.text(splitNotes, margin, yPosition + 5);
  }

  /**
   * Agrega el pie de página
   */
  private static addFooter(doc: jsPDF, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 15;

    doc.setFontSize(8);
    doc.setTextColor(this.COLORS.secondary);
    doc.setFont('helvetica', 'italic');
    
    const footerText = 'Esta es una cotización válida por 15 días. No constituye factura fiscal.';
    doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  }

  /**
   * Formatea moneda según el tipo
   */
  private static formatCurrency(amount: number, currency: 'bs' | 'arg'): string {
    const symbol = currency === 'bs' ? 'Bs' : 'ARS';
    return `${symbol} ${amount.toFixed(2)}`;
  }

  /**
   * Genera el nombre del archivo PDF
   */
  static generateFileName(clientName?: string): string {
    const date = new Date().toISOString().split('T')[0];
    const client = clientName ? clientName.replace(/\s+/g, '_') : 'Cliente_General';
    return `Cotizacion_${client}_${date}.pdf`;
  }
}
