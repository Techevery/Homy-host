import { Router } from "express";
import { agentTransactions, confirmPayout, getAllPayout, getPayoutStatistics, rejectPayout } from "../controllers/wallet.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import { authenticateAgent } from "../middlewares/Agent";

const router = Router()

router.get("/", authenticateAdmin, getAllPayout)
router.post("/confirm-payout", authenticateAdmin, confirmPayout)
router.get("/agent-transactions", authenticateAgent, agentTransactions)
router.get("/payout-stats", authenticateAdmin, getPayoutStatistics)
router.get("/reject-payout", authenticateAdmin, rejectPayout)

export default router