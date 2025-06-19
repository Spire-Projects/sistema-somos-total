import { RequestHandler, Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  searchProducts,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Rutas para productos
router.get("/search", searchProducts as RequestHandler);
router.get("/", getAllProducts as RequestHandler);
router.get("/:id", getProductById as RequestHandler);
router.post("/", createProduct as RequestHandler);
router.put("/:id", updateProduct as RequestHandler);
router.delete("/:id", deleteProduct as RequestHandler);

export const productRoutes = router;
