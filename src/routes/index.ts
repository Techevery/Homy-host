import { Router } from "express";
import AuthRoutes from "./auth.routes";
import AdminRoutes from "./admin.routes"
import AgentRoutes from "./agent.routes"
import PaymentRoutes from "./payment.routes";
// import AgentRoutes from "./agent.routes";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/admin", AdminRoutes);
router.use("/agent",AgentRoutes);
router.use("/payment", PaymentRoutes);

export default router;