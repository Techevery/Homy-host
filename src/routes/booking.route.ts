import { Router } from "express";
import { fetchAllBookings } from "../controllers/booking.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.get("/", authenticateAdmin, fetchAllBookings)

export default router