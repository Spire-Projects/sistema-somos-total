import { useEffect, useState } from "react";
import {
  createDailyCashClosure,
  getDailyCashClosuresPaginated,
} from "@/shared/services/DailyCashClosureService";
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
import { bolivianDenominations } from "@/shared/utils/dailyCash.utils";
import { Label } from "@/shared/components/ui/label";
import { useAppSelector } from "@/shared/store/hooks";

export const DailyCashClosuresPage = () => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DailyCashClosure[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [breakdown, setBreakdown] = useState<CashBreakdown[]>(
    bolivianDenominations.map((d) => ({ denomination: d, quantity: 0 }))
  );
  const [qrIncome, setQrIncome] = useState(0);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const totalCash = breakdown.reduce(
    (sum, item) => sum + item.quantity * item.denomination.value,
    0
  );
  const total = totalCash + qrIncome;

  const loadClosures = async () => {
    setLoading(true);
    const res = await getDailyCashClosuresPaginated(page, 10);
    setItems(res.items);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  const handleQuantityChange = (i: number, value: number) => {
    const updated = [...breakdown];
    updated[i].quantity = value;
    setBreakdown(updated);
  };

  const handleCreate = async () => {
    await createDailyCashClosure({
      userId,
      date,
      openingAmount: 0,
      closingAmount: total,
      notes: `QR: ${qrIncome}, Efectivo: ${totalCash}`,
    });

    // reset
    setBreakdown(
      bolivianDenominations.map((d) => ({ denomination: d, quantity: 0 }))
    );
    setQrIncome(0);
    setUserId("");
    setDate("");
    loadClosures();
  };

  useEffect(() => {
    loadClosures();
  }, [page]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Nuevo Arqueo de Caja Diario</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Usuario</Label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Usuario"
          />
        </div>

        <div className="space-y-2">
          <Label>Fecha</Label>
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
            value={qrIncome}
            onChange={(e) => setQrIncome(Number(e.target.value))}
            placeholder="Monto por QR"
          />
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
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(i, Number(e.target.value))
                    }
                  />
                </TableCell>
                <TableCell>
                  Bs {(item.quantity * item.denomination.value).toFixed(2)}
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
          Total QR: <strong>Bs {qrIncome.toFixed(2)}</strong>
        </p>
        <p className="text-lg">
          Total cierre: <strong>Bs {total.toFixed(2)}</strong>
        </p>
        <Button onClick={handleCreate} className="mt-2">
          Guardar Arqueo
        </Button>
      </div>

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
                <TableCell>{item.userId}</TableCell>
                <TableCell>Bs {item.closingAmount.toFixed(2)}</TableCell>
                <TableCell>{item.notes || "-"}</TableCell>
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
