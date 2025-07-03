import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, } from "html5-qrcode";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/shared/components/ui/input";

interface BarcodeScannerInputProps {
  label?: string;
  value: string;
  onChange: (barcode: string) => void;
  error?: string;
  placeholder?: string;
}

const BarcodeScannerInput = ({
  label = "Código de Barras (Opcional)",
  value,
  onChange,
  error,
  placeholder = "Ej: 7701234567890",
}: BarcodeScannerInputProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerId = "barcode-scanner"; // HTML element ID

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch (e) {
      console.warn("Error stopping scanner:", e);
    } finally {
      setScanning(false);
    }
  };

  const toggleScanner = useCallback(async () => {
    if (scanning) {
      await stopScanner();
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onChange(decodedText);
          toast.success("Código escaneado");
          stopScanner();
        },
        () => {
        }
      );

      setScanning(true);
    } catch (err) {
      console.error("No se pudo iniciar la cámara", err);
      toast.error("No se pudo acceder a la cámara");
    }
  }, [scanning, onChange]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={toggleScanner}
          variant={scanning ? "destructive" : "outline"}
        >
          {scanning ? "Detener" : "Escanear"}
        </Button>
      </div>

      {scanning && (
        <div
          id={scannerId}
          className="w-full h-[200px] mt-2 rounded-md border overflow-hidden"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default BarcodeScannerInput;
