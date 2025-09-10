import express from "express";
import * as Admin from "../controllers/admin.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import * as adminController from "../controllers/admin.controller";
import * as apartmentController from "../controllers/apartment.controller";

const router = express.Router();

router.post(
  "/upload-property",
  authenticateAdmin,
  apartmentController.createApartment
); 

router.put("/verify-agent", authenticateAdmin, adminController.verifyAgent);

router.get(
  "/list-apartments",
  authenticateAdmin,
  adminController.listProperties
);

router.get("/list-agents", authenticateAdmin, adminController.listAgents);

router.get("/agents-profile", Admin.getAgentProfile);

router.get("/admin-profile", authenticateAdmin, adminController.adminProfile);

router.patch(
  "/edit-profile",
  authenticateAdmin,
  adminController.editAdminProfile
);

router.get(
  "/search-apartment",
  authenticateAdmin,
  apartmentController.searchApartment
);

router.get("/stats", authenticateAdmin, adminController.getDashboardStats);

router.delete(
  "/:apartmentId",
  authenticateAdmin,
  apartmentController.deleteApartment
);

router.post(
  "/get-transaction-details",
  authenticateAdmin,
  adminController.getTransactionDetailsByYear
);
 
export default router;
