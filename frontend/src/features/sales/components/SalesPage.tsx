import { SalesForm } from '../components/SalesForm';
import { SalesTable } from './SalesTable.tsx';

export const SalesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Ventas</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesForm />
          <SalesTable />
        </div>
      </div>
    </div>
  );
};