import { useEffect, useState, useRef } from "react";
import {
  createDailyCashClosure,
  getDailyCashClosuresPaginated,
} from "@/shared/services/DailyCashClosureService";
import { findSalesByDateRange } from "@/shared/services/SalesService";
import { UserService } from "@/shared/services/UserService";
import type {
  CashBreakdown,
  DailyCashClosure,
} from "@/shared/types/DailyCashClosure";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { bolivianDenominations } from "@/shared/utils/dailyCash.utils";
import { Label } from "@/shared/components/ui/label";
import { useAppSelector } from "@/shared/store/hooks";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export const DailyCashClosuresPage = () => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DailyCashClosure[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [breakdown, setBreakdown] = useState<CashBreakdown[]>(
    bolivianDenominations.map((d) => ({ denomination: d, quantity: 0 }))
  );
  // Mantener cantidades como strings para permitir campos vacíos ('' cuenta como 0)
  const [quantities, setQuantities] = useState<string[]>(
    breakdown.map((b) => String(b.quantity ?? 0))
  );
  const [qrIncomeStr, setQrIncomeStr] = useState<string>('0');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
  const [loading, setLoading] = useState(false);
  const [salesTotal, setSalesTotal] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});

  const { user } = useAppSelector((state) => state.auth);

  // Estado para controlar si ya se editó algo y si está evaluando (debounce)
  const [hasEdited, setHasEdited] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const evalTimerRef = useRef<number | null>(null);

  // Parsear valores ('' o no numérico => 0)
  const parsedQrIncome = Number(qrIncomeStr) || 0;
  const totalCash = quantities.reduce((sum, q, i) => {
    const qty = Number(q) || 0;
    return sum + qty * breakdown[i].denomination.value;
  }, 0);
  const total = totalCash + parsedQrIncome;

  // Verificar si el arqueo es correcto (con tolerancia de 1 boliviano)
  const isArcheoCorrect = Math.abs(total - salesTotal) <= 1;

  // Calcular diferencia
  const difference = total - salesTotal;

  // Cargar ventas del día seleccionado
  const loadSalesData = async () => {
    if (!date) return;

    try {
      const dateFrom = `${date}T00:00:00.000Z`;
      const dateTo = `${date}T23:59:59.999Z`;

      const sales = await findSalesByDateRange(dateFrom, dateTo);

      const total = sales.reduce((sum, sale) => sum + sale.total, 0);
      setSalesTotal(total);
    } catch (error) {
      console.error('Error loading sales data:', error);
      setSalesTotal(0);
    }
  };

  // Cargar nombre de usuario
  const loadUserName = async (userId: string) => {
    if (userNames[userId]) return userNames[userId];

    try {
      const response = await UserService.getUserById(userId);
      if (response.success && response.user) {
        const name = response.user.fullName || response.user.email || userId;
        setUserNames((prev) => ({ ...prev, [userId]: name }));
        return name;
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }

    return userId;
  };

  const loadClosures = async () => {
    setLoading(true);
    const res = await getDailyCashClosuresPaginated(page, 10);
    setItems(res.items);
    setTotalPages(res.totalPages);

    // Cargar nombres de usuarios para cada cierre
    for (const item of res.items) {
      await loadUserName(item.userId);
    }

    setLoading(false);
  };

  // Manejo de cambios en cantidad: permitimos string vacío; debounce para evaluación visual
  const handleQuantityChange = (i: number, value: string) => {
    const updated = [...quantities];
    updated[i] = value;
    setQuantities(updated);

    // marcar edición y activar evaluación con debounce 1s
    setHasEdited(true);
    setIsEvaluating(true);
    if (evalTimerRef.current) {
      window.clearTimeout(evalTimerRef.current);
    }
    evalTimerRef.current = window.setTimeout(() => {
      setIsEvaluating(false);
      evalTimerRef.current = null;
    }, 1000);
  };

  // QR input handler (string to allow empty)
  const handleQrChange = (value: string) => {
    setQrIncomeStr(value);

    setHasEdited(true);
    setIsEvaluating(true);
    if (evalTimerRef.current) {
      window.clearTimeout(evalTimerRef.current);
    }
    evalTimerRef.current = window.setTimeout(() => {
      setIsEvaluating(false);
      evalTimerRef.current = null;
    }, 1000);
  };

  const handleCreate = async () => {
    if (!user) {
      alert('Usuario no autenticado');
      return;
    }

    // Si el arqueo no es correcto, mostrar dialog de confirmación
    // Nota: el botón sigue usando la evaluación instantánea (sin debounce) para guardado
    const currentTotal = quantities.reduce((sum, q, i) => sum + (Number(q) || 0) * breakdown[i].denomination.value, 0) + (Number(qrIncomeStr) || 0);
    const currentlyCorrect = Math.abs(currentTotal - salesTotal) <= 1;

    if (!currentlyCorrect) {
      setShowConfirmDialog(true);
      return;
    }

    await saveArcheo();
  };

  const saveArcheo = async () => {
    if (!user) return;

    await createDailyCashClosure({
      userId: user.id,
      date,
      openingAmount: 0,
      closingAmount: total,
      notes: `QR: ${parsedQrIncome}, Efectivo: ${totalCash}}`,
    });

    // reset
    setQuantities(bolivianDenominations.map(() => '0'));
    setBreakdown(bolivianDenominations.map((d) => ({ denomination: d, quantity: 0 })));
    setQrIncomeStr('0');
    setShowConfirmDialog(false);
    setHasEdited(false);
    setIsEvaluating(false);
    loadClosures();
  };

  useEffect(() => {
    loadClosures();
  }, [page]);

  useEffect(() => {
    loadSalesData();
  }, [date]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Nuevo Arqueo de Caja Diario</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Usuario (Actual)</Label>
          <Input
            value={user?.fullName || user?.email || 'No autenticado'}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha de Ventas</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Monto por QR</Label>
          <Input
            type="number"
            value={qrIncomeStr}
            onChange={(e) => handleQrChange(e.target.value)}
            placeholder="Monto por QR"
          />
        </div>
      </div>

      {/* Indicador de Estado del Arqueo */}
      <div className={`p-4 rounded-lg border-2 ${
        (!hasEdited || isEvaluating)
          ? 'bg-amber-50 border-amber-200'
          : isArcheoCorrect
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          {(!hasEdited || isEvaluating) ? (
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          ) : isArcheoCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h3 className={`font-semibold ${
              (!hasEdited || isEvaluating) ? 'text-amber-800' : (isArcheoCorrect ? 'text-green-800' : 'text-red-800')
            }`}>
              {(!hasEdited || isEvaluating) ? 'En revisión...(Inserte monto por QR o efectivo para continuar con la revisión)' : (isArcheoCorrect ? 'Arqueo Correcto' : 'Arqueo Incorrecto')}
            </h3>
            <p className={`text-sm ${
              (!hasEdited || isEvaluating) ? 'text-amber-600' : (isArcheoCorrect ? 'text-green-600' : 'text-red-600')
            }`}>
              Ventas del día: Bs {salesTotal.toFixed(2)} | 
              Total arqueo: Bs {total.toFixed(2)} | 
              Diferencia: Bs {difference.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mt-4 mb-2">Detalle de Efectivo</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Denominación</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((item, i) => (
              <TableRow key={item.denomination.label}>
                <TableCell>{item.denomination.label}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={quantities[i]}
                    onChange={(e) => handleQuantityChange(i, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  Bs {((Number(quantities[i]) || 0) * item.denomination.value).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-right space-y-2">
        <p>
          Total efectivo: <strong>Bs {totalCash.toFixed(2)}</strong>
        </p>
        <p>
          Total QR: <strong>Bs {parsedQrIncome.toFixed(2)}</strong>
        </p>
        <p className="text-lg">
          Total cierre: <strong>Bs {total.toFixed(2)}</strong>
        </p>
        <p className="text-lg font-semibold">
          Ventas del día: <strong>Bs {salesTotal.toFixed(2)}</strong>
        </p>
        <Button 
          onClick={handleCreate} 
          className={`mt-2 ${
            isArcheoCorrect 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isArcheoCorrect ? 'Guardar Arqueo' : 'Guardar con Diferencia'}
        </Button>
      </div>

      {/* Dialog de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Arqueo Incorrecto
            </AlertDialogTitle>
            <AlertDialogDescription>
              El arqueo actual no coincide con las ventas del día. 
              Hay una diferencia de <strong>Bs {Math.abs(difference).toFixed(2)}</strong> 
              {difference > 0 ? ' de más' : ' de menos'}.
              
              <div className="mt-3 space-y-1">
                <p>• Total ventas del día: Bs {salesTotal.toFixed(2)}</p>
                <p>• Total arqueo: Bs {total.toFixed(2)}</p>
                <p>• Diferencia: Bs {difference.toFixed(2)}</p>
              </div>
              
              ¿Desea guardar el arqueo de todas maneras?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={saveArcheo}
              className="bg-red-600 hover:bg-red-700"
            >
              Guardar de todas maneras
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h3 className="text-xl mt-8 font-semibold">Historial</h3>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{userNames[item.userId] || item.userId}</TableCell>
                <TableCell>Bs {item.closingAmount.toFixed(2)}</TableCell>
                <TableCell className="max-w-xs truncate">{item.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(page - 1, 1))}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={i + 1 === page}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(page + 1, totalPages))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
