import { useCallback, useState } from 'react';
import type { SaleState } from '@/shared/types/modelTypes/Sale';
import { QuotationPdfService } from '../services/QuotationPdfService';
import { toast } from 'sonner';

interface UseQuotationPdfOptions {
  saleState: SaleState;
  quotationNumber?: string;
}

export const useQuotationPdf = ({ saleState, quotationNumber }: UseQuotationPdfOptions) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera el PDF y lo convierte a Blob para visualización
   */
  const generatePdf = useCallback(async (): Promise<Blob | null> => {
    setIsGenerating(true);
    try {
      const doc = QuotationPdfService.generateQuotationPdf({
        saleState,
        quotationNumber,
      });

      const blob = doc.output('blob');
      setPdfBlob(blob);
      return blob;
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar la cotización');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [saleState, quotationNumber]);

  /**
   * Descarga el PDF
   */
  const downloadPdf = useCallback(async () => {
    try {
      const doc = QuotationPdfService.generateQuotationPdf({
        saleState,
        quotationNumber,
      });

      const fileName = QuotationPdfService.generateFileName(saleState.clientName);
      doc.save(fileName);
      toast.success('Cotización descargada exitosamente');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar la cotización');
    }
  }, [saleState, quotationNumber]);

  /**
   * Imprime el PDF
   */
  const printPdf = useCallback(async () => {
    try {
      const blob = await generatePdf();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Limpiar la URL después de imprimir
          setTimeout(() => URL.revokeObjectURL(url), 100);
        };
      } else {
        toast.error('No se pudo abrir la ventana de impresión');
      }
    } catch (error) {
      console.error('Error imprimiendo PDF:', error);
      toast.error('Error al imprimir la cotización');
    }
  }, [generatePdf]);

  /**
   * Obtiene la URL del PDF para vista previa
   */
  const getPdfUrl = useCallback((): string | null => {
    if (!pdfBlob) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  return {
    generatePdf,
    downloadPdf,
    printPdf,
    getPdfUrl,
    isGenerating,
    pdfBlob,
  };
};
