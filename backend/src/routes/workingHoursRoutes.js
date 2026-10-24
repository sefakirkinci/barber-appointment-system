const express = require("express");

const workingHoursController = require(
  "../controllers/workingHoursController"
);

const {
  verifyAdminToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  verifyAdminToken,
  workingHoursController.getWorkingHours
);

router.put(
  "/:id",
  verifyAdminToken,
  workingHoursController.updateWorkingHours
);

module.exports = router;