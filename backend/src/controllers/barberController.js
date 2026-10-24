const barberService = require(
  "../services/barberService"
);

const appointmentService = require(
  "../services/appointmentService"
);

/*
  GET /barbers

  Aktif berberleri müşteriye gönderir.
*/
async function getActiveBarbers(req, res) {
  try {
    const result =
      await barberService.getActiveBarbers();

    return res.status(result.status).json({
      barbers: result.barbers,
    });
  } catch (error) {
    console.error(
      "Berberler alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berberler alınırken bir sunucu hatası oluştu.",
    });
  }
}

/*
  GET /barbers/:id

  Belirli bir berberin bilgilerini getirir.
*/
async function getBarberById(req, res) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        message: "Geçerli bir berber numarası girin.",
      });
    }

    const result =
      await barberService.getBarberById(id);

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      barber: result.barber,
    });
  } catch (error) {
    console.error(
      "Berber bilgisi alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber bilgisi alınırken bir sunucu hatası oluştu.",
    });
  }
}


/*
  GET /barbers/me/appointments

  JWT doğrulandıktan sonra authMiddleware
  req.user.barberId değerini oluşturur.
*/
async function getOwnAppointments(req, res) {
  try {
    const barberId = req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService.getOwnAppointments(
        barberId
      );

    return res.status(result.status).json({
      appointments: result.appointments,
    });
  } catch (error) {
    console.error(
      "Berber randevuları alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Randevular alınırken bir sunucu hatası oluştu.",
    });
  }
}

/*
  POST /barbers/me/appointments

  Giriş yapan berberin kendi takvimine
  müşteri adına randevu eklemesini sağlar.

  barberId frontend'den alınmaz.
  Doğrulanmış JWT içinden alınır.
*/
async function createOwnAppointment(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const {
      name,
      surname,
      phone,
      date,
      time,
    } = req.body;

    /*
      Frontend barberId gönderse bile
      kullanmıyoruz.

      Randevu mutlaka giriş yapan berberin
      hesabına oluşturulur.
    */
    const result =
      await appointmentService.createAppointment({
        barberId,
        name,
        surname,
        phone,
        date,
        time,
      });

    return res
      .status(result.status)
      .json({
        message: result.message,
        appointment:
          result.appointment,
      });
  } catch (error) {
    console.error(
      "Berber tarafından randevu oluşturulurken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Randevu oluşturulurken bir sunucu hatası oluştu.",
    });
  }
}

/*
  GET /barbers/me/working-hours

  Giriş yapan berberin haftalık çalışma
  saatlerini getirir.
*/
async function getOwnWorkingHours(req, res) {
  try {
    const barberId = req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService.getOwnWorkingHours(
        barberId
      );

    return res.status(result.status).json({
      workingHours: result.workingHours,
    });
  } catch (error) {
    console.error(
      "Çalışma saatleri alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Çalışma saatleri alınırken bir sunucu hatası oluştu.",
    });
  }
}

/*
  PUT /barbers/me/working-hours/:id

  Giriş yapan berberin yalnızca kendisine ait
  çalışma günü ayarını günceller.
*/
async function updateOwnWorkingHours(req, res) {
  try {
    const barberId = req.user.barberId;
    const { id } = req.params;

    const {
      openingTime,
      closingTime,
      isOpen,
    } = req.body;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        message:
          "Geçerli bir çalışma günü numarası giriniz.",
      });
    }

    /*
      isOpen kesinlikle true veya false olmalıdır.
      "true" metnini kabul etmiyoruz.
    */
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        message:
          "Açık veya kapalı bilgisi geçersiz.",
      });
    }

    const result =
      await barberService.updateOwnWorkingHours(
        barberId,
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
      "Çalışma saatleri güncellenirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Çalışma saatleri güncellenirken bir sunucu hatası oluştu.",
    });
  }
}


/*
  GET /barbers/me/profile

  Giriş yapan berberin hesap bilgilerini
  getirir.
*/
async function getOwnProfile(req, res) {
  try {
    const barberId = req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService.getOwnProfile(
        barberId
      );

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      barber: result.barber,
    });
  } catch (error) {
    console.error(
      "Berber hesabı alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Hesap bilgileri alınırken bir sunucu hatası oluştu.",
    });
  }
}

/*
  PUT /barbers/me/profile

  Giriş yapan berberin kendi profilini
  günceller.
*/
async function updateOwnProfile(req, res) {
  try {
    const barberId = req.user.barberId;

  const {
  name,
  surname,
  phone,
  whatsappNumber,
  username,
} = req.body;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

   const result =
  await barberService.updateOwnProfile(
    barberId,
    name,
    surname,
    phone,
    whatsappNumber,
    username
  );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
    });
  } catch (error) {
    console.error(
      "Berber hesabı güncellenirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Hesap bilgileri güncellenirken bir sunucu hatası oluştu.",
    });
  }
}

/*
  GET /barbers/admin/all

  Yalnızca işletme yöneticisi bütün
  berber hesaplarını görüntüleyebilir.
*/
async function getAllBarbersForAdmin(req, res) {
  try {
    const result =
      await barberService.getAllBarbersForAdmin();

    return res.status(result.status).json({
      barbers: result.barbers,
    });
  } catch (error) {
    console.error(
      "Berber listesi alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber listesi alınırken bir sunucu hatası oluştu.",
    });
  }
}

/*
  POST /barbers/admin

  Süper yöneticinin yeni bir berber hesabı
  oluşturmasını sağlar.
*/
async function createBarberForAdmin(req, res) {
  try {
    const result =
      await barberService.createBarberForAdmin(
        req.body
      );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
      temporaryPassword:
        result.temporaryPassword,
    });
  } catch (error) {
    console.error(
      "Yeni berber oluşturulurken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Yeni berber oluşturulurken bir sunucu hatası oluştu.",
    });
  }
}

async function updateBarberForAdmin(req, res) {
  try {
    const result =
      await barberService.updateBarberForAdmin(
        req.params.id,
        req.body
      );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Berber güncellenirken sunucu hatası oluştu.",
    });
  }
}

async function updateBarberStatusForAdmin(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result =
      await barberService.updateBarberStatusForAdmin(
        id,
        isActive
      );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
    });
  } catch (error) {
    console.error(
      "Berber durumu güncellenirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber durumu güncellenirken bir sunucu hatası oluştu.",
    });
  }
}

async function resetBarberPasswordForAdmin(
  req,
  res
) {
  try {
    const { id } = req.params;

    const { temporaryPassword } =
      req.body;

    const result =
      await barberService
        .resetBarberPasswordForAdmin(
          id,
          temporaryPassword
        );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
      temporaryPassword:
        result.temporaryPassword,
    });
  } catch (error) {
    console.error(
      "Berber şifresi sıfırlanırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber şifresi sıfırlanırken bir sunucu hatası oluştu.",
    });
  }
}

async function getBarberAppointmentsForAdmin(
  req,
  res
) {
  try {
    const result =
      await barberService
        .getBarberAppointmentsForAdmin(
          req.params.id
        );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
      appointments:
        result.appointments,
    });
  } catch (error) {
    console.error(
      "Berber randevuları alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber randevuları alınırken bir sunucu hatası oluştu.",
    });
  }
}

async function getBarberWorkingHoursForAdmin(
  req,
  res
) {
  try {
    const result =
      await barberService
        .getBarberWorkingHoursForAdmin(
          req.params.id
        );

    return res.status(result.status).json({
      message: result.message,
      barber: result.barber,
      workingHours: result.workingHours,
    });
  } catch (error) {
    console.error(
      "Berber çalışma saatleri alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber çalışma saatleri alınırken bir sunucu hatası oluştu.",
    });
  }
}

async function updateBarberWorkingHourForAdmin(
  req,
  res
) {
  try {
    const {
      openingTime,
      closingTime,
      isOpen,
    } = req.body;

    const result =
      await barberService
        .updateBarberWorkingHourForAdmin(
          req.params.id,
          req.params.workingHourId,
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
      "Berber çalışma saati güncellenirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Berber çalışma saati güncellenirken bir sunucu hatası oluştu.",
    });
  }
}

/*
  DELETE /barbers/me/appointments/:id

  Giriş yapan berberin yalnızca kendi
  randevusunu silmesini sağlar.
*/
async function deleteOwnAppointment(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService.deleteOwnAppointment(
        barberId,
        req.params.id
      );

    return res
      .status(result.status)
      .json({
        message: result.message,
        appointment:
          result.appointment,
      });
  } catch (error) {
    console.error(
      "Berber randevu silme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Randevu silinirken bir sunucu hatası oluştu.",
    });
  }
}

/*
  PUT /barbers/me/appointments/:id

  Giriş yapan berberin yalnızca kendi
  randevusunu güncellemesini sağlar.
*/
async function updateOwnAppointment(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService.updateOwnAppointment(
        barberId,
        req.params.id,
        req.body
      );

    return res
      .status(result.status)
      .json({
        message: result.message,
        appointment:
          result.appointment,
      });
  } catch (error) {
    console.error(
      "Berber randevu güncelleme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Randevu güncellenirken bir sunucu hatası oluştu.",
    });
  }
}

async function getOwnDateOverrides(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService
        .getOwnDateOverrides(
          barberId
        );

    return res.status(result.status).json({
      dateOverrides:
        result.dateOverrides,
    });
  } catch (error) {
    console.error(
      "Özel günler alınırken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Özel günler alınırken bir sunucu hatası oluştu.",
    });
  }
}

async function createOwnDateOverride(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService
        .createOwnDateOverride(
          barberId,
          req.body
        );

    return res.status(result.status).json({
      message: result.message,
      dateOverride:
        result.dateOverride,
    });
  } catch (error) {
    console.error(
      "Özel gün oluşturulurken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Özel gün oluşturulurken bir sunucu hatası oluştu.",
    });
  }
}

async function updateOwnDateOverride(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService
        .updateOwnDateOverride(
          barberId,
          req.params.id,
          req.body
        );

    return res.status(result.status).json({
      message: result.message,
      dateOverride:
        result.dateOverride,
    });
  } catch (error) {
    console.error(
      "Özel gün güncellenirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Özel gün güncellenirken bir sunucu hatası oluştu.",
    });
  }
}

async function deleteOwnDateOverride(
  req,
  res
) {
  try {
    const barberId =
      req.user.barberId;

    if (!barberId) {
      return res.status(403).json({
        message:
          "Berber hesabı bilgisi bulunamadı.",
      });
    }

    const result =
      await barberService
        .deleteOwnDateOverride(
          barberId,
          req.params.id
        );

    return res.status(result.status).json({
      message: result.message,
      dateOverride:
        result.dateOverride,
    });
  } catch (error) {
    console.error(
      "Özel gün silinirken hata oluştu:",
      error
    );

    return res.status(500).json({
      message:
        "Özel gün silinirken bir sunucu hatası oluştu.",
    });
  }
}

module.exports = {
  getActiveBarbers,
  getBarberById,
  getOwnAppointments,
  getOwnWorkingHours,
  updateOwnWorkingHours,
  getOwnProfile,
  updateOwnProfile,
  getAllBarbersForAdmin,
  createBarberForAdmin,
  updateBarberForAdmin,
  updateBarberStatusForAdmin,
  resetBarberPasswordForAdmin,
  getBarberAppointmentsForAdmin,
  getBarberWorkingHoursForAdmin,
  updateBarberWorkingHourForAdmin,
  createOwnAppointment,
  deleteOwnAppointment,
  updateOwnAppointment,
  getOwnDateOverrides,
  createOwnDateOverride,
  updateOwnDateOverride,
  deleteOwnDateOverride,
};