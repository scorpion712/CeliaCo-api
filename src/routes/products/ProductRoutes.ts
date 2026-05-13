import { Router } from "express";

import { ProductsController } from "../../controllers";

const router = Router();

router.post("/", ProductsController.createProduct);
router.get("/", ProductsController.getProducts);
router.get("/all", ProductsController.getAllProducts);
router.get("/search", ProductsController.searchProducts);
router.get("/low-stock", ProductsController.getLowStockProducts);
router.get("/categories", ProductsController.getCategories);
router.get("/code/:code", ProductsController.getProductByCode);
router.get("/exists/code", ProductsController.codigoExists);
router.put("/:id", ProductsController.updateProduct);
router.patch("/:id/toggle-active", ProductsController.toggleActive);
router.patch("/:id/stock", ProductsController.updateStock);
router.patch("/:id", ProductsController.activateProduct);
router.delete("/:id", ProductsController.deleteProduct);

export default router;
