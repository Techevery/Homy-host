import { Router } from "express";
import AuthRoutes from "./auth.routes";
import AdminRoutes from "./admin.routes"
import AgentRoutes from "./agent.routes"
import PaymentRoutes from "./payment.routes";
import BookingRoutes from "./booking.route"
import BannerRoutes from "./banner.route"
import WalletRoutes from "./wallet.routes"
// import AgentRoutes from "./agent.routes";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/admin", AdminRoutes);
router.use("/agent",AgentRoutes);
router.use("/payment", PaymentRoutes)
router.use("/booking", BookingRoutes);
router.use("/banner", BannerRoutes)
router.use("/wallet", WalletRoutes)

export default router;