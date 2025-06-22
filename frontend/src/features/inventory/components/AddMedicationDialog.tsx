import { useState, useEffect } from 'react';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Checkbox } from '../../../shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Plus, X } from 'lucide-react';
import {
  createMedication,
  addMedicationBatch,
  findAllMedicationCategories,
  findAllPharmaceuticalForms,
  findAllManufacturers,
  findAllActiveIngredients,
} from '../../../shared/services';
import type { 
  MedicationCategory, 
  PharmaceuticalFormDoc, 
  Manufacturer, 
  ActiveIngredient 
} from '../../../shared/types/Medication';
import type { CreateMedicationData, CreateMedicationBatchData } from '../../../shared/types/MedicationCrud';

interface AddMedicationDialogProps {
  onMedicationAdded?: () => void;
}

interface MedicationFormData {
  tradeName: string;
  genericName: string;
  categoryId: string;
  pharmaceuticalFormId: string;
  concentration: string;
  presentation: string;
  manufacturerId: string;
  barcode: string;
  description: string;
  indications: string;
  warnings: string;
  activeIngredientIds: string[];
  // Batch data
  batchId: string;
  expirationDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  storageLocation: string;
  requiresPrescription: boolean;
}

export const AddMedicationDialog = ({ onMedicationAdded }: AddMedicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MedicationCategory[]>([]);
  const [pharmaceuticalForms, setPharmaceuticalForms] = useState<PharmaceuticalFormDoc[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([]);
  
  const [formData, setFormData] = useState<MedicationFormData>({
    tradeName: '',
    genericName: '',
    categoryId: '',
    pharmaceuticalFormId: '',
    concentration: '',
    presentation: '',
    manufacturerId: '',
    barcode: '',
    description: '',
    indications: '',
    warnings: '',
    activeIngredientIds: [],
    batchId: '',
    expirationDate: '',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    supplier: '',
    storageLocation: '',
    requiresPrescription: false,
  });

  // Cargar datos de catálogos
  useEffect(() => {
    if (open) {
      loadCatalogs();
    }
  }, [open]);

  const loadCatalogs = async () => {
    try {
      const [categoriesRes, formsRes, manufacturersRes, ingredientsRes] = await Promise.all([
        findAllMedicationCategories(),
        findAllPharmaceuticalForms(),
        findAllManufacturers(),
        findAllActiveIngredients(),
      ]);
      
      setCategories(categoriesRes);
      setPharmaceuticalForms(formsRes);
      setManufacturers(manufacturersRes);
      setActiveIngredients(ingredientsRes);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const handleInputChange = (field: keyof MedicationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActiveIngredientToggle = (ingredientId: string) => {
    setFormData(prev => ({
      ...prev,
      activeIngredientIds: prev.activeIngredientIds.includes(ingredientId)
        ? prev.activeIngredientIds.filter(id => id !== ingredientId)
        : [...prev.activeIngredientIds, ingredientId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear el objeto de medicamento con el tipo correcto
      const medicationData: CreateMedicationData = {
        tradeName: formData.tradeName,
        genericName: formData.genericName,
        activeIngredientIds: formData.activeIngredientIds,
        pharmaceuticalFormId: formData.pharmaceuticalFormId,
        concentration: formData.concentration,
        presentation: formData.presentation,
        manufacturerId: formData.manufacturerId,
        categoryId: formData.categoryId,
        barcode: formData.barcode,
        description: formData.description,
        indications: formData.indications,
        warnings: formData.warnings,
        createdBy: 'current-user'
      };

      // Crear el medicamento
      const newMedication = await createMedication(medicationData);

      // Crear el lote inicial si se proporcionaron datos del lote
      if (formData.batchId && formData.expirationDate && formData.quantity > 0) {
        const batchData: CreateMedicationBatchData = {
          batchId: formData.batchId,
          expirationDate: formData.expirationDate,
          quantity: formData.quantity,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          purchaseDate: new Date().toISOString(),
          supplier: formData.supplier || 'Sin especificar',
          createdBy: 'current-user'
        };

        await addMedicationBatch(newMedication.id, batchData);
      }
      
      // Resetear formulario
      setFormData({
        tradeName: '',
        genericName: '',
        categoryId: '',
        pharmaceuticalFormId: '',
        concentration: '',
        presentation: '',
        manufacturerId: '',
        barcode: '',
        description: '',
        indications: '',
        warnings: '',
        activeIngredientIds: [],
        batchId: '',
        expirationDate: '',
        quantity: 0,
        purchasePrice: 0,
        sellingPrice: 0,
        supplier: '',
        storageLocation: '',
        requiresPrescription: false,
      });

      setOpen(false);
      onMedicationAdded?.();
    } catch (error) {
      console.error('Error creating medication:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Nuevo Producto
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Código</label>
              <Input
                placeholder="Código del producto"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre del Producto</label>
              <Input
                placeholder="Nombre del producto"
                value={formData.tradeName}
                onChange={(e) => handleInputChange('tradeName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoría</label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Presentación</label>
              <Input
                placeholder="Ej: Tabletas - Caja x 30"
                value={formData.presentation}
                onChange={(e) => handleInputChange('presentation', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Stock y precios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Stock Inicial</label>
              <Input
                type="number"
                placeholder="Cantidad"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Precio de Compra ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Precio de Venta ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.sellingPrice || ''}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lote</label>
              <Input
                placeholder="Número de lote"
                value={formData.batchId}
                onChange={(e) => handleInputChange('batchId', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Proveedor y formulario farmacéutico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Proveedor</label>
              <Select value={formData.manufacturerId} onValueChange={(value) => handleInputChange('manufacturerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Forma Farmacéutica</label>
              <Select value={formData.pharmaceuticalFormId} onValueChange={(value) => handleInputChange('pharmaceuticalFormId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma" />
                </SelectTrigger>
                <SelectContent>
                  {pharmaceuticalForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Principios activos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Principios Activos</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {activeIngredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={ingredient.id}
                    checked={formData.activeIngredientIds.includes(ingredient.id)}
                    onCheckedChange={() => handleActiveIngredientToggle(ingredient.id)}
                  />
                  <label
                    htmlFor={ingredient.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {ingredient.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Campos adicionales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre genérico</label>
              <Input
                placeholder="Nombre genérico"
                value={formData.genericName}
                onChange={(e) => handleInputChange('genericName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Concentración</label>
              <Input
                placeholder="Ej: 500mg"
                value={formData.concentration}
                onChange={(e) => handleInputChange('concentration', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ubicación en Almacén</label>
            <Input
              placeholder="Ej: Estante A, Nivel 2"
              value={formData.storageLocation}
              onChange={(e) => handleInputChange('storageLocation', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <Textarea
              placeholder="Descripción del producto"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Checkbox para receta médica */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prescription"
              checked={formData.requiresPrescription}
              onCheckedChange={(checked) => handleInputChange('requiresPrescription', checked)}
            />
            <label
              htmlFor="prescription"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Requiere receta médica
            </label>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
