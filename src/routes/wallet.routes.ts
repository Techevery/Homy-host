import { Router } from "express";
import { agentPayout, agentPayoutById, agentTransactions, approveCharges, confirmPayout, createCharges, getPayoutRequest, getPayoutStatistics, getSucessfulPayout, rejectPayout } from "../controllers/wallet.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import { authenticateAgent } from "../middlewares/Agent";
import { restrictTo, Role } from "../middlewares/roles";

const router = Router()

router.get("/", getPayoutRequest)
router.post("/confirm-payout", authenticateAdmin, confirmPayout)
router.get("/agent-transactions", authenticateAgent, agentTransactions)
router.get("/payout-stats", authenticateAdmin, getPayoutStatistics)
router.get("/successful-payout", authenticateAdmin, getSucessfulPayout)
router.patch("/reject-payout", restrictTo(Role.SUPER_ADMIN), authenticateAdmin, rejectPayout)
router.get("/agent-payout", authenticateAgent, agentPayout)
router.get("/agent/:payoutId", authenticateAgent, agentPayoutById) 
router.post("/charge", authenticateAdmin, restrictTo(Role.SUPER_ADMIN), createCharges)
router.patch("/charge-approve/:chargeId", authenticateAdmin, restrictTo(Role.SUPER_ADMIN), approveCharges)

// rejected payout should come under payout request 
// email on admin creation 
 
export default router