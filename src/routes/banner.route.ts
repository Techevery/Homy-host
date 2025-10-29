import { Router } from "express";
import { authenticateAdmin } from "../middlewares/Admin";
import { createBanner, fetchBanner, getBannerById } from "../controllers/banner.controller";

const router = Router()

router.post("/create", authenticateAdmin, createBanner)
router.get("/", fetchBanner)
router.get("/:id", getBannerById) 

export default router    

// discount for property and this would remove the discount from the total amount if it is more than one days
// generate dicount with code start and and end date with a particular appartment and the amount and this is a one time code 