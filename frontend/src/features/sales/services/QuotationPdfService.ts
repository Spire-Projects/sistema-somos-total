import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SaleState } from '@/shared/types/modelTypes/Sale';

interface QuotationPdfOptions {
  saleState: SaleState;
  quotationNumber?: string;
}

export class QuotationPdfService {
  private static readonly COMPANY_NAME = 'Sistema SOMOS Total';
  private static readonly COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#1e293b',
    lightGray: '#f1f5f9',
  };

  /**
   * Genera un PDF de cotización
   */
  static generateQuotationPdf(options: QuotationPdfOptions): jsPDF {
    const { saleState, quotationNumber = 'COTIZ-001' } = options;
    const doc = new jsPDF();

    // Configuración del documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header - Información de la empresa
    this.addHeader(doc, pageWidth, margin);

    // Información de la cotización
    this.addQuotationInfo(doc, quotationNumber, saleState, margin);

    // Información del cliente
    this.addClientInfo(doc, saleState, pageWidth, margin);

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
   * Agrega el encabezado del documento
   */
  private static addHeader(doc: jsPDF, pageWidth: number, margin: number): void {
    // Logo/Nombre de la empresa
    doc.setFontSize(20);
    doc.setTextColor(this.COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_NAME, margin, 20);

    // Título del documento
    doc.setFontSize(16);
    doc.setTextColor(this.COLORS.text);
    doc.text('COTIZACIÓN', pageWidth - margin, 20, { align: 'right' });

    // Línea separadora
    doc.setDrawColor(this.COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);
  }

  /**
   * Agrega información de la cotización
   */
  private static addQuotationInfo(
    doc: jsPDF,
    quotationNumber: string,
    saleState: SaleState,
    margin: number
  ): void {
    const currentDate = new Date().toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.setFontSize(10);
    doc.setTextColor(this.COLORS.secondary);
    doc.setFont('helvetica', 'normal');

    let yPosition = 32;

    doc.text(`N° Cotización: ${quotationNumber}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Fecha: ${currentDate}`, margin, yPosition);
    yPosition += 5;
    doc.text(
      `Moneda: ${saleState.paymentCurrency === 'bs' ? 'Bolivianos (Bs)' : 'Pesos Argentinos (ARS)'}`,
      margin,
      yPosition
    );
  }

  /**
   * Agrega información del cliente
   */
  private static addClientInfo(
    doc: jsPDF,
    saleState: SaleState,
    _pageWidth: number,
    margin: number
  ): void {
    const clientName = saleState.clientName || 'Cliente General';
    
    doc.setFontSize(11);
    doc.setTextColor(this.COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', margin, 52);

    doc.setFont('helvetica', 'normal');
    doc.text(clientName, margin + 20, 52);

    if (saleState.nitClient) {
      doc.text(`NIT: ${saleState.nitClient}`, margin, 58);
    }

    if (saleState.socialReasonClient) {
      doc.text(`Razón Social: ${saleState.socialReasonClient}`, margin, 64);
    }
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
