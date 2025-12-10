import { Router } from "express";
import { agentPayoutById, agentTransactions, confirmPayout, getAllPayout, getPayoutStatistics, getSucessfulPayout, rejectPayout } from "../controllers/wallet.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import { authenticateAgent } from "../middlewares/Agent";

const router = Router()

router.get("/", getAllPayout)
router.post("/confirm-payout", authenticateAdmin, confirmPayout)
router.get("/agent-transactions", authenticateAgent, agentTransactions)
router.get("/payout-stats", authenticateAdmin, getPayoutStatistics)
router.patch("/reject-payout", authenticateAdmin, rejectPayout)
router.get("/agent/:payoutId", authenticateAgent, agentPayoutById) 
router.get("/successful-payout", authenticateAdmin, getSucessfulPayout)
 
export default router     