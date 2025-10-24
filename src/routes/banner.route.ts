import { Router } from "express";
import { authenticateAdmin } from "../middlewares/Admin";
import { createBanner, fetchBanner, getBannerById } from "../controllers/banner.controller";

const router = Router()

router.post("/create", authenticateAdmin, createBanner)
router.get("/", fetchBanner)
router.get("/:id", getBannerById)

export default router