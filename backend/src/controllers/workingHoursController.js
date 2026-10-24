const workingHoursService = require(
  "../services/workingHoursService"
);

async function getWorkingHours(req, res) {
  try {
    const workingHours =
      await workingHoursService.getWorkingHours();

    return res.status(200).json(workingHours);
  } catch (error) {
    console.error(
      "Çalışma saatlerini getirme hatası:",
      error
    );

    return res.status(500).json({
      message: "Çalışma saatleri alınamadı.",
    });
  }
}

async function updateWorkingHours(req, res) {
  try {
    const { id } = req.params;

    const {
      openingTime,
      closingTime,
      isOpen,
    } = req.body;

    // ID yalnızca sayı olmalı.
    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        message:
          "Geçerli bir çalışma günü numarası giriniz.",
      });
    }

    // isOpen mutlaka true veya false olmalı.
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        message:
          "Açık veya kapalı bilgisi doğru gönderilmelidir.",
      });
    }

    // Gün açıksa saat alanları zorunludur.
    if (isOpen) {
      if (!openingTime || !closingTime) {
        return res.status(400).json({
          message:
            "Açık günlerde açılış ve kapanış saatleri zorunludur.",
        });
      }

      // Saat biçimi 08:00, 18:00 gibi olmalı.
      const timeRegex = /^\d{2}:\d{2}$/;

      if (
        !timeRegex.test(openingTime) ||
        !timeRegex.test(closingTime)
      ) {
        return res.status(400).json({
          message:
            "Saatler HH:MM formatında olmalıdır.",
        });
      }
    }

    const result =
      await workingHoursService.updateWorkingHours(
        Number(id),
        openingTime,
        closingTime,
        isOpen
      );

    return res.status(result.status).json({
      message: result.message,
      workingHour: result.workingHour,
    });
  } catch (error) {
    console.error(
      "Çalışma saatlerini güncelleme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Çalışma saatleri güncellenirken hata oluştu.",
    });
  }
}

module.exports = {
  getWorkingHours,
  updateWorkingHours,
};