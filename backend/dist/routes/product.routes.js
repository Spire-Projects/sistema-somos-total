import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProductById, searchProducts, updateProduct, } from "../controllers/product.controller.js";
const router = Router();
// Rutas para productos
router.get("/search", searchProducts);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
export const productRoutes = router;
