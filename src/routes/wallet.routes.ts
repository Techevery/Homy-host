import { Router } from "express";
import { confirmPayout, getAllPayout } from "../controllers/wallet.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.get("/", authenticateAdmin, getAllPayout)
router.post("/confirm-payout", authenticateAdmin, confirmPayout)

export default router