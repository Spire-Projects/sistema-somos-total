import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { FileText } from 'lucide-react';

interface SaleNotesProps {
  notes?: string;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

const SaleNotes = memo(({ 
  notes = '', 
  onNotesChange,
  disabled = false 
}: SaleNotesProps) => {
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(e.target.value);
  };

  return (
    <Card className="!gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notas de Venta (opcional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="sale-notes" className="sr-only">
            Notas de la venta
          </Label>
          <Textarea
            id="sale-notes"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Agregar observaciones o comentarios sobre la venta..."
            disabled={disabled}
            className="min-h-[80px] text-sm"
            maxLength={500}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Observaciones opcionales sobre la venta</span>
            <span>{notes.length}/500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SaleNotes.displayName = 'SaleNotes';

export default SaleNotes;
