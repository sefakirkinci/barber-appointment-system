const express = require("express");

const barberController = require(
  "../controllers/barberController"
);

const {
  verifyAdminToken,
  verifyBarberToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Müşteri tarafında aktif berberleri listeler.
*/
router.get(
  "/",
  barberController.getActiveBarbers
);


/*
  Süper yöneticinin bütün berberleri
  listelediği korumalı endpoint.
*/
router.get(
  "/admin/all",
  verifyAdminToken,
  barberController.getAllBarbersForAdmin
);

/*
  Süper yöneticinin yeni berber hesabı
  oluşturduğu endpoint.
*/
router.post(
  "/admin",
  verifyAdminToken,
  barberController.createBarberForAdmin
);

router.put(
  "/admin/:id",
  verifyAdminToken,
  barberController.updateBarberForAdmin
);

router.patch(
  "/admin/:id/status",
  verifyAdminToken,
  barberController.updateBarberStatusForAdmin
);

router.patch(
  "/admin/:id/reset-password",
  verifyAdminToken,
  barberController.resetBarberPasswordForAdmin
);

router.get(
  "/admin/:id/appointments",
  verifyAdminToken,
  barberController
    .getBarberAppointmentsForAdmin
);

router.get(
  "/admin/:id/working-hours",
  verifyAdminToken,
  barberController
    .getBarberWorkingHoursForAdmin
);

router.put(
  "/admin/:id/working-hours/:workingHourId",
  verifyAdminToken,
  barberController
    .updateBarberWorkingHourForAdmin
);
/*
  Giriş yapan berberin kendi randevuları.
*/
router.get(
  "/me/appointments",
  verifyBarberToken,
  barberController.getOwnAppointments
);

/*
  Giriş yapan berberin kendi takvimine
  müşteri adına randevu eklemesi.
*/
router.post(
  "/me/appointments",
  verifyBarberToken,
  barberController.createOwnAppointment
);

/*
  Giriş yapan berberin kendi
  randevusunu güncellemesi.
*/
router.put(
  "/me/appointments/:id",
  verifyBarberToken,
  barberController.updateOwnAppointment
);
/*
  Giriş yapan berberin kendi
  randevusunu silmesi.
*/
router.delete(
  "/me/appointments/:id",
  verifyBarberToken,
  barberController.deleteOwnAppointment
);

/*
  Giriş yapan berberin çalışma saatleri.
*/
router.get(
  "/me/working-hours",
  verifyBarberToken,
  barberController.getOwnWorkingHours
);

/*
  Giriş yapan berberin belirli bir gününü
  günceller.
*/
router.put(
  "/me/working-hours/:id",
  verifyBarberToken,
  barberController.updateOwnWorkingHours
);

/*
  Giriş yapan berberin hesap bilgileri.
*/
router.get(
  "/me/profile",
  verifyBarberToken,
  barberController.getOwnProfile
);

/*
  Giriş yapan berberin hesap bilgilerini
  güncellemesi.
*/
router.put(
  "/me/profile",
  verifyBarberToken,
  barberController.updateOwnProfile
);

/*
  Giriş yapan berberin gelecekteki
  özel günlerini listelemesi.
*/
router.get(
  "/me/date-overrides",
  verifyBarberToken,
  barberController.getOwnDateOverrides
);

/*
  Yeni izin veya özel çalışma günü
  oluşturulması.
*/
router.post(
  "/me/date-overrides",
  verifyBarberToken,
  barberController.createOwnDateOverride
);

/*
  Mevcut özel gün ayarının
  güncellenmesi.
*/
router.put(
  "/me/date-overrides/:id",
  verifyBarberToken,
  barberController.updateOwnDateOverride
);

/*
  Özel gün ayarının kaldırılması.
*/
router.delete(
  "/me/date-overrides/:id",
  verifyBarberToken,
  barberController.deleteOwnDateOverride
);

/*
  Dinamik id route'u her zaman özel
  /me route'larından sonra bulunmalıdır.
*/
router.get(
  "/:id",
  barberController.getBarberById
);

module.exports = router;