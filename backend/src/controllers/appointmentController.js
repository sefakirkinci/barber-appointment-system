const appointmentService = require("../services/appointmentService");

async function getAppointments(req, res) {
    try {
        const appointments =
            await appointmentService.getAppointments();

        return res.status(200).json(appointments);
    } catch (error) {
        console.error("Randevular alınırken hata oluştu:", error);

        return res.status(500).json({
            message: "Randevular alınırken bir sunucu hatası oluştu."
        });
    }
}

async function createAppointment(req, res) {
    try {
        const result =
            await appointmentService.createAppointment(req.body);

        return res.status(result.status).json({
            message: result.message,
            appointment: result.appointment
        });
    } catch (error) {
        console.error("Randevu oluşturulurken hata oluştu:", error);

        return res.status(500).json({
            message: "Randevu oluşturulurken bir sunucu hatası oluştu."
        });
    }
}

async function deleteAppointment(req, res) {
    try {
        const { id } = req.params;

        const result =
            await appointmentService.deleteAppointment(id);

        return res.status(result.status).json({
            message: result.message,
            appointment: result.appointment
        });
    } catch (error) {
        console.error("Randevu silinirken hata oluştu:", error);

        return res.status(500).json({
            message: "Randevu silinirken bir sunucu hatası oluştu."
        });
    }
}

async function updateAppointment(req, res) {
    try {
        const { id } = req.params;

        const result =
            await appointmentService.updateAppointment(id, req.body);

        return res.status(result.status).json({
            message: result.message,
            appointment: result.appointment
        });
    } catch (error) {
        console.error("Randevu güncellenirken hata oluştu:", error);

        return res.status(500).json({
            message: "Randevu güncellenirken bir sunucu hatası oluştu."
        });
    }
}

async function getAppointmentsByDate(req, res) {
  try {
    const { date } = req.params;

    const appointments =
      await appointmentService.getAppointmentsByDate(date);

    return res.status(200).json(appointments);
  } catch (error) {
    console.error(
      "Tarihe göre randevular alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Randevular alınırken bir sunucu hatası oluştu.",
    });
  }
}

async function getAvailableTimes(req, res) {
  try {
    /*
      URL yapısı:

      /appointments/available/:barberId/:date
    */
    const { barberId, date } = req.params;

    const dateRegex =
      /^\d{4}-\d{2}-\d{2}$/;

    /*
      Berber id değeri yalnızca rakamlardan
      oluşmalıdır.
    */
    if (!/^\d+$/.test(barberId)) {
      return res.status(400).json({
        message:
          "Geçerli bir berber numarası giriniz.",
        availableTimes: [],
      });
    }

    if (!dateRegex.test(date)) {
      return res.status(400).json({
        message:
          "Geçerli bir tarih giriniz.",
        availableTimes: [],
      });
    }

    /*
      Geçmiş tarih kontrolü.

      YYYY-MM-DD biçimi tarih sıralamasına uygun
      olduğu için string karşılaştırması güvenli
      şekilde kullanılabilir.
    */
    const today = new Date();

    const minimumDate = [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(
        today.getDate()
      ).padStart(2, "0"),
    ].join("-");

    if (date < minimumDate) {
      return res.status(400).json({
        message:
          "Geçmiş bir tarih için randevu alınamaz.",
        availableTimes: [],
      });
    }

    const result =
      await appointmentService.getAvailableTimes(
        Number(barberId),
        date
      );

    return res.status(result.status).json({
      message: result.message,
      availableTimes:
        result.availableTimes,
    });
  } catch (error) {
    console.error(
      "Müsait saatleri getirme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Müsait saatler alınırken bir sunucu hatası oluştu.",
      availableTimes: [],
    });
  }
}

async function findAppointment(req, res) {
  try {
    const { id, phone } = req.body;

    if (!id || !phone) {
      return res.status(400).json({
        message:
          "Randevu numarası ve telefon numarası zorunludur."
      });
    }

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        message: "Geçerli bir randevu numarası giriniz."
      });
    }

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({
        message:
          "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
      });
    }

    const appointment =
      await appointmentService.findAppointment(
        Number(id),
        phone
      );

    if (!appointment) {
      return res.status(404).json({
        message:
          "Bu bilgilerle eşleşen bir randevu bulunamadı."
      });
    }

    return res.status(200).json({
      message: "Randevu bulundu.",
      appointment
    });
  } catch (error) {
    console.error("Randevu arama hatası:", error);

    return res.status(500).json({
      message: "Randevu aranırken bir sunucu hatası oluştu."
    });
  }
}

async function cancelCustomerAppointment(req, res) {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!id || !phone) {
      return res.status(400).json({
        message:
          "Randevu numarası ve telefon numarası zorunludur."
      });
    }

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        message: "Geçerli bir randevu numarası giriniz."
      });
    }

    if (!/^0\d{10}$/.test(phone)) {
      return res.status(400).json({
        message:
          "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
      });
    }

    const result =
      await appointmentService.cancelCustomerAppointment(
        Number(id),
        phone
      );

    return res.status(result.status).json({
      message: result.message,
      appointment: result.appointment
    });
  } catch (error) {
    console.error(
      "Müşteri randevu iptal hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Randevu iptal edilirken bir sunucu hatası oluştu."
    });
  }
}


async function getDashboardSummary(req, res) {
  try {
    const summary =
      await appointmentService.getDashboardSummary();

    return res.status(200).json(summary);
  } catch (error) {
    console.error(
      "Dashboard bilgileri alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Dashboard bilgileri alınırken bir sunucu hatası oluştu.",
    });
  }
}


async function getAppointmentStatistics(req, res) {
  try {
    const statistics =
      await appointmentService.getAppointmentStatistics();

    return res.status(200).json(statistics);
  } catch (error) {
    console.error(
      "Randevu istatistikleri alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Randevu istatistikleri alınırken bir sunucu hatası oluştu.",
    });
  }
}




module.exports = {
    getAppointments,
    getAppointmentsByDate,
    getAvailableTimes,
    createAppointment,
    deleteAppointment,
    updateAppointment,
    findAppointment,
    cancelCustomerAppointment,
    getAppointmentStatistics,
    getDashboardSummary,
};