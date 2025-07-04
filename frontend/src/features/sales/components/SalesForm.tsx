import { useState } from 'react';

export const SalesForm = () => {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [client, setClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  const total = quantity * price;

  const handleSubmit = async () => {
    const saleData = { product, quantity, price, total, client, paymentMethod };
    try {
      /* await createSale(saleData); TDO FABIAN*/ 
      alert('Venta registrada exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error al registrar la venta:', error);
    }
  };

  const resetForm = () => {
    setProduct('');
    setQuantity(1);
    setPrice(0);
    setClient('');
    setPaymentMethod('efectivo');
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Nueva Venta</h2>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={product}
          onChange={e => setProduct(e.target.value)}
          className="border p-2 rounded-md w-full"
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="border p-2 rounded-md w-full"
          min={1}
        />

        <input
          type="number"
          placeholder="Precio unitario"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="border p-2 rounded-md w-full"
          min={0}
        />

        <input
          type="text"
          placeholder="Cliente (opcional)"
          value={client}
          onChange={e => setClient(e.target.value)}
          className="border p-2 rounded-md w-full"
        />

        <select
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value)}
          className="border p-2 rounded-md w-full"
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
      </div>

      <div className="text-right mb-4">
        <span className="font-bold text-lg text-green-700">Total: Bs. {total.toFixed(2)}</span>
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          onClick={handleSubmit}
        >
          FACTURAR
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          onClick={resetForm}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
};