const pool = require("../config/db");

const {
  sendTemplateMessage,
} = require("./whatsappService");

function isValidDateFormat(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    return dateRegex.test(date);
}

function isPastDate(date) {
    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return selectedDate < today;
}

async function getAppointments() {
    const result = await pool.query(`
        SELECT
            id,
            name,
            surname,
            phone,
            TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
            TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
            created_at
        FROM appointments
        ORDER BY appointment_date, appointment_time
    `);

    return result.rows;
}



async function getDashboardSummary() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_appointments,

      COUNT(*) FILTER (
        WHERE appointment_date = CURRENT_DATE
      )::int AS today_appointments,

      COUNT(*) FILTER (
        WHERE appointment_date >= DATE_TRUNC(
          'week',
          CURRENT_DATE
        )::date
        AND appointment_date <
          (
            DATE_TRUNC('week', CURRENT_DATE)
            + INTERVAL '7 days'
          )::date
      )::int AS week_appointments,

      (
        SELECT TO_CHAR(
          appointment_date,
          'YYYY-MM-DD'
        )
        FROM appointments
        WHERE
          appointment_date > CURRENT_DATE
          OR (
            appointment_date = CURRENT_DATE
            AND appointment_time > CURRENT_TIME
          )
        ORDER BY
          appointment_date ASC,
          appointment_time ASC
        LIMIT 1
      ) AS next_appointment_date,

      (
        SELECT TO_CHAR(
          appointment_time,
          'HH24:MI'
        )
        FROM appointments
        WHERE
          appointment_date > CURRENT_DATE
          OR (
            appointment_date = CURRENT_DATE
            AND appointment_time > CURRENT_TIME
          )
        ORDER BY
          appointment_date ASC,
          appointment_time ASC
        LIMIT 1
      ) AS next_appointment_time
    FROM appointments
  `);

  return result.rows[0];
}



async function getAppointmentStatistics() {
  const dailyResult = await pool.query(`
    SELECT
      EXTRACT(
        ISODOW FROM appointment_date
      )::int AS day_number,

      CASE EXTRACT(
        ISODOW FROM appointment_date
      )::int
        WHEN 1 THEN 'Pazartesi'
        WHEN 2 THEN 'Salı'
        WHEN 3 THEN 'Çarşamba'
        WHEN 4 THEN 'Perşembe'
        WHEN 5 THEN 'Cuma'
        WHEN 6 THEN 'Cumartesi'
        WHEN 7 THEN 'Pazar'
      END AS day_name,

      COUNT(*)::int AS appointment_count
    FROM appointments
    GROUP BY
      EXTRACT(
        ISODOW FROM appointment_date
      )
    ORDER BY day_number
  `);

  const busiestDayResult = await pool.query(`
    SELECT
      CASE EXTRACT(
        ISODOW FROM appointment_date
      )::int
        WHEN 1 THEN 'Pazartesi'
        WHEN 2 THEN 'Salı'
        WHEN 3 THEN 'Çarşamba'
        WHEN 4 THEN 'Perşembe'
        WHEN 5 THEN 'Cuma'
        WHEN 6 THEN 'Cumartesi'
        WHEN 7 THEN 'Pazar'
      END AS day_name,

      COUNT(*)::int AS appointment_count
    FROM appointments
    GROUP BY
      EXTRACT(
        ISODOW FROM appointment_date
      )
    ORDER BY appointment_count DESC
    LIMIT 1
  `);

  const busiestTimeResult = await pool.query(`
    SELECT
      TO_CHAR(
        appointment_time,
        'HH24:MI'
      ) AS appointment_time,

      COUNT(*)::int AS appointment_count
    FROM appointments
    GROUP BY appointment_time
    ORDER BY
      appointment_count DESC,
      appointment_time ASC
    LIMIT 1
  `);

  return {
    appointmentsByDay: dailyResult.rows,

    busiestDay:
      busiestDayResult.rows[0] || null,

    busiestTime:
      busiestTimeResult.rows[0] || null,
  };
}



async function createAppointment(appointment) {
  const {
    barberId,
    name,
    surname,
    phone,
    date,
    time,
  } = appointment;

  // 1. Zorunlu alan kontrolü
  if (
    !barberId ||
    !name ||
    !surname ||
    !phone ||
    !date ||
    !time
  ) {
    return {
      status: 400,
      message: "Lütfen tüm alanları doldurun.",
    };
  }

  // 2. Berber numarası geçerli mi?
  if (!Number.isInteger(Number(barberId))) {
    return {
      status: 400,
      message: "Geçerli bir berber seçiniz.",
    };
  }

  // 3. Seçilen berber var mı ve aktif mi?
  const barberResult = await pool.query(
    `
     SELECT
      id,
      name,
      surname,
      whatsapp_number,
      is_active
    FROM barbers
    WHERE id = $1
    `,
    [Number(barberId)]
  );

  if (barberResult.rowCount === 0) {
    return {
      status: 404,
      message: "Seçilen berber bulunamadı.",
    };
  }

  const barber = barberResult.rows[0];

  if (!barber.is_active) {
    return {
      status: 400,
      message:
        "Seçilen berber şu anda randevu kabul etmiyor.",
    };
  }

  // 4. Telefon numarası kontrolü
  const phoneRegex = /^0\d{10}$/;

  if (!phoneRegex.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  // 5. Geçmiş tarih ve saat kontrolü
  const futureValidation =
    validateFutureAppointment(date, time);

  if (!futureValidation.isValid) {
    return {
      status: futureValidation.status,
      message: futureValidation.message,
    };
  }

  // 6. Seçilen gün ve saat çalışma düzenine uygun mu?
const timeValidation =
  await validateAppointmentTime(
    barberId,
    date,
    time
  );

  if (!timeValidation.isValid) {
    return {
      status: timeValidation.status,
      message: timeValidation.message,
    };
  }

  /*
    7. Aynı berberin aynı tarih ve saatte
    başka bir randevusu var mı?
  */
  const bookedResult = await pool.query(
    `
      SELECT id
      FROM appointments
      WHERE barber_id = $1
        AND appointment_date = $2
        AND appointment_time = $3
    `,
    [Number(barberId), date, time]
  );

  if (bookedResult.rowCount > 0) {
    return {
      status: 409,
      message:
        "Seçtiğiniz berberin bu saatte başka bir randevusu bulunmaktadır.",
    };
  }

  // 8. Bütün kontroller başarılıysa randevuyu kaydet
  const insertResult = await pool.query(
    `
      INSERT INTO appointments (
        barber_id,
        name,
        surname,
        phone,
        appointment_date,
        appointment_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        barber_id,
        name,
        surname,
        phone,
        appointment_date,
        appointment_time
    `,
    [
      Number(barberId),
      name,
      surname,
      phone,
      date,
      time,
    ]
  );


  const createdAppointment =
  insertResult.rows[0];

try {
  if (barber.whatsapp_number) {
    let barberWhatsAppNumber =
      barber.whatsapp_number.replace(
        /\D/g,
        ""
      );

    /*
      Veritabanında numara:
      05301234567

      şeklindeyse WhatsApp API için:
      905301234567

      şekline çeviriyoruz.
    */
    if (
      barberWhatsAppNumber.startsWith("0")
    ) {
      barberWhatsAppNumber =
        "90" +
        barberWhatsAppNumber.slice(1);
    }

    await sendTemplateMessage(
      barberWhatsAppNumber,
      "yeni_randevu_bildirimi",
      "tr",
      [
        `${createdAppointment.name} ${createdAppointment.surname}`,
        createdAppointment.id,
        date,
        time,
        createdAppointment.phone,
      ]
    );

    console.log(
      "WhatsApp randevu bildirimi berbere gönderildi."
    );
  } else {
    console.log(
      "Berberin WhatsApp numarası tanımlı değil."
    );
  }
} catch (error) {
  console.error(
    "WhatsApp bildirimi gönderilemedi:",
    error.message
  );
}

  /*
    9. Oluşturulan randevuya berber adını da
    ekleyerek controller'a gönderiyoruz.
  */
  return {
    status: 201,
    message: "Randevu başarıyla oluşturuldu.",
    appointment: {
      ...insertResult.rows[0],
      barber_name: barber.name,
      barber_surname: barber.surname,
    },
  };
}



async function deleteAppointment(id) {
    const result = await pool.query(
        `
        DELETE FROM appointments
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    if (result.rowCount===0) {
        return {
            status: 404,
            message: "Randevu bulunamadı."
        };
    }
    
    return {
        status: 200,
        message: "Randevu başarıyla silindi.",
        appointment: result.rows[0]
    };
}

async function updateAppointment(
  id,
  appointment
) {
  const {
    name,
    surname,
    phone,
    date,
    time,
  } = appointment;

  // 1. Zorunlu alan kontrolü
  if (
    !name ||
    !surname ||
    !phone ||
    !date ||
    !time
  ) {
    return {
      status: 400,
      message:
        "Lütfen tüm alanları doldurun.",
    };
  }

  // 2. Telefon numarası kontrolü
  const phoneRegex = /^0\d{10}$/;

  if (!phoneRegex.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  // 3. Güncellenecek randevu gerçekten var mı?
  const existingResult =
    await pool.query(
      `
        SELECT
          id,
          barber_id
        FROM appointments
        WHERE id = $1
      `,
      [id]
    );

  if (existingResult.rowCount === 0) {
    return {
      status: 404,
      message:
        "Randevu bulunamadı.",
    };
  }

  const barberId =
    existingResult.rows[0].barber_id;

  // 4. Geçmiş tarih ve saat kontrolü
  const futureValidation =
    validateFutureAppointment(
      date,
      time
    );

  if (!futureValidation.isValid) {
    return {
      status:
        futureValidation.status,
      message:
        futureValidation.message,
    };
  }

  // 5. Çalışma saati ve özel gün kontrolü
  const timeValidation =
    await validateAppointmentTime(
      barberId,
      date,
      time
    );

  if (!timeValidation.isValid) {
    return {
      status: timeValidation.status,
      message: timeValidation.message,
    };
  }

  // 6. Aynı berberin aynı tarih ve saatinde
  // başka randevu var mı?
  const bookedResult =
    await pool.query(
      `
        SELECT id
        FROM appointments
        WHERE barber_id = $1
          AND appointment_date = $2
          AND appointment_time = $3
          AND id <> $4
      `,
      [
        barberId,
        date,
        time,
        id,
      ]
    );

  if (bookedResult.rowCount > 0) {
    return {
      status: 409,
      message:
        "Bu tarih ve saatte başka bir randevu bulunmaktadır.",
    };
  }

  // 7. Randevuyu güncelle
  const updateResult =
    await pool.query(
      `
        UPDATE appointments
        SET
          name = $1,
          surname = $2,
          phone = $3,
          appointment_date = $4,
          appointment_time = $5
        WHERE id = $6
        RETURNING
          id,
          barber_id,
          name,
          surname,
          phone,
          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS appointment_date,
          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS appointment_time
      `,
      [
        name.trim(),
        surname.trim(),
        phone,
        date,
        time,
        id,
      ]
    );

  return {
    status: 200,
    message:
      "Randevu başarıyla güncellendi.",
    appointment:
      updateResult.rows[0],
  };
}

async function getAppointmentsByDate(date) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        phone,
        appointment_date,
        appointment_time,
        created_at
      FROM appointments
      WHERE appointment_date = $1
      ORDER BY appointment_time ASC
    `,
    [date]
  );

  return result.rows;
}

function timeToMinutes(time) {
  const [hour, minute] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function minutesToTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;
}

function validateFutureAppointment(date, time) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  const [hour, minute] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  const appointmentDateTime = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  if (Number.isNaN(appointmentDateTime.getTime())) {
    return {
      isValid: false,
      status: 400,
      message: "Geçerli bir tarih ve saat seçiniz.",
    };
  }

  const now = new Date();

  if (appointmentDateTime <= now) {
    return {
      isValid: false,
      status: 400,
      message:
        "Geçmiş bir tarih veya saate randevu oluşturamazsınız.",
    };
  }

  return {
    isValid: true,
  };
}

async function validateAppointmentTime(
  barberId,
  date,
  time
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      isValid: false,
      status: 400,
      message:
        "Geçerli bir berber seçiniz.",
    };
  }

  /*
    Önce seçilen tarih için özel bir ayar
    bulunup bulunmadığını kontrol ediyoruz.
  */
  const overrideResult =
    await pool.query(
      `
        SELECT
          is_open,
          opening_time,
          closing_time,
          note
        FROM barber_date_overrides
        WHERE barber_id = $1
          AND override_date = $2
      `,
      [
        Number(barberId),
        date,
      ]
    );

  let workingHour;

  if (overrideResult.rowCount > 0) {
    const override =
      overrideResult.rows[0];

    /*
      Özel gün kapalı olarak tanımlanmışsa
      o tarihe hiçbir şekilde randevu
      oluşturulamaz.
    */
    if (!override.is_open) {
      return {
        isValid: false,
        status: 400,
        message:
          override.note ||
          "Berber seçilen tarihte çalışmıyor.",
      };
    }

    workingHour = {
      day_name: "Özel Gün",
      opening_time:
        override.opening_time,
      closing_time:
        override.closing_time,
      is_open: true,
    };
  } else {
    /*
      Özel gün kaydı yoksa haftalık çalışma
      düzenini kullanıyoruz.
    */
    const workingHoursResult =
      await pool.query(
        `
          SELECT
            day_name,
            opening_time,
            closing_time,
            is_open
          FROM barber_working_hours
          WHERE barber_id = $1
            AND day_of_week = EXTRACT(
              ISODOW FROM $2::date
            )
        `,
        [
          Number(barberId),
          date,
        ]
      );

    if (
      workingHoursResult.rowCount === 0
    ) {
      return {
        isValid: false,
        status: 404,
        message:
          "Seçilen gün için çalışma saati ayarı bulunamadı.",
      };
    }

    workingHour =
      workingHoursResult.rows[0];

    if (!workingHour.is_open) {
      return {
        isValid: false,
        status: 400,
        message:
          `${workingHour.day_name} günü berber çalışmıyor.`,
      };
    }
  }

  const openingMinutes =
    timeToMinutes(
      workingHour.opening_time
    );

  let closingMinutes =
    timeToMinutes(
      workingHour.closing_time
    );

  /*
    00:00 kapanışı gün sonu olarak
    değerlendiriyoruz.
  */
  if (
    workingHour.closing_time
      .slice(0, 5) === "00:00"
  ) {
    closingMinutes = 1440;
  }

  const selectedTimeMinutes =
    timeToMinutes(time);

  const appointmentDuration = 60;

  const startsAfterOpening =
    selectedTimeMinutes >=
    openingMinutes;

  const finishesBeforeClosing =
    selectedTimeMinutes +
      appointmentDuration <=
    closingMinutes;

  if (
    !startsAfterOpening ||
    !finishesBeforeClosing
  ) {
    return {
      isValid: false,
      status: 400,
      message:
        "Seçilen saat berberin çalışma saatleri dışındadır.",
    };
  }

  /*
    Randevular yalnızca saat başlarında
    oluşturulabiliyor.
  */
  const minutePart =
    selectedTimeMinutes % 60;

  if (minutePart !== 0) {
    return {
      isValid: false,
      status: 400,
      message:
        "Randevular yalnızca saat başlarında oluşturulabilir.",
    };
  }

  return {
    isValid: true,
  };
}

async function getAvailableTimes(barberId, date) {
  /*
    Önce seçilen berber var mı ve aktif mi
    kontrol ediyoruz.
  */
  const barberResult = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        is_active
      FROM barbers
      WHERE id = $1
    `,
    [barberId]
  );

  if (barberResult.rows.length === 0) {
    return {
      status: 404,
      message: "Seçilen berber bulunamadı.",
      availableTimes: [],
    };
  }

  const barber = barberResult.rows[0];

  if (!barber.is_active) {
    return {
      status: 400,
      message:
        "Seçilen berber şu anda randevu kabul etmiyor.",
      availableTimes: [],
    };
  }

  /*
    Önce seçilen tarih için özel gün tanımı var mı
    kontrol ediyoruz.
*/
const overrideResult = await pool.query(
    `
    SELECT
        override_date,
        is_open,
        opening_time,
        closing_time,
        note
    FROM barber_date_overrides
    WHERE barber_id = $1
      AND override_date = $2
    `,
    [barberId, date]
);

let workingHour;

if (overrideResult.rowCount > 0) {

    const override = overrideResult.rows[0];

    if (!override.is_open) {
        return {
            status: 200,
            message:
                override.note ||
                "Berber bu tarihte çalışmıyor.",
            availableTimes: [],
        };
    }

    workingHour = {
        day_name: "Özel Gün",
        opening_time: override.opening_time,
        closing_time: override.closing_time,
        is_open: true,
    };

} else {

    const workingHoursResult = await pool.query(
        `
        SELECT
            day_name,
            opening_time,
            closing_time,
            is_open
        FROM barber_working_hours
        WHERE barber_id = $1
          AND day_of_week = EXTRACT(
                ISODOW FROM $2::date
          )
        `,
        [barberId, date]
    );

    if (workingHoursResult.rowCount === 0) {
        return {
            status: 404,
            message:
                "Çalışma saati bulunamadı.",
            availableTimes: [],
        };
    }

    workingHour = workingHoursResult.rows[0];

    if (!workingHour.is_open) {
        return {
            status: 200,
            message:
                `${workingHour.day_name} günü berber kapalıdır.`,
            availableTimes: [],
        };
    }

}
  /*
    Artık yalnızca seçilen berberin
    dolu saatlerini getiriyoruz.
  */
  const bookedAppointmentsResult =
    await pool.query(
      `
        SELECT appointment_time
        FROM appointments
        WHERE appointment_date = $1
          AND barber_id = $2
      `,
      [date, barberId]
    );

  const bookedTimes =
    bookedAppointmentsResult.rows.map(
      (appointment) =>
        appointment.appointment_time.slice(0, 5)
    );

  const openingMinutes = timeToMinutes(
    workingHour.opening_time
  );

  let closingMinutes = timeToMinutes(
    workingHour.closing_time
  );

  /*
    Kapanış saati 00:00 ise bunu gün sonu,
    yani 1440 dakika olarak kabul ediyoruz.
  */
  if (
    workingHour.closing_time.slice(0, 5) ===
    "00:00"
  ) {
    closingMinutes = 1440;
  }

  const allTimes = [];

  const appointmentDuration = 60;

  for (
    let currentMinutes = openingMinutes;
    currentMinutes + appointmentDuration <=
    closingMinutes;
    currentMinutes += appointmentDuration
  ) {
    allTimes.push(
      minutesToTime(currentMinutes)
    );
  }

  const now = new Date();

  const [
    selectedYear,
    selectedMonth,
    selectedDay,
  ] = date.split("-").map(Number);

  const isToday =
    selectedYear === now.getFullYear() &&
    selectedMonth === now.getMonth() + 1 &&
    selectedDay === now.getDate();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const availableTimes = allTimes.filter(
    (time) => {
      const isBooked =
        bookedTimes.includes(time);

      const isPastTime =
        isToday &&
        timeToMinutes(time) <= currentMinutes;

      return !isBooked && !isPastTime;
    }
  );

  return {
    status: 200,
    message:
      availableTimes.length === 0
        ? `${barber.name} ${barber.surname} için bu tarihte müsait saat bulunmuyor.`
        : "",
    availableTimes,
  };
}


async function findAppointment(id, phone) {
  const result = await pool.query(
    `
      SELECT
        id,
        barber_id,
        name,
        surname,
        phone,
        appointment_date,
        appointment_time
      FROM appointments
      WHERE id = $1
        AND phone = $2
    `,
    [id, phone]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}


async function cancelCustomerAppointment(
  id,
  phone
) {
  /*
    1. Önce iptal edilecek randevuyu
    ve bağlı olduğu berberi buluyoruz.
  */
  const appointmentResult =
    await pool.query(
      `
        SELECT
          id,
          barber_id,
          name,
          surname,
          phone,
          TO_CHAR(
            appointment_date,
            'YYYY-MM-DD'
          ) AS appointment_date,
          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS appointment_time
        FROM appointments
        WHERE id = $1
          AND phone = $2
      `,
      [id, phone]
    );

  if (
    appointmentResult.rowCount === 0
  ) {
    return {
      status: 404,
      message:
        "Bu bilgilerle eşleşen bir randevu bulunamadı.",
    };
  }

  const appointment =
    appointmentResult.rows[0];

  /*
    2. Randevunun ait olduğu berberin
    WhatsApp numarasını alıyoruz.
  */
  const barberResult =
    await pool.query(
      `
        SELECT
          id,
          name,
          surname,
          whatsapp_number
        FROM barbers
        WHERE id = $1
      `,
      [appointment.barber_id]
    );

  const barber =
    barberResult.rows[0] || null;

  /*
    3. Randevuyu siliyoruz.
  */
  await pool.query(
    `
      DELETE FROM appointments
      WHERE id = $1
        AND phone = $2
    `,
    [id, phone]
  );

  /*
    4. WhatsApp bildirimi gönderiyoruz.

    WhatsApp başarısız olsa bile
    randevu iptali geçerli kalır.
  */
  try {
    if (
      barber &&
      barber.whatsapp_number
    ) {
      let barberWhatsAppNumber =
        barber.whatsapp_number.replace(
          /\D/g,
          ""
        );

      /*
        05301234567
        ->
        905301234567
      */
      if (
        barberWhatsAppNumber.startsWith(
          "0"
        )
      ) {
        barberWhatsAppNumber =
          "90" +
          barberWhatsAppNumber.slice(1);
      }

      await sendTemplateMessage(
        barberWhatsAppNumber,
        "randevu_iptal_bildirimi",
        "tr",
        [
          `${appointment.name} ${appointment.surname}`,
          appointment.id,
          appointment.appointment_date,
          appointment.appointment_time,
          appointment.phone,
        ]
      );

      console.log(
        "WhatsApp iptal bildirimi berbere gönderildi."
      );
    } else {
      console.log(
        "Berberin WhatsApp numarası tanımlı değil."
      );
    }
  } catch (error) {
    console.error(
      "WhatsApp iptal bildirimi gönderilemedi:",
      error.message
    );
  }

  return {
    status: 200,
    message:
      "Randevunuz başarıyla iptal edildi.",
    appointment,
  };
}

async function sendTomorrowAppointmentReminders() {
  const result = await pool.query(
    `
      SELECT
        appointments.id,
        appointments.barber_id,
        appointments.name,
        appointments.surname,
        appointments.phone,

        TO_CHAR(
          appointments.appointment_date,
          'YYYY-MM-DD'
        ) AS appointment_date,

        TO_CHAR(
          appointments.appointment_time,
          'HH24:MI'
        ) AS appointment_time,

        barbers.name AS barber_name,
        barbers.surname AS barber_surname

      FROM appointments

      INNER JOIN barbers
        ON barbers.id =
          appointments.barber_id

      WHERE
        appointments.appointment_date =
          CURRENT_DATE + INTERVAL '1 day'

        AND appointments.reminder_sent_at
          IS NULL

      ORDER BY
        appointments.appointment_time ASC
    `
  );

  if (result.rowCount === 0) {
    console.log(
      "Yarın için gönderilecek WhatsApp hatırlatması bulunmuyor."
    );

    return {
      status: 200,
      sentCount: 0,
    };
  }

  let sentCount = 0;

  for (
    const appointment
    of result.rows
  ) {
    try {
      let customerWhatsAppNumber =
        appointment.phone.replace(
          /\D/g,
          ""
        );

      /*
        05301234567
        ->
        905301234567
      */
      if (
        customerWhatsAppNumber.startsWith(
          "0"
        )
      ) {
        customerWhatsAppNumber =
          "90" +
          customerWhatsAppNumber.slice(1);
      }

      await sendTemplateMessage(
        customerWhatsAppNumber,
        "randevu_hatirlatma",
        "tr",
        [
          appointment.name,

          `${appointment.barber_name} ${appointment.barber_surname}`,

          appointment.id,

          appointment.appointment_date,

          appointment.appointment_time,
        ]
      );

      /*
        Mesaj başarıyla gönderildiyse
        aynı randevuya tekrar göndermemek
        için reminder_sent_at doldurulur.
      */
      await pool.query(
        `
          UPDATE appointments

          SET reminder_sent_at =
            CURRENT_TIMESTAMP

          WHERE id = $1
        `,
        [appointment.id]
      );

      sentCount += 1;

      console.log(
        `Randevu #${appointment.id} için hatırlatma gönderildi.`
      );
    } catch (error) {
      /*
        Bir müşterinin mesajı başarısız
        olursa diğer randevuların
        gönderimini durdurmuyoruz.
      */
      console.error(
        `Randevu #${appointment.id} hatırlatma mesajı gönderilemedi:`,
        error.message
      );
    }
  }

  return {
    status: 200,
    sentCount,
  };
}

module.exports = {
  getAppointments,
  getDashboardSummary,
  getAppointmentStatistics,
  getAppointmentsByDate,
  getAvailableTimes,
  createAppointment,
  deleteAppointment,
  updateAppointment,
  findAppointment,
  cancelCustomerAppointment,
  sendTomorrowAppointmentReminders,
};

