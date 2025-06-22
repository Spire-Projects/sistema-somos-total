import type { Medication } from '../types/Medication';

// Datos de muestra para medicamentos con lotes y stock
export const sampleMedications: Medication[] = [
  {
    id: 'MED-001',
    tradeName: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    activeIngredientIds: ['AI-001'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '500mg',
    presentation: 'Caja x 100 tabletas',
    manufacturerId: 'MF-001',
    categoryId: 'CAT-001',
    barcode: '7501234567890',
    batches: [
      {
        batchId: 'L001-2024',
        expirationDate: '2026-01-15',
        quantity: 86,
        purchasePrice: 12.50,
        sellingPrice: 18.00,
        purchaseDate: '2024-01-15',
        supplier: 'Laboratorio Farmacéutico A',
        createdAt: '2024-01-15T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 86,
    description: 'Analgésico y antipirético para alivio del dolor y la fiebre',
    indications: 'Dolor de cabeza, fiebre, dolor muscular',
    warnings: 'No exceder la dosis recomendada',
    sincronized: false,
    isDeleted: false,
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-002',
    tradeName: 'Amoxicilina 500mg',
    genericName: 'Amoxicilina',
    activeIngredientIds: ['AI-002'],
    pharmaceuticalFormId: 'PF-002',
    concentration: '500mg',
    presentation: 'Caja x 30 cápsulas',
    manufacturerId: 'MF-002',
    categoryId: 'CAT-002',
    barcode: '7501234567891',
    batches: [
      {
        batchId: 'A002-2024',
        expirationDate: '2025-09-10',
        quantity: 12,
        purchasePrice: 18.00,
        sellingPrice: 25.00,
        purchaseDate: '2023-09-10',
        supplier: 'Laboratorio Farmacéutico B',
        createdAt: '2023-09-10T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 12,
    description: 'Antibiótico de amplio espectro para infecciones bacterianas',
    indications: 'Infecciones respiratorias, urinarias, de piel',
    warnings: 'Completar el tratamiento aunque se sienta mejor',
    sincronized: true,
    isDeleted: false,
    createdAt: '2023-09-10T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-003',
    tradeName: 'Loratadina 10mg',
    genericName: 'Loratadina',
    activeIngredientIds: ['AI-003'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '10mg',
    presentation: 'Caja x 20 tabletas',
    manufacturerId: 'MF-003',
    categoryId: 'CAT-003',
    barcode: '7501234567892',
    batches: [
      {
        batchId: 'L003-2024',
        expirationDate: '2025-12-22',
        quantity: 45,
        purchasePrice: 15.00,
        sellingPrice: 22.00,
        purchaseDate: '2024-12-22',
        supplier: 'Distribuidora Médica C',
        createdAt: '2024-12-22T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 45,
    description: 'Antihistamínico para el tratamiento de alergias',
    indications: 'Rinitis alérgica, urticaria',
    warnings: 'Puede causar somnolencia en algunas personas',
    sincronized: false,
    isDeleted: false,
    createdAt: '2024-12-22T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-004',
    tradeName: 'Ibuprofeno 400mg',
    genericName: 'Ibuprofeno',
    activeIngredientIds: ['AI-004'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '400mg',
    presentation: 'Caja x 30 tabletas',
    manufacturerId: 'MF-004',
    categoryId: 'CAT-001',
    barcode: '7501234567893',
    batches: [
      {
        batchId: 'I004-2024',
        expirationDate: '2025-11-05',
        quantity: 38,
        purchasePrice: 14.00,
        sellingPrice: 20.00,
        purchaseDate: '2023-11-05',
        supplier: 'Importadora D',
        createdAt: '2023-11-05T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 38,
    description: 'Antiinflamatorio no esteroideo para dolor e inflamación',
    indications: 'Dolor muscular, artritis, fiebre',
    warnings: 'Tomar con alimentos para evitar molestias estomacales',
    sincronized: false,
    isDeleted: false,
    createdAt: '2023-11-05T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-005',
    tradeName: 'Losartán 50mg',
    genericName: 'Losartán',
    activeIngredientIds: ['AI-005'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '50mg',
    presentation: 'Caja x 30 tabletas',
    manufacturerId: 'MF-005',
    categoryId: 'CAT-004',
    barcode: '7501234567894',
    batches: [
      {
        batchId: 'LOS-2024',
        expirationDate: '2025-08-18',
        quantity: 5,
        purchasePrice: 15.00,
        sellingPrice: 22.00,
        purchaseDate: '2023-08-18',
        supplier: 'Farmacéutica E',
        createdAt: '2023-08-18T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 5,
    description: 'Antihipertensivo para el control de la presión arterial',
    indications: 'Hipertensión arterial',
    warnings: 'Controlar presión arterial regularmente',
    sincronized: true,
    isDeleted: false,
    createdAt: '2023-08-18T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-006',
    tradeName: 'Omeprazol 20mg',
    genericName: 'Omeprazol',
    activeIngredientIds: ['AI-006'],
    pharmaceuticalFormId: 'PF-002',
    concentration: '20mg',
    presentation: 'Caja x 28 cápsulas',
    manufacturerId: 'MF-001',
    categoryId: 'CAT-007',
    barcode: '7501234567895',
    batches: [
      {
        batchId: 'OME-2024',
        expirationDate: '2025-07-30',
        quantity: 18,
        purchasePrice: 16.50,
        sellingPrice: 24.00,
        purchaseDate: '2023-07-30',
        supplier: 'Laboratorio Farmacéutico A',
        createdAt: '2023-07-30T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 18,
    description: 'Inhibidor de la bomba de protones para problemas gástricos',
    indications: 'Gastritis, úlcera péptica, reflujo gastroesofágico',
    warnings: 'Tomar antes de las comidas',
    sincronized: true,
    isDeleted: false,
    createdAt: '2023-07-30T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-007',
    tradeName: 'Salbutamol 100mcg',
    genericName: 'Salbutamol',
    activeIngredientIds: ['AI-007'],
    pharmaceuticalFormId: 'PF-009',
    concentration: '100mcg/dosis',
    presentation: 'Inhalador x 200 dosis',
    manufacturerId: 'MF-006',
    categoryId: 'CAT-008',
    barcode: '7501234567896',
    batches: [
      {
        batchId: 'SAL-2024',
        expirationDate: '2025-10-12',
        quantity: 24,
        purchasePrice: 22.80,
        sellingPrice: 32.00,
        purchaseDate: '2023-10-12',
        supplier: 'Distribuidora Médica C',
        createdAt: '2023-10-12T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 24,
    description: 'Broncodilatador para problemas respiratorios',
    indications: 'Asma, broncoespasmo',
    warnings: 'No exceder 8 inhalaciones por día',
    sincronized: false,
    isDeleted: false,
    createdAt: '2023-10-12T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-008',
    tradeName: 'Vitamina D3 2000UI',
    genericName: 'Colecalciferol',
    activeIngredientIds: ['AI-008'],
    pharmaceuticalFormId: 'PF-002',
    concentration: '2000UI',
    presentation: 'Frasco x 60 cápsulas',
    manufacturerId: 'MF-007',
    categoryId: 'CAT-006',
    barcode: '7501234567897',
    batches: [
      {
        batchId: 'VD3-2024',
        expirationDate: '2026-03-25',
        quantity: 32,
        purchasePrice: 19.90,
        sellingPrice: 28.00,
        purchaseDate: '2024-03-25',
        supplier: 'Importadora D',
        createdAt: '2024-03-25T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 32,
    description: 'Suplemento vitamínico para deficiencia de vitamina D',
    indications: 'Deficiencia de vitamina D, osteoporosis',
    warnings: 'No exceder la dosis recomendada',
    sincronized: false,
    isDeleted: false,
    createdAt: '2024-03-25T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-009',
    tradeName: 'Atorvastatina 20mg',
    genericName: 'Atorvastatina',
    activeIngredientIds: ['AI-009'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '20mg',
    presentation: 'Caja x 30 tabletas',
    manufacturerId: 'MF-008',
    categoryId: 'CAT-009',
    barcode: '7501234567898',
    batches: [
      {
        batchId: 'ATO-2024',
        expirationDate: '2025-08-08',
        quantity: 8,
        purchasePrice: 24.50,
        sellingPrice: 35.00,
        purchaseDate: '2023-08-08',
        supplier: 'Farmacéutica E',
        createdAt: '2023-08-08T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 8,
    description: 'Estatina para el control del colesterol',
    indications: 'Hipercolesterolemia, prevención cardiovascular',
    warnings: 'Realizar controles hepáticos periódicos',
    sincronized: true,
    isDeleted: false,
    createdAt: '2023-08-08T10:00:00Z',
    createdBy: 'system'
  },
  {
    id: 'MED-010',
    tradeName: 'Alprazolam 0.5mg',
    genericName: 'Alprazolam',
    activeIngredientIds: ['AI-010'],
    pharmaceuticalFormId: 'PF-001',
    concentration: '0.5mg',
    presentation: 'Caja x 30 tabletas',
    manufacturerId: 'MF-009',
    categoryId: 'CAT-011',
    barcode: '7501234567899',
    batches: [
      {
        batchId: 'ALP-2024',
        expirationDate: '2025-09-15',
        quantity: 3,
        purchasePrice: 28.75,
        sellingPrice: 40.00,
        purchaseDate: '2023-09-15',
        supplier: 'Laboratorio Farmacéutico B',
        createdAt: '2023-09-15T10:00:00Z',
        createdBy: 'system'
      }
    ],
    totalStock: 3,
    description: 'Ansiolítico para el tratamiento de la ansiedad',
    indications: 'Trastornos de ansiedad, ataques de pánico',
    warnings: 'Medicamento controlado - No suspender bruscamente',
    sincronized: false,
    isDeleted: false,
    createdAt: '2023-09-15T10:00:00Z',
    createdBy: 'system'
  }
];

// Mapeo de categorías para filtros
export const categoryMap = {
  'CAT-001': 'Analgésicos',
  'CAT-002': 'Antibióticos', 
  'CAT-003': 'Antihistamínicos',
  'CAT-004': 'Cardiovasculares',
  'CAT-005': 'Antidiabéticos',
  'CAT-006': 'Vitaminas',
  'CAT-007': 'Gastrointestinales',
  'CAT-008': 'Respiratorios',
  'CAT-009': 'Cardiovasculares',
  'CAT-010': 'Dermatológicos',
  'CAT-011': 'Ansiolíticos'
};

// Estados de stock para mostrar badges
export const getStockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Sin Stock', variant: 'destructive' as const };
  if (stock <= 10) return { label: 'Stock Bajo', variant: 'secondary' as const };
  if (stock <= 30) return { label: 'Stock Crítico', variant: 'outline' as const };
  return { label: 'Normal', variant: 'default' as const };
};

// Función para obtener icono de medicamento según categoría
export const getMedicationIcon = (categoryId: string) => {
  const icons: Record<string, string> = {
    'CAT-001': '💊', // Analgésicos
    'CAT-002': '🦠', // Antibióticos
    'CAT-003': '🤧', // Antihistamínicos
    'CAT-004': '❤️', // Cardiovasculares
    'CAT-005': '🩺', // Antidiabéticos
    'CAT-006': '⭐', // Vitaminas
    'CAT-007': '🍃', // Gastrointestinales
    'CAT-008': '🫁', // Respiratorios
    'CAT-009': '❤️', // Cardiovasculares
    'CAT-010': '🌿', // Dermatológicos
    'CAT-011': '🧠'  // Ansiolíticos
  };
  return icons[categoryId] || '💊';
};
