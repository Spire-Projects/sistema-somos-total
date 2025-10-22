import { useEffect, useState } from 'react';
import { getSalesRepository } from '../db/repositories/sales.repository';
import { getProductRepository } from '../db/repositories/product.repository';
import { getPurchaseRepository } from '../db/repositories/purchase.repository';
import type { Sale } from '../types/modelTypes/Sale';
import type { Product } from '../types/modelTypes/Product';
import type { Purchase } from '../types/modelTypes/PurchaseBox';

/**
 * Hook para obtener ventas en tiempo real (similar a snapshot de Firebase)
 * Se actualiza automáticamente cada vez que cambia la colección
 * 
 * @example
 * ```tsx
 * const sales = useLiveSales();
 * 
 * return (
 *   <div>
 *     {sales.map(sale => <div key={sale.id}>{sale.productCode}</div>)}
 *   </div>
 * );
 * ```
 */
export function useLiveSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getSalesRepository();
    
    const subscription = repository.findAllLive$().subscribe({
      next: (data) => {
        setSales(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    // Cleanup: desuscribirse al desmontar
    return () => subscription.unsubscribe();
  }, []);

  return { sales, loading, error };
}

/**
 * Hook para obtener ventas paginadas en tiempo real
 * 
 * @example
 * ```tsx
 * const { sales, loading } = useLiveSalesPaginated(1, 20, searchQuery);
 * ```
 */
export function useLiveSalesPaginated(page: number, size: number, searchQuery?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getSalesRepository();
    
    const subscription = repository.findAllPaginatedLive$(page, size, searchQuery).subscribe({
      next: (data) => {
        setSales(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [page, size, searchQuery]);

  return { sales, loading, error };
}

/**
 * Hook para obtener productos en tiempo real
 * 
 * @example
 * ```tsx
 * const { products, loading } = useLiveProducts();
 * ```
 */
export function useLiveProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getProductRepository();
    
    const subscription = repository.findAllLive$().subscribe({
      next: (data) => {
        setProducts(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { products, loading, error };
}

/**
 * Hook para obtener productos paginados en tiempo real
 */
export function useLiveProductsPaginated(page: number, size: number, searchQuery?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getProductRepository();
    
    const subscription = repository.findAllPaginatedLive$(page, size, searchQuery).subscribe({
      next: (data) => {
        setProducts(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [page, size, searchQuery]);

  return { products, loading, error };
}

/**
 * Hook para obtener un producto específico en tiempo real
 * Se actualiza automáticamente si el producto cambia
 * 
 * @example
 * ```tsx
 * const { product, loading } = useLiveProduct('PROD-001');
 * 
 * if (product) {
 *   return <div>Stock actual: {product.stock}</div>
 * }
 * ```
 */
export function useLiveProduct(code: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getProductRepository();
    
    const subscription = repository.findByCodeLive$(code).subscribe({
      next: (data) => {
        setProduct(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [code]);

  return { product, loading, error };
}

/**
 * Hook para obtener compras en tiempo real
 */
export function useLivePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getPurchaseRepository();
    
    const subscription = repository.findAllLive$().subscribe({
      next: (data) => {
        setPurchases(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { purchases, loading, error };
}

/**
 * Hook para obtener compras paginadas en tiempo real
 */
export function useLivePurchasesPaginated(page: number, size: number, searchQuery?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const repository = getPurchaseRepository();
    
    const subscription = repository.findAllPaginatedLive$(page, size, searchQuery).subscribe({
      next: (data) => {
        setPurchases(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [page, size, searchQuery]);

  return { purchases, loading, error };
}
