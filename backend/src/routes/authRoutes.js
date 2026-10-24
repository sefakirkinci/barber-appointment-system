const express = require("express");

const authController = require(
  "../controllers/authController"
);

const {
  verifyAdminToken,
} = require("../middleware/authMiddleware");

const {
  verifyAuthToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Hem admin hem berber bu endpoint üzerinden
  giriş yapar.
*/
router.post(
  "/login",
  authController.login
);

/*
  Hem admin hem berber kendi şifresini
  değiştirebilir.
*/
router.put(
  "/change-password",
  verifyAuthToken,
  authController.changePassword
);

router.put(
  "/update-username",
  verifyAdminToken,
  authController.updateUsername
);



module.exports = router;