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
  createAgentBanner,
  deleteBanner,
  getBanners,
  updateAgentBanner,
  getUnlistedApartmentsCtrl,
  forgetPassword,
  resetPassword,
} from "../controllers/agent.controller";

const router = express.Router();
 
// all properties publicly available
router.get("/public-properties", publicProperties);

router.post("/forget-password", forgetPassword); 
router.post("/reset-password", resetPassword); 

// agent profile   
router.get("/profile", authenticateAgent, agentprofileDetails)
//enlist property
router.post("/enlist-property", authenticateAgent, enlistApartment);

router.get("/agent-listing", authenticateAgent, enlistedProperties);

// unlisted apartment 
router.get("/unlisted-apartment", authenticateAgent, getUnlistedApartmentsCtrl)

// / banner 
router.post("/create-banner", authenticateAgent, createAgentBanner) 
router.get("/banner", authenticateAgent, getBanners)
router.patch("/banner/:id", authenticateAgent, updateAgentBanner)
router.delete("/banner/:id", authenticateAgent, deleteBanner)

   
// remove property
router.delete("/remove-apartment/:apartmentId", authenticateAgent, removeApartment);
 
router.get("/:slug/properties", getPropertiesBySlug);

export default router;    
