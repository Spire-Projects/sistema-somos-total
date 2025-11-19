import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { UserService } from "@/shared/services/UserService";

const LOADING_TEXTS = [
  "Ya casi terminamos...",
  "Abriendo la ferretería...",
  "Preparando herramientas...",
  "Cargando sistema...",
  "Listo para vender!"
];

const CLEANING_TEXTS = [
  "Limpiando instalación...",
  "Revisando archivos...",
  "Restaurando sistema...",
  "Verificando conexión..."
];

type Phase = 'loading' | 'cleaning' | 'error' | 'done';

export default function FirstLoadingModal() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [retryCount, setRetryCount] = useState(0);

  // Mostrar solo una vez
  useEffect(() => {
    const shown = localStorage.getItem("firstLoadingModalShownss");
    if (!shown) {
      setOpen(true);
      localStorage.setItem("firstLoadingModalShownss", "true");
    }
  }, []);

  // Fase de carga inicial
  useEffect(() => {
    if (!open || phase !== 'loading') return;

    let interval: NodeJS.Timeout;
    let textInterval: NodeJS.Timeout;
    let elapsed = 0;

    setProgress(0);
    setTextIndex(0);

    interval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(100, (elapsed / 8000) * 100));

      if (elapsed >= 8000) {
        clearInterval(interval);
        clearInterval(textInterval);

        // Verificar usuarios
        UserService.getAllUsers()
          .then((res) => {
            if (res.success && res.users && res.users.length > 0) {
              setPhase('done');
              setOpen(false);
            } else {
              setPhase('cleaning');
            }
          })
          .catch(() => {
            setPhase('cleaning');
          });
      }
    }, 100);

    textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [open, phase, retryCount]);

  // Fase de limpieza
  useEffect(() => {
    if (!open || phase !== 'cleaning') return;

    let interval: NodeJS.Timeout;
    let textInterval: NodeJS.Timeout;
    let elapsed = 0;

    setProgress(0);
    setTextIndex(0);

    interval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min(100, (elapsed / 8000) * 100));

      if (elapsed >= 8000) {
        clearInterval(interval);
        clearInterval(textInterval);

        // Verificar usuarios otra vez
        UserService.getAllUsers()
          .then((res) => {
            if (res.success && res.users && res.users.length > 0) {
              setPhase('done');
              setOpen(false);
            } else {
              setPhase('error');
            }
          })
          .catch(() => {
            setPhase('error');
          });
      }
    }, 100);

    textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % CLEANING_TEXTS.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [open, phase, retryCount]);

  // Reintentar
  const handleRetry = () => {
    setPhase('loading');
    setRetryCount((prev) => prev + 1);
    setOpen(true);
  };

  if (!open) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="flex flex-col items-center gap-6 py-8">
        {phase === 'loading' && (
          <>
            <div className="text-2xl font-bold">Terminando instalación</div>
            <div className="text-lg font-semibold text-center animate-pulse min-h-8">
              {LOADING_TEXTS[textIndex]}
            </div>
            <Progress value={progress} className="w-full h-3" />
          </>
        )}

        {phase === 'cleaning' && (
          <>
            <div className="text-2xl font-bold">Verificando sistema</div>
            <div className="text-lg font-semibold text-center animate-pulse min-h-8">
              {CLEANING_TEXTS[textIndex]}
            </div>
            <Progress value={progress} className="w-full h-3" />
          </>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-lg font-semibold text-center text-red-600">
              Hubo un error con la instalación.
              <br />
              Por favor revise su conexión a internet.
            </div>
            <Button onClick={handleRetry} className="w-full">
              Reintentar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
