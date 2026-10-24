const express = require("express");

const appointmentController = require(
  "../controllers/appointmentController"
);

const {
  verifyAdminToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  MÜŞTERİ ROUTE'LARI
  Bu route'lar yönetici token'ı istemez.
*/

/*
  Seçilen tarihteki müsait saatleri getirir.
  Örnek:
  GET /appointments/available/2026-07-30
*/
router.get(
  "/available/:barberId/:date",
  appointmentController.getAvailableTimes
);

/*
  Yeni randevu oluşturur.
  Örnek:
  POST /appointments
*/
router.post(
  "/",
  appointmentController.createAppointment
);

/*
  Müşteri randevusunu ID ve telefonla bulur.
  Örnek:
  POST /appointments/find
*/
router.post(
  "/find",
  appointmentController.findAppointment
);

/*
  Müşterinin kendi randevusunu iptal etmesini sağlar.
  Bu özel route, genel /:id route'undan önce yazılmıştır.
*/
router.delete(
  "/manage/:id",
  appointmentController.cancelCustomerAppointment
);


router.get(
  "/dashboard",
  verifyAdminToken,
  appointmentController.getDashboardSummary
);


router.get(
  "/statistics",
  verifyAdminToken,
  appointmentController.getAppointmentStatistics
);

/*
  YÖNETİCİ ROUTE'LARI
  Bu route'lar geçerli JWT token'ı ister.
*/

/*
  Bütün randevuları getirir.
  Örnek:
  GET /appointments
*/
router.get(
  "/",
  verifyAdminToken,
  appointmentController.getAppointments
);

/*
  Seçilen tarihteki randevuları getirir.
  Örnek:
  GET /appointments/date/2026-07-30
*/
router.get(
  "/date/:date",
  verifyAdminToken,
  appointmentController.getAppointmentsByDate
);

/*
  Yönetici randevuyu günceller.
  Örnek:
  PUT /appointments/12
*/
router.put(
  "/:id",
  verifyAdminToken,
  appointmentController.updateAppointment
);

/*
  Yönetici randevuyu siler.
  Örnek:
  DELETE /appointments/12
*/
router.delete(
  "/:id",
  verifyAdminToken,
  appointmentController.deleteAppointment
);



module.exports = router;