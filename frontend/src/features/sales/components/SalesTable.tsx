import { useEffect, useState } from 'react';

export const SalesTable = () => {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        
      } catch (error) {
        console.error('Error al obtener las ventas:', error);
      }
    };

    fetchSales();
  }, []);

  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Ventas Realizadas</h2>

      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Producto</th>
            <th className="border border-gray-300 px-4 py-2">Cantidad</th>
            <th className="border border-gray-300 px-4 py-2">Precio</th>
            <th className="border border-gray-300 px-4 py-2">Cliente</th>
            <th className="border border-gray-300 px-4 py-2">Método de Pago</th>
            <th className="border border-gray-300 px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, index) => (
            <tr key={index}>
 {/*              <td className="border border-gray-300 px-4 py-2">{sale.items[0]?.medicationId || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.items[0]?.quantity || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.items[0]?.unitPrice || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.client}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.paymentMethod}</td>
              <td className="border border-gray-300 px-4 py-2">{sale.total}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};