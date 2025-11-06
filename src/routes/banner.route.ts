import { Router } from "express";
import { createBanner, deleteBanner, fetchBanner, getBannerById, updateBanner } from "../controllers/banner.controller";
import { authenticateAgent } from "../middlewares/Agent";

const router = Router()

router.post("/create", authenticateAgent, createBanner)
router.get("/", authenticateAgent, fetchBanner)
router.patch("/:id", authenticateAgent, updateBanner)
router.delete("/:id", authenticateAgent, deleteBanner)
router.get("/:id", getBannerById) 

export default router    

// discount for property and this would remove the discount from the total amount if it is more than one days
// generate dicount with code start and and end date with a particular appartment and the amount and this is a one time code 