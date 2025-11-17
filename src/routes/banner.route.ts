import { Router } from "express";
import { createBanner, deleteBanner, fetchBanner, getBannerById, updateBanner } from "../controllers/banner.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.post("/create", authenticateAdmin, createBanner)
router.get("/", fetchBanner)
router.patch("/:id", authenticateAdmin, updateBanner)
router.delete("/:id", authenticateAdmin, deleteBanner)
router.get("/:id", authenticateAdmin, getBannerById)
 
export default router      

// discount for property and this would remove the discount from the total amount if it is more than one days
// generate dicount with code start and and end date with a particular appartment and the amount and this is a one time code 