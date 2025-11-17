import { Router } from "express";
import { authenticateAgent } from "../middlewares/Agent";
import { getAllPayout, payout } from "../controllers/wallet.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.post("/withdraw", authenticateAgent, payout)
router.get("/", authenticateAdmin, getAllPayout)

export default router