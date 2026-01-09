import express from "express";
import {
  createAdminProfile,
  adminLogin,
  createAgent,
  agentLogin,
  updateAgent,
} from "../controllers/auth.controller";
import { authenticateAgent } from "../middlewares/Agent";

const router = express.Router();

router.post("/register-agent", createAgent);
router.post("/agent-login", agentLogin); 
router.post("/register-admin", createAdminProfile);
router.post("/admin-login", adminLogin);
router.patch("/update-agent-profile", authenticateAgent, updateAgent)
 
export default router;
