import { UserService } from "../services/UserService";
import type { CreateUserData } from "../db/models/user.model";
import { currencyService } from "../services/CurrencyService";

/**
 * Inicializa datos por defecto en el frontend
 * Crea un usuario administrador si no existe
 */
export const initializeDefaultData = async (): Promise<void> => {
  try {
    console.log("🔧 Verificando datos por defecto...");
    const argCurrency = await currencyService.getAllView(1, 10, "ARG");
    if (argCurrency.totalItems === 0) {
      console.log("🚀 Creando moneda ARG por defecto...");
      const newCurrency = await currencyService.create({
        simbol: "ARG",
        equivalenceToBs: 0,
        createdBy: "system",
      });
      if (newCurrency) {
        console.log("✅ Moneda ARG creada con éxito:", newCurrency);
      }
    } else {
      console.log("✅ Moneda ARG ya existe en la base de datos");
    }
    // Verificar si ya existen usuarios
    const existingUsers = await UserService.getAllUsers();

    if (
      existingUsers.success &&
      existingUsers.users &&
      existingUsers.users.length > 0
    ) {
      console.log(
        `✅ Ya existen ${existingUsers.users.length} usuarios en la base de datos`
      );
      return;
    }

    console.log("🚀 Creando usuario administrador por defecto...");

    // Crear usuario administrador por defecto
    const adminUserData: CreateUserData = {
      fullName: "Administrador del Sistema",
      email: "administrador@somostotal.com",
      password: "admin123",
      role: "admin",
    };

    const result = await UserService.register(adminUserData);
    if (result.success) {
      console.log("✅ Usuario administrador creado con éxito:", result.user);
    }

    //Create arg currency if not exists
  } catch (error) {
    console.error("❌ Error al inicializar datos por defecto:", error);
  }
};

export const checkAndInitializeData = async (): Promise<void> => {
  const initKey = "somosTotalDataInitialized";

  await initializeDefaultData();
  sessionStorage.setItem(initKey, "true");
};
