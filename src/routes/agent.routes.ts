import express from "express";
// import * as Agent from "../controllers/agent";
import { authenticateAgent } from "../middlewares/Agent";
import {
  enlistApartment,
  removeApartment,
  enlistedProperties,
  getPropertiesBySlug,
  publicProperties,
  agentprofileDetails,
} from "../controllers/agent.controller";

const router = express.Router();

// all properties publicly available
router.get("/public-properties", publicProperties);

// agent profile   
router.get("/profile", authenticateAgent, agentprofileDetails)
//enlist property
router.post("/enlist-property", authenticateAgent, enlistApartment);

// remove property
router.delete("/remove-apartment", authenticateAgent, removeApartment);

router.get("/:slug/properties", getPropertiesBySlug);

router.get("/agent-listing", authenticateAgent, enlistedProperties);

export default router;    
