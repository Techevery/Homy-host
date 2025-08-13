import express from "express";
import {
  createAdminProfile,
  adminLogin,
  createAgent,
  agentLogin,
} from "../controllers/auth.controller";

const router = express.Router();

router.post("/register-agent", createAgent);
router.post("/agent-login", agentLogin);
router.post("/register-admin", createAdminProfile);
router.post("/admin-login", adminLogin);

export default router;
