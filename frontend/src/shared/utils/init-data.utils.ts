import { UserService } from '../services/UserService';
import type { CreateUserData } from '../db/models/user.model';
import type { CreateActiveIngredientData, CreateMedicationCategoryData, CreatePharmaceuticalFormData, CreateManufacturerData } from '../types/MedicationCrud';
import {
  createActiveIngredient,
  createMedicationCategory,
  createPharmaceuticalForm,
  createManufacturer
} from '../services';

// Ingredientes activos más comunes en farmacia
export const initialActiveIngredients: CreateActiveIngredientData[] = [
  // Analgésicos y antiinflamatorios
  { name: 'Paracetamol', aliases: ['Acetaminofén'], createdBy: 'system' },
  { name: 'Ibuprofeno', aliases: ['Ibuprofen'], createdBy: 'system' },
  { name: 'Ácido acetilsalicílico', aliases: ['Aspirina', 'ASA'], createdBy: 'system' },
  { name: 'Diclofenaco', aliases: ['Diclofenac'], createdBy: 'system' },
  { name: 'Naproxeno', aliases: ['Naproxen'], createdBy: 'system' },
  
  // Antibióticos
  { name: 'Amoxicilina', aliases: ['Amoxicillin'], createdBy: 'system' },
  { name: 'Azitromicina', aliases: ['Azithromycin'], createdBy: 'system' },
  { name: 'Ciprofloxacino', aliases: ['Ciprofloxacin'], createdBy: 'system' },
  { name: 'Ampicilina', aliases: ['Ampicillin'], createdBy: 'system' },
  { name: 'Cefalexina', aliases: ['Cephalexin'], createdBy: 'system' },
  
  // Antihistamínicos
  { name: 'Loratadina', aliases: ['Loratadine'], createdBy: 'system' },
  { name: 'Cetirizina', aliases: ['Cetirizine'], createdBy: 'system' },
  { name: 'Difenhidramina', aliases: ['Diphenhydramine'], createdBy: 'system' },
  
  // Antihipertensivos
  { name: 'Enalapril', aliases: [], createdBy: 'system' },
  { name: 'Losartán', aliases: ['Losartan'], createdBy: 'system' },
  { name: 'Amlodipino', aliases: ['Amlodipine'], createdBy: 'system' },
  { name: 'Metoprolol', aliases: [], createdBy: 'system' },
  
  // Antidiabéticos
  { name: 'Metformina', aliases: ['Metformin'], createdBy: 'system' },
  { name: 'Glibenclamida', aliases: ['Glyburide'], createdBy: 'system' },
  { name: 'Insulina', aliases: ['Insulin'], createdBy: 'system' },
  
  // Vitaminas y suplementos
  { name: 'Ácido ascórbico', aliases: ['Vitamina C'], createdBy: 'system' },
  { name: 'Colecalciferol', aliases: ['Vitamina D3'], createdBy: 'system' },
  { name: 'Ácido fólico', aliases: ['Folato'], createdBy: 'system' },
  { name: 'Complejo B', aliases: ['Vitaminas B'], createdBy: 'system' },
  
  // Otros comunes
  { name: 'Omeprazol', aliases: ['Omeprazole'], createdBy: 'system' },
  { name: 'Simvastatina', aliases: ['Simvastatin'], createdBy: 'system' },
  { name: 'Salbutamol', aliases: ['Albuterol'], createdBy: 'system' },
  { name: 'Dextrometorfano', aliases: ['Dextromethorphan'], createdBy: 'system' },
  { name: 'Hidroclorotiazida', aliases: ['HCTZ'], createdBy: 'system' },
  { name: 'Captopril', aliases: [], createdBy: 'system' }
];

// Categorías de medicamentos más comunes
export const initialMedicationCategories: CreateMedicationCategoryData[] = [
  {
    name: 'Analgésicos y Antiinflamatorios',
    description: 'Medicamentos para aliviar el dolor y reducir la inflamación',
    createdBy: 'system'
  },
  {
    name: 'Antibióticos',
    description: 'Medicamentos para tratar infecciones bacterianas',
    createdBy: 'system'
  },
  {
    name: 'Antihistamínicos',
    description: 'Medicamentos para tratar alergias y reacciones alérgicas',
    createdBy: 'system'
  },
  {
    name: 'Antihipertensivos',
    description: 'Medicamentos para controlar la presión arterial alta',
    createdBy: 'system'
  },
  {
    name: 'Antidiabéticos',
    description: 'Medicamentos para controlar los niveles de glucosa en sangre',
    createdBy: 'system'
  },
  {
    name: 'Vitaminas y Suplementos',
    description: 'Suplementos vitamínicos y nutricionales',
    createdBy: 'system'
  },
  {
    name: 'Gastrointestinales',
    description: 'Medicamentos para problemas del sistema digestivo',
    createdBy: 'system'
  },
  {
    name: 'Respiratorios',
    description: 'Medicamentos para problemas del sistema respiratorio',
    createdBy: 'system'
  },
  {
    name: 'Cardiovasculares',
    description: 'Medicamentos para el sistema cardiovascular',
    createdBy: 'system'
  },
  {
    name: 'Dermatológicos',
    description: 'Medicamentos para problemas de la piel',
    createdBy: 'system'
  },
  {
    name: 'Neurológicos',
    description: 'Medicamentos para el sistema nervioso',
    createdBy: 'system'
  },
  {
    name: 'Oftalmológicos',
    description: 'Medicamentos para problemas oculares',
    createdBy: 'system'
  },
  {
    name: 'Anticonceptivos',
    description: 'Medicamentos y dispositivos para control de natalidad',
    createdBy: 'system'
  },
  {
    name: 'Pediatría',
    description: 'Medicamentos específicos para niños',
    createdBy: 'system'
  },
  {
    name: 'Geriatría',
    description: 'Medicamentos específicos para adultos mayores',
    createdBy: 'system'
  }
];

// Formas farmacéuticas más comunes
export const initialPharmaceuticalForms: CreatePharmaceuticalFormData[] = [
  {
    name: 'Tableta',
    aliases: ['Comprimido', 'Pastilla'],
    description: 'Forma sólida para administración oral',
    createdBy: 'system'
  },
  {
    name: 'Cápsula',
    aliases: ['Cápsula dura', 'Cápsula blanda'],
    description: 'Forma sólida encapsulada para administración oral',
    createdBy: 'system'
  },
  {
    name: 'Jarabe',
    aliases: ['Solución oral', 'Suspensión oral'],
    description: 'Forma líquida dulce para administración oral',
    createdBy: 'system'
  },
  {
    name: 'Suspensión',
    aliases: ['Suspensión oral'],
    description: 'Preparación líquida con partículas en suspensión',
    createdBy: 'system'
  },
  {
    name: 'Inyección',
    aliases: ['Ampolla', 'Vial'],
    description: 'Forma estéril para administración parenteral',
    createdBy: 'system'
  },
  {
    name: 'Crema',
    aliases: ['Pomada'],
    description: 'Preparación semisólida para aplicación tópica',
    createdBy: 'system'
  },
  {
    name: 'Gel',
    aliases: ['Gel tópico'],
    description: 'Preparación semisólida transparente',
    createdBy: 'system'
  },
  {
    name: 'Gotas',
    aliases: ['Solución oftálmica', 'Gotas oftálmicas'],
    description: 'Forma líquida para aplicación en gotas',
    createdBy: 'system'
  },
  {
    name: 'Aerosol',
    aliases: ['Spray', 'Inhalador'],
    description: 'Forma de administración por inhalación',
    createdBy: 'system'
  },
  {
    name: 'Supositorio',
    aliases: ['Supositorio rectal', 'Óvulo vaginal'],
    description: 'Forma sólida para inserción en cavidades corporales',
    createdBy: 'system'
  },
  {
    name: 'Parche transdérmico',
    aliases: ['Parche', 'Sistema transdérmico'],
    description: 'Sistema de liberación controlada a través de la piel',
    createdBy: 'system'
  },
  {
    name: 'Polvo',
    aliases: ['Polvo para suspensión', 'Polvo oral'],
    description: 'Forma sólida finamente dividida',
    createdBy: 'system'
  },
  {
    name: 'Solución',
    aliases: ['Solución oral', 'Solución inyectable'],
    description: 'Preparación líquida homogénea',
    createdBy: 'system'
  },
  {
    name: 'Emulsión',
    aliases: ['Loción'],
    description: 'Preparación líquida de dos fases inmiscibles',
    createdBy: 'system'
  },
  {
    name: 'Ungüento',
    aliases: ['Pomada grasa'],
    description: 'Preparación semisólida grasa para uso tópico',
    createdBy: 'system'
  }
];

// Fabricantes/laboratorios comunes
export const initialManufacturers: CreateManufacturerData[] = [
  {
    name: 'Laboratorios Bago',
    country: 'Argentina',
    website: 'https://www.bago.com',
    createdBy: 'system'
  },
  {
    name: 'Genfar',
    country: 'Colombia',
    website: 'https://www.genfar.com',
    createdBy: 'system'
  },
  {
    name: 'Tecnoquímicas',
    country: 'Colombia',
    website: 'https://www.tecnoquimicas.com',
    createdBy: 'system'
  },
  {
    name: 'Pfizer',
    country: 'Estados Unidos',
    website: 'https://www.pfizer.com',
    createdBy: 'system'
  },
  {
    name: 'Novartis',
    country: 'Suiza',
    website: 'https://www.novartis.com',
    createdBy: 'system'
  },
  {
    name: 'Bayer',
    country: 'Alemania',
    website: 'https://www.bayer.com',
    createdBy: 'system'
  },
  {
    name: 'Roche',
    country: 'Suiza',
    website: 'https://www.roche.com',
    createdBy: 'system'
  },
  {
    name: 'Johnson & Johnson',
    country: 'Estados Unidos',
    website: 'https://www.jnj.com',
    createdBy: 'system'
  },
  {
    name: 'GSK (GlaxoSmithKline)',
    country: 'Reino Unido',
    website: 'https://www.gsk.com',
    createdBy: 'system'
  },
  {
    name: 'Sanofi',
    country: 'Francia',
    website: 'https://www.sanofi.com',
    createdBy: 'system'
  }
];

/**
 * Inicializa datos por defecto en el frontend
 * Crea un usuario administrador si no existe
 */
export const initializeDefaultData = async (): Promise<void> => {
  try {
    console.log('🔧 Verificando datos por defecto...');
    
    // Verificar si ya existen usuarios
    const existingUsers = await UserService.getAllUsers();
    
    if (existingUsers.success && existingUsers.users && existingUsers.users.length > 0) {
      console.log(`✅ Ya existen ${existingUsers.users.length} usuarios en la base de datos`);
      return;
    }
    
    console.log('🚀 Creando usuario administrador por defecto...');
    
    // Crear usuario administrador por defecto
    const adminUserData: CreateUserData = {
      fullName: 'Administrador del Sistema',
      email: 'admin@farmaapp.com',
      password: 'admin123',
      role: 'admin'
    };

    const result = await UserService.register(adminUserData);
    
    if (result.success) {
      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('📧 Email: admin@farmaapp.com');
      console.log('🔑 Contraseña: admin123');
      console.log('⚠️  IMPORTANTE: Cambia esta contraseña en producción!');
    } else {
      console.error('❌ Error creando usuario administrador:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar datos por defecto:', error);
    // No lanzar error para no romper la aplicación
  }
};

/**
 * Verifica si necesita ejecutar la inicialización
 * Solo se ejecuta una vez por sesión
 */
export const checkAndInitializeData = async (): Promise<void> => {
  const initKey = 'farmaapp_data_initialized';
  
  // Verificar si ya se inicializó en esta sesión
  if (sessionStorage.getItem(initKey)) {
    return;
  }
  
  // Inicializar usuarios primero
  await initializeDefaultData();
  
  // Luego inicializar datos básicos de medicamentos si no existen
  await initializeMedicationData();
  
  // Marcar como inicializado para esta sesión
  sessionStorage.setItem(initKey, 'true');
};

/**
 * Inicializar ingredientes activos en la base de datos
 */
export const initializeActiveIngredients = async (): Promise<void> => {
  try {
    console.log('🧪 Inicializando ingredientes activos...');
    let created = 0;
    let skipped = 0;

    for (const ingredient of initialActiveIngredients) {
      try {
        await createActiveIngredient(ingredient);
        created++;
        console.log(`✅ Creado: ${ingredient.name}`);
      } catch (error) {
        if ((error as Error).message.includes('already exists')) {
          skipped++;
          console.log(`⏭️  Ya existe: ${ingredient.name}`);
        } else {
          console.error(`❌ Error creando ${ingredient.name}:`, error);
        }
      }
    }

    console.log(`🧪 Ingredientes activos: ${created} creados, ${skipped} ya existían`);
  } catch (error) {
    console.error('❌ Error inicializando ingredientes activos:', error);
  }
};

/**
 * Inicializar categorías de medicamentos en la base de datos
 */
export const initializeMedicationCategories = async (): Promise<void> => {
  try {
    console.log('🏷️  Inicializando categorías de medicamentos...');
    let created = 0;
    let skipped = 0;

    for (const category of initialMedicationCategories) {
      try {
        await createMedicationCategory(category);
        created++;
        console.log(`✅ Creada: ${category.name}`);
      } catch (error) {
        if ((error as Error).message.includes('already exists')) {
          skipped++;
          console.log(`⏭️  Ya existe: ${category.name}`);
        } else {
          console.error(`❌ Error creando ${category.name}:`, error);
        }
      }
    }

    console.log(`🏷️  Categorías: ${created} creadas, ${skipped} ya existían`);
  } catch (error) {
    console.error('❌ Error inicializando categorías:', error);
  }
};

/**
 * Inicializar formas farmacéuticas en la base de datos
 */
export const initializePharmaceuticalForms = async (): Promise<void> => {
  try {
    console.log('💊 Inicializando formas farmacéuticas...');
    let created = 0;
    let skipped = 0;

    for (const form of initialPharmaceuticalForms) {
      try {
        await createPharmaceuticalForm(form);
        created++;
        console.log(`✅ Creada: ${form.name}`);
      } catch (error) {
        if ((error as Error).message.includes('already exists')) {
          skipped++;
          console.log(`⏭️  Ya existe: ${form.name}`);
        } else {
          console.error(`❌ Error creando ${form.name}:`, error);
        }
      }
    }

    console.log(`💊 Formas farmacéuticas: ${created} creadas, ${skipped} ya existían`);
  } catch (error) {
    console.error('❌ Error inicializando formas farmacéuticas:', error);
  }
};

/**
 * Inicializar fabricantes en la base de datos
 */
export const initializeManufacturers = async (): Promise<void> => {
  try {
    console.log('🏭 Inicializando fabricantes...');
    let created = 0;
    let skipped = 0;

    for (const manufacturer of initialManufacturers) {
      try {
        await createManufacturer(manufacturer);
        created++;
        console.log(`✅ Creado: ${manufacturer.name}`);
      } catch (error) {
        if ((error as Error).message.includes('already exists')) {
          skipped++;
          console.log(`⏭️  Ya existe: ${manufacturer.name}`);
        } else {
          console.error(`❌ Error creando ${manufacturer.name}:`, error);
        }
      }
    }

    console.log(`🏭 Fabricantes: ${created} creados, ${skipped} ya existían`);
  } catch (error) {
    console.error('❌ Error inicializando fabricantes:', error);
  }
};

/**
 * Inicializar todos los datos de medicamentos (ingredientes, categorías, formas, fabricantes)
 */
export const initializeMedicationData = async (): Promise<void> => {
  try {
    console.log('🚀 Iniciando carga de datos de medicamentos...');
    
    // Ejecutar en paralelo ya que no tienen dependencias entre sí
    await Promise.all([
      initializeActiveIngredients(),
      initializeMedicationCategories(),
      initializePharmaceuticalForms(),
      initializeManufacturers()
    ]);
    
    console.log('✅ Datos de medicamentos inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando datos de medicamentos:', error);
  }
};

/**
 * Inicializar todos los datos del sistema (usuarios + medicamentos)
 */
export const initializeAllData = async (): Promise<void> => {
  try {
    console.log('🔧 Inicializando todos los datos del sistema...');
    
    // Primero inicializar usuarios
    await initializeDefaultData();
    
    // Luego inicializar datos de medicamentos
    await initializeMedicationData();
    
    console.log('✅ Todos los datos del sistema inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando datos del sistema:', error);
  }
};
