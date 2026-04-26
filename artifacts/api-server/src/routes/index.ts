import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import settingsRouter from "./settings";
import ordersRouter from "./orders";
import storageRouter from "./storage";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(checkoutRouter);
router.use(ordersRouter);
router.use(storageRouter);
router.use(productsRouter);

export default router;
