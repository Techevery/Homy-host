import { Router } from "express";
import { createBanner, deleteBanner, fetchBanner, getBannerById, updateBanner } from "../controllers/banner.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import { restrictTo, Role } from "../middlewares/roles";

const router = Router()

router.post("/create", authenticateAdmin, restrictTo(Role.SUPER_ADMIN), createBanner)
router.get("/", fetchBanner)
router.patch("/:id", authenticateAdmin, restrictTo(Role.SUPER_ADMIN), updateBanner)
router.delete("/:id", authenticateAdmin, restrictTo(Role.SUPER_ADMIN), deleteBanner)
router.get("/:id", authenticateAdmin, getBannerById)
 
export default router            
