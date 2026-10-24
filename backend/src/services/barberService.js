const bcrypt = require("bcryptjs");
const pool = require("../config/db");

/*
  Aktif olan bütün berberleri getirir.

  Bu fonksiyon müşteri tarafında kullanılacak.
  Şifre ve kullanıcı adı gibi özel bilgiler
  kesinlikle müşteriye gönderilmez.
*/
async function getActiveBarbers() {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        surname
      FROM barbers
      WHERE is_active = TRUE
      ORDER BY name ASC, surname ASC
    `
  );

  return {
    status: 200,
    barbers: result.rows,
  };
}

/*
  Belirli bir berberi id bilgisiyle getirir.

  İleride:
  - müsait saat kontrolünde,
  - randevu oluştururken,
  - WhatsApp mesajı gönderirken

  bu fonksiyondan yararlanabiliriz.
*/
async function getBarberById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        phone,
        whatsapp_number,
        is_active
      FROM barbers
      WHERE id = $1
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  return {
    status: 200,
    barber: result.rows[0],
  };
}

/*
  Giriş yapan berberin kendi randevularını getirir.

  barberId URL'den alınmaz.
  JWT token içindeki doğrulanmış barberId kullanılır.
  Böylece berber başka bir berberin id değerini
  yazarak onun randevularını göremez.
*/
async function getOwnAppointments(barberId) {
  const result = await pool.query(
    `
      SELECT
        appointments.id,
        appointments.name,
        appointments.surname,
        appointments.phone,
        appointments.appointment_date,
        TO_CHAR(
          appointments.appointment_time,
          'HH24:MI'
        ) AS appointment_time,
        appointments.created_at
      FROM appointments
      WHERE appointments.barber_id = $1
        AND (
          appointments.appointment_date >
            CURRENT_DATE
          OR (
            appointments.appointment_date =
              CURRENT_DATE
            AND appointments.appointment_time >=
              CURRENT_TIME
          )
        )
      ORDER BY
        appointments.appointment_date ASC,
        appointments.appointment_time ASC
    `,
    [barberId]
  );

  return {
    status: 200,
    appointments: result.rows,
  };
}


/*
  Giriş yapan berberin haftalık çalışma
  saatlerini getirir.
*/
async function getOwnWorkingHours(barberId) {
  const result = await pool.query(
    `
      SELECT
        id,
        barber_id,
        day_of_week,
        day_name,
        TO_CHAR(opening_time, 'HH24:MI')
          AS opening_time,
        TO_CHAR(closing_time, 'HH24:MI')
          AS closing_time,
        is_open
      FROM barber_working_hours
      WHERE barber_id = $1
      ORDER BY day_of_week ASC
    `,
    [barberId]
  );

  return {
    status: 200,
    workingHours: result.rows,
  };
}

/*
  Giriş yapan berberin belirli bir çalışma
  günü ayarını günceller.

  Satırın gerçekten giriş yapan berbere ait
  olup olmadığını barber_id ile kontrol eder.
*/
async function updateOwnWorkingHours(
  barberId,
  workingHourId,
  openingTime,
  closingTime,
  isOpen
) {
  /*
    Açık günlerde başlangıç ve bitiş
    saatlerinin girilmesi zorunludur.
  */
  if (
    isOpen === true &&
    (!openingTime || !closingTime)
  ) {
    return {
      status: 400,
      message:
        "Açık günler için açılış ve kapanış saati zorunludur.",
    };
  }

  /*
    Saat biçimi HH:MM olmalıdır.
  */
  const timeRegex =
    /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    isOpen === true &&
    (!timeRegex.test(openingTime) ||
      !timeRegex.test(closingTime))
  ) {
    return {
      status: 400,
      message:
        "Saat bilgileri HH:MM biçiminde olmalıdır.",
    };
  }

  /*
    Gün kapalıysa saatleri NULL yapıyoruz.
  */
  const finalOpeningTime =
    isOpen === true ? openingTime : null;

  const finalClosingTime =
    isOpen === true ? closingTime : null;

  const result = await pool.query(
    `
      UPDATE barber_working_hours
      SET
        opening_time = $1,
        closing_time = $2,
        is_open = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
        AND barber_id = $5
      RETURNING
        id,
        barber_id,
        day_of_week,
        day_name,
        TO_CHAR(opening_time, 'HH24:MI')
          AS opening_time,
        TO_CHAR(closing_time, 'HH24:MI')
          AS closing_time,
        is_open
    `,
    [
      finalOpeningTime,
      finalClosingTime,
      isOpen,
      workingHourId,
      barberId,
    ]
  );

  /*
    Satır bulunmadıysa çalışma günü ya yoktur
    ya da başka bir berbere aittir.
  */
  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Çalışma günü ayarı bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      `${result.rows[0].day_name} çalışma saatleri güncellendi.`,
    workingHour: result.rows[0],
  };
}


/*
  Giriş yapan berberin kendi hesap
  bilgilerini getirir.

  Şifre hash değeri kesinlikle frontend'e
  gönderilmez.
*/
async function getOwnProfile(barberId) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        phone,
        whatsapp_number,
        username,
        is_active,
        must_change_password
      FROM barbers
      WHERE id = $1
        AND is_active = TRUE
    `,
    [barberId]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Aktif berber hesabı bulunamadı.",
    };
  }

  return {
    status: 200,
    barber: result.rows[0],
  };
}

/*
  Giriş yapan berberin kendi profil
  bilgilerini günceller.
*/
async function updateOwnProfile(
  barberId,
  name,
  surname,
  phone,
  whatsappNumber,
  username
)
{
  /*
    Ad, soyad, telefon ve WhatsApp numarası
    zorunludur.
  */
if (
  !name?.trim() ||
  !surname?.trim() ||
  !phone ||
  !whatsappNumber ||
  !username?.trim()
) {
  return {
    status: 400,
    message:
      "Lütfen tüm hesap bilgilerini doldurun.",
  };
}

const normalizedUsername =
  username.trim().toLowerCase();

if (
  !/^[a-z0-9._-]{3,30}$/.test(
    normalizedUsername
  )
) {
  return {
    status: 400,
    message:
      "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir.",
  };
}

const usernameResult = await pool.query(
  `
    SELECT id
    FROM barbers
    WHERE LOWER(username) = LOWER($1)
      AND id <> $2

    UNION ALL

    SELECT id
    FROM admins
    WHERE LOWER(username) = LOWER($1)

    LIMIT 1
  `,
  [normalizedUsername, barberId]
);

if (usernameResult.rowCount > 0) {
  return {
    status: 409,
    message:
      "Bu kullanıcı adı zaten kullanılıyor.",
  };
}

  /*
    Normal telefon numarası:

    0 ile başlamalı
    11 haneli olmalı
  */
  const phoneRegex = /^0\d{10}$/;

  if (!phoneRegex.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  /*
    WhatsApp numarası uluslararası biçimde
    tutulur.

    Örnek:
    905304785290
  */
  const whatsappRegex = /^90\d{10}$/;

  if (!whatsappRegex.test(whatsappNumber)) {
    return {
      status: 400,
      message:
        "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır.",
    };
  }

  const result = await pool.query(
  `
    UPDATE barbers
    SET
      name = $1,
      surname = $2,
      phone = $3,
      whatsapp_number = $4,
      username = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
      AND is_active = TRUE
    RETURNING
      id,
      name,
      surname,
      phone,
      whatsapp_number,
      username,
      is_active,
      must_change_password
  `,
  [
    name.trim(),
    surname.trim(),
    phone,
    whatsappNumber,
    normalizedUsername,
    barberId,
  ]
);

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Aktif berber hesabı bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      "Hesap bilgileriniz başarıyla güncellendi.",
    barber: result.rows[0],
  };
}


/*
  Süper yöneticinin bütün berberleri
  görüntülemesini sağlar.

  Aktif ve pasif hesapların tamamını getirir.
  Şifre hash değeri kesinlikle döndürülmez.
*/
async function getAllBarbersForAdmin() {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        phone,
        whatsapp_number,
        username,
        role,
        is_active,
        must_change_password,
        created_at,
        updated_at
      FROM barbers
      ORDER BY
        is_active DESC,
        name ASC,
        surname ASC
    `
  );

  return {
    status: 200,
    barbers: result.rows,
  };
}

/*
  Süper yöneticinin yeni bir berber hesabı
  oluşturmasını sağlar.

  Berber kaydı ve çalışma saatleri aynı
  transaction içinde oluşturulur.

  Herhangi bir işlem başarısız olursa
  bütün işlemler geri alınır.
*/
async function createBarberForAdmin(barberData) {
  const {
    name,
    surname,
    phone,
    whatsappNumber,
    username,
    temporaryPassword,
  } = barberData;

  // 1. Zorunlu alan kontrolü
  if (
    !name?.trim() ||
    !surname?.trim() ||
    !phone ||
    !whatsappNumber ||
    !username?.trim() ||
    !temporaryPassword
  ) {
    return {
      status: 400,
      message:
        "Lütfen bütün berber bilgilerini doldurun.",
    };
  }

  // 2. Telefon numarası kontrolü
  if (!/^0\d{10}$/.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  // 3. WhatsApp numarası kontrolü
  if (!/^90\d{10}$/.test(whatsappNumber)) {
    return {
      status: 400,
      message:
        "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır.",
    };
  }

  // 4. Kullanıcı adı kontrolü
  const normalizedUsername =
    username.trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return {
      status: 400,
      message:
        "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir.",
    };
  }

  // 5. Geçici şifre kontrolü
  if (temporaryPassword.length < 8) {
    return {
      status: 400,
      message:
        "Geçici şifre en az 8 karakter olmalıdır.",
    };
  }

  /*
    Kullanıcı adı hem admins hem barbers
    tablosunda kontrol edilir.

    Böylece admin ile berber aynı kullanıcı
    adını kullanamaz.
  */
  const usernameResult = await pool.query(
    `
      SELECT username
      FROM admins
      WHERE LOWER(username) = LOWER($1)

      UNION ALL

      SELECT username
      FROM barbers
      WHERE LOWER(username) = LOWER($1)

      LIMIT 1
    `,
    [normalizedUsername]
  );

  if (usernameResult.rowCount > 0) {
    return {
      status: 409,
      message:
        "Bu kullanıcı adı zaten kullanılıyor.",
    };
  }

  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    10
  );

  /*
    Aynı veritabanı bağlantısı üzerinde
    transaction kullanıyoruz.
  */
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /*
      Önce berber hesabı oluşturulur.
    */
    const barberResult = await client.query(
      `
        INSERT INTO barbers (
          name,
          surname,
          phone,
          whatsapp_number,
          username,
          password_hash,
          role,
          is_active,
          must_change_password
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'barber',
          TRUE,
          TRUE
        )
        RETURNING
          id,
          name,
          surname,
          phone,
          whatsapp_number,
          username,
          role,
          is_active,
          must_change_password,
          created_at,
          updated_at
      `,
      [
        name.trim(),
        surname.trim(),
        phone,
        whatsappNumber,
        normalizedUsername,
        passwordHash,
      ]
    );

    const createdBarber =
      barberResult.rows[0];

    /*
      Yeni berber için yedi günlük çalışma
      planı otomatik oluşturulur.

      Başlangıçta:
      Pazartesi-Cumartesi açık
      Pazar kapalı

      Açık günler 09:00-18:00 olarak tanımlanır.
    */
    await client.query(
      `
        INSERT INTO barber_working_hours (
          barber_id,
          day_of_week,
          day_name,
          opening_time,
          closing_time,
          is_open
        )
        VALUES
          ($1, 1, 'Pazartesi', '09:00', '18:00', TRUE),
          ($1, 2, 'Salı', '09:00', '18:00', TRUE),
          ($1, 3, 'Çarşamba', '09:00', '18:00', TRUE),
          ($1, 4, 'Perşembe', '09:00', '18:00', TRUE),
          ($1, 5, 'Cuma', '09:00', '18:00', TRUE),
          ($1, 6, 'Cumartesi', '09:00', '18:00', TRUE),
          ($1, 7, 'Pazar', NULL, NULL, FALSE)
      `,
      [createdBarber.id]
    );

    await client.query("COMMIT");

    return {
      status: 201,
      message:
        "Yeni berber hesabı başarıyla oluşturuldu.",
      barber: createdBarber,

      /*
        Geçici şifre yalnızca bu cevapta
        gösterilir; veritabanında açık şekilde
        tutulmaz.
      */
      temporaryPassword,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    /*
      PostgreSQL UNIQUE ihlali.
    */
    if (error.code === "23505") {
      return {
        status: 409,
        message:
          "Bu kullanıcı adı zaten kullanılıyor.",
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

async function updateBarberForAdmin(id, barberData) {
  const {
    name,
    surname,
    phone,
    whatsappNumber,
    username,
  } = barberData;

  if (
    !name?.trim() ||
    !surname?.trim() ||
    !phone ||
    !whatsappNumber ||
    !username?.trim()
  ) {
    return {
      status: 400,
      message: "Lütfen bütün alanları doldurun.",
    };
  }

  if (!/^0\d{10}$/.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  if (!/^90\d{10}$/.test(whatsappNumber)) {
    return {
      status: 400,
      message:
        "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır.",
    };
  }

  const normalizedUsername =
    username.trim().toLowerCase();

  const usernameResult = await pool.query(
    `
      SELECT id
      FROM barbers
      WHERE LOWER(username)=LOWER($1)
        AND id<>$2

      UNION

      SELECT id
      FROM admins
      WHERE LOWER(username)=LOWER($1)
    `,
    [normalizedUsername, id]
  );

  if (usernameResult.rowCount > 0) {
    return {
      status: 409,
      message:
        "Bu kullanıcı adı kullanılmaktadır.",
    };
  }

  const result = await pool.query(
    `
      UPDATE barbers
      SET
        name=$1,
        surname=$2,
        phone=$3,
        whatsapp_number=$4,
        username=$5,
        updated_at=NOW()
      WHERE id=$6
      RETURNING
        id,
        name,
        surname,
        phone,
        whatsapp_number,
        username,
        role,
        is_active,
        must_change_password,
        created_at,
        updated_at
    `,
    [
      name.trim(),
      surname.trim(),
      phone,
      whatsappNumber,
      normalizedUsername,
      id,
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      "Berber bilgileri başarıyla güncellendi.",
    barber: result.rows[0],
  };
}

async function updateBarberStatusForAdmin(
  barberId,
  isActive
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      status: 400,
      message: "Geçerli bir berber numarası giriniz.",
    };
  }

  if (typeof isActive !== "boolean") {
    return {
      status: 400,
      message:
        "Aktiflik durumu true veya false olmalıdır.",
    };
  }

  const result = await pool.query(
    `
      UPDATE barbers
      SET
        is_active = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        surname,
        phone,
        whatsapp_number,
        username,
        role,
        is_active,
        must_change_password,
        created_at,
        updated_at
    `,
    [isActive, Number(barberId)]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  return {
    status: 200,
    message: isActive
      ? "Berber hesabı başarıyla aktif yapıldı."
      : "Berber hesabı başarıyla pasif yapıldı.",
    barber: result.rows[0],
  };
}

async function resetBarberPasswordForAdmin(
  barberId,
  temporaryPassword
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir berber numarası giriniz.",
    };
  }

  if (!temporaryPassword) {
    return {
      status: 400,
      message:
        "Geçici şifre zorunludur.",
    };
  }

  if (temporaryPassword.length < 8) {
    return {
      status: 400,
      message:
        "Geçici şifre en az 8 karakter olmalıdır.",
    };
  }

  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    10
  );

  const result = await pool.query(
    `
      UPDATE barbers
      SET
        password_hash = $1,
        must_change_password = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        surname,
        username,
        is_active,
        must_change_password,
        updated_at
    `,
    [
      passwordHash,
      Number(barberId),
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      "Berber şifresi başarıyla sıfırlandı.",
    barber: result.rows[0],
    temporaryPassword,
  };
}

async function getBarberAppointmentsForAdmin(
  barberId
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir berber numarası giriniz.",
    };
  }

  const barberResult = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        username,
        is_active
      FROM barbers
      WHERE id = $1
    `,
    [Number(barberId)]
  );

  if (barberResult.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  const appointmentsResult = await pool.query(
    `
      SELECT
        id,
        barber_id,
        name,
        surname,
        phone,
        appointment_date,
        TO_CHAR(
          appointment_time,
          'HH24:MI'
        ) AS appointment_time,
        created_at
      FROM appointments
      WHERE barber_id = $1
      ORDER BY
        appointment_date ASC,
        appointment_time ASC
    `,
    [Number(barberId)]
  );

  return {
    status: 200,
    barber: barberResult.rows[0],
    appointments:
      appointmentsResult.rows,
  };
}

async function getBarberWorkingHoursForAdmin(
  barberId
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir berber numarası giriniz.",
    };
  }

  const barberResult = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        username,
        is_active
      FROM barbers
      WHERE id = $1
    `,
    [Number(barberId)]
  );

  if (barberResult.rowCount === 0) {
    return {
      status: 404,
      message: "Berber bulunamadı.",
    };
  }

  const workingHoursResult = await pool.query(
    `
      SELECT
        id,
        barber_id,
        day_of_week,
        day_name,
        TO_CHAR(
          opening_time,
          'HH24:MI'
        ) AS opening_time,
        TO_CHAR(
          closing_time,
          'HH24:MI'
        ) AS closing_time,
        is_open
      FROM barber_working_hours
      WHERE barber_id = $1
      ORDER BY day_of_week ASC
    `,
    [Number(barberId)]
  );

  return {
    status: 200,
    barber: barberResult.rows[0],
    workingHours: workingHoursResult.rows,
  };
}

async function updateBarberWorkingHourForAdmin(
  barberId,
  workingHourId,
  openingTime,
  closingTime,
  isOpen
) {
  if (
    !Number.isInteger(Number(barberId)) ||
    Number(barberId) <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir berber numarası giriniz.",
    };
  }

  if (
    !Number.isInteger(Number(workingHourId)) ||
    Number(workingHourId) <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir çalışma günü numarası giriniz.",
    };
  }

  if (typeof isOpen !== "boolean") {
    return {
      status: 400,
      message:
        "Açık veya kapalı bilgisi geçersiz.",
    };
  }

  const timeRegex =
    /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    isOpen &&
    (!openingTime || !closingTime)
  ) {
    return {
      status: 400,
      message:
        "Açık günlerde açılış ve kapanış saatleri zorunludur.",
    };
  }

  if (
    isOpen &&
    (!timeRegex.test(openingTime) ||
      !timeRegex.test(closingTime))
  ) {
    return {
      status: 400,
      message:
        "Saat bilgileri HH:MM biçiminde olmalıdır.",
    };
  }

  const finalOpeningTime = isOpen
    ? openingTime
    : null;

  const finalClosingTime = isOpen
    ? closingTime
    : null;

  const result = await pool.query(
    `
      UPDATE barber_working_hours
      SET
        opening_time = $1,
        closing_time = $2,
        is_open = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
        AND barber_id = $5
      RETURNING
        id,
        barber_id,
        day_of_week,
        day_name,
        TO_CHAR(
          opening_time,
          'HH24:MI'
        ) AS opening_time,
        TO_CHAR(
          closing_time,
          'HH24:MI'
        ) AS closing_time,
        is_open
    `,
    [
      finalOpeningTime,
      finalClosingTime,
      isOpen,
      Number(workingHourId),
      Number(barberId),
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Bu berbere ait çalışma günü bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      `${result.rows[0].day_name} çalışma saatleri güncellendi.`,
    workingHour: result.rows[0],
  };
}

async function deleteOwnAppointment(
  barberId,
  appointmentId
) {
  const normalizedAppointmentId =
    Number(appointmentId);

  if (
    !Number.isInteger(
      normalizedAppointmentId
    ) ||
    normalizedAppointmentId <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir randevu numarası giriniz.",
    };
  }

  /*
    Randevu yalnızca giriş yapan berbere
    aitse silinir.

    Böylece başka bir berberin randevusu
    silinemez.
  */
  const result = await pool.query(
    `
      DELETE FROM appointments
      WHERE id = $1
        AND barber_id = $2
      RETURNING
        id,
        barber_id,
        name,
        surname,
        phone,
        appointment_date,
        TO_CHAR(
          appointment_time,
          'HH24:MI'
        ) AS appointment_time
    `,
    [
      normalizedAppointmentId,
      barberId,
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Randevu bulunamadı veya bu randevuyu silme yetkiniz yok.",
    };
  }

  return {
    status: 200,
    message:
      "Randevu başarıyla iptal edildi.",
    appointment: result.rows[0],
  };
}

async function updateOwnAppointment(
  barberId,
  appointmentId,
  appointmentData
) {
  const normalizedAppointmentId =
    Number(appointmentId);

  if (
    !Number.isInteger(normalizedAppointmentId) ||
    normalizedAppointmentId <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir randevu numarası giriniz.",
    };
  }

  const {
    name,
    surname,
    phone,
    date,
    time,
  } = appointmentData;

  if (
    !name?.trim() ||
    !surname?.trim() ||
    !phone ||
    !date ||
    !time
  ) {
    return {
      status: 400,
      message:
        "Lütfen bütün randevu bilgilerini doldurun.",
    };
  }

  if (!/^0\d{10}$/.test(phone)) {
    return {
      status: 400,
      message:
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır.",
    };
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return {
      status: 400,
      message:
        "Randevu tarihi YYYY-MM-DD biçiminde olmalıdır.",
    };
  }

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return {
      status: 400,
      message:
        "Randevu saati HH:MM biçiminde olmalıdır.",
    };
  }

  /*
    Önce randevunun gerçekten giriş yapan
    berbere ait olup olmadığını kontrol ediyoruz.
  */
  const appointmentResult =
    await pool.query(
      `
        SELECT
          id,
          barber_id,
          appointment_date,
          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS appointment_time
        FROM appointments
        WHERE id = $1
          AND barber_id = $2
      `,
      [
        normalizedAppointmentId,
        barberId,
      ]
    );

  if (
    appointmentResult.rowCount === 0
  ) {
    return {
      status: 404,
      message:
        "Randevu bulunamadı veya bu randevuyu düzenleme yetkiniz yok.",
    };
  }

  /*
    Geçmiş tarihe randevu alınmasını
    backend tarafında da engelliyoruz.
  */
  const dateControlResult =
    await pool.query(
      `
        SELECT
          $1::date < CURRENT_DATE
            AS is_past
      `,
      [date]
    );

  if (
    dateControlResult.rows[0].is_past
  ) {
    return {
      status: 400,
      message:
        "Geçmiş bir tarihe randevu oluşturulamaz.",
    };
  }

  /*
    JavaScript'te getDay():
    Pazar = 0
    Pazartesi = 1
    ...
    Cumartesi = 6

    Veritabanında sende:
    Pazartesi = 1
    ...
    Pazar = 7

    PostgreSQL EXTRACT(DOW) pazar için 0
    verdiğinden pazar gününü 7'ye çeviriyoruz.
  */
  const workingHourResult =
    await pool.query(
      `
        SELECT
          id,
          day_name,
          opening_time,
          closing_time,
          is_open
        FROM barber_working_hours
        WHERE barber_id = $1
          AND day_of_week = (
            CASE
              WHEN EXTRACT(
                DOW FROM $2::date
              ) = 0
              THEN 7
              ELSE EXTRACT(
                DOW FROM $2::date
              )::integer
            END
          )
      `,
      [barberId, date]
    );

  if (
    workingHourResult.rowCount === 0
  ) {
    return {
      status: 404,
      message:
        "Seçilen gün için çalışma saati ayarı bulunamadı.",
    };
  }

  const workingHour =
    workingHourResult.rows[0];

  if (!workingHour.is_open) {
    return {
      status: 400,
      message:
        `${workingHour.day_name} günü çalışmaya kapalıdır.`,
    };
  }

  /*
    Seçilen saat açılıştan önce veya
    kapanıştan sonra olamaz.

    Kapanış saati randevu başlangıç saati
    olarak kullanılamaz.
  */
  const timeControlResult =
    await pool.query(
      `
        SELECT
          (
            $1::time >= $2::time
            AND
            $1::time < $3::time
          ) AS is_valid
      `,
      [
        time,
        workingHour.opening_time,
        workingHour.closing_time,
      ]
    );

  if (
    !timeControlResult.rows[0].is_valid
  ) {
    return {
      status: 400,
      message:
        `Seçilen saat ${workingHour.day_name} çalışma saatleri dışındadır.`,
    };
  }

  /*
    Aynı berberde, aynı tarih ve saatte
    başka randevu bulunup bulunmadığını
    kontrol ediyoruz.

    Düzenlenen randevunun kendi id değeri
    bu kontrolden hariç tutulur.
  */
  const conflictResult =
    await pool.query(
      `
        SELECT id
        FROM appointments
        WHERE barber_id = $1
          AND appointment_date = $2
          AND appointment_time = $3
          AND id <> $4
        LIMIT 1
      `,
      [
        barberId,
        date,
        time,
        normalizedAppointmentId,
      ]
    );

  if (conflictResult.rowCount > 0) {
    return {
      status: 409,
      message:
        "Seçilen tarih ve saatte başka bir randevu bulunmaktadır.",
    };
  }

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
          AND barber_id = $7
        RETURNING
          id,
          barber_id,
          name,
          surname,
          phone,
          appointment_date,
          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS appointment_time,
          created_at
      `,
      [
        name.trim(),
        surname.trim(),
        phone,
        date,
        time,
        normalizedAppointmentId,
        barberId,
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

async function getOwnDateOverrides(
  barberId
) {
  const result = await pool.query(
    `
      SELECT
        id,
        barber_id,
        TO_CHAR(
          override_date,
          'YYYY-MM-DD'
        ) AS override_date,
        is_open,
        TO_CHAR(
          opening_time,
          'HH24:MI'
        ) AS opening_time,
        TO_CHAR(
          closing_time,
          'HH24:MI'
        ) AS closing_time,
        note,
        created_at,
        updated_at
      FROM barber_date_overrides
      WHERE barber_id = $1
        AND override_date >= CURRENT_DATE
      ORDER BY override_date ASC
    `,
    [barberId]
  );

  return {
    status: 200,
    dateOverrides: result.rows,
  };
}

async function validateDateOverride(
  barberId,
  overrideData,
  ignoredOverrideId = null
) {
  const {
    overrideDate,
    isOpen,
    openingTime,
    closingTime,
    note,
  } = overrideData;

  if (
    !overrideDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      overrideDate
    )
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "Özel gün tarihi YYYY-MM-DD biçiminde olmalıdır.",
    };
  }

  if (typeof isOpen !== "boolean") {
    return {
      valid: false,
      status: 400,
      message:
        "Günün açık veya kapalı durumu geçersiz.",
    };
  }

  const dateControlResult =
    await pool.query(
      `
        SELECT
          $1::date < CURRENT_DATE
            AS is_past
      `,
      [overrideDate]
    );

  if (
    dateControlResult.rows[0].is_past
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "Geçmiş bir tarih için özel gün ayarı oluşturulamaz.",
    };
  }

  const timeRegex =
    /^([01]\d|2[0-3]):[0-5]\d$/;

  if (isOpen) {
    if (!openingTime || !closingTime) {
      return {
        valid: false,
        status: 400,
        message:
          "Açık özel günlerde açılış ve kapanış saatleri zorunludur.",
      };
    }

    if (
      !timeRegex.test(openingTime) ||
      !timeRegex.test(closingTime)
    ) {
      return {
        valid: false,
        status: 400,
        message:
          "Saat bilgileri HH:MM biçiminde olmalıdır.",
      };
    }

    const timeControlResult =
      await pool.query(
        `
          SELECT
            $1::time < $2::time
              AS is_valid
        `,
        [
          openingTime,
          closingTime,
        ]
      );

    if (
      !timeControlResult.rows[0]
        .is_valid
    ) {
      return {
        valid: false,
        status: 400,
        message:
          "Açılış saati kapanış saatinden önce olmalıdır.",
      };
    }
  }

  if (
    note &&
    note.trim().length > 150
  ) {
    return {
      valid: false,
      status: 400,
      message:
        "Açıklama en fazla 150 karakter olabilir.",
    };
  }

  /*
    Aynı tarih için başka bir özel gün
    kaydı bulunuyor mu?
  */
  const duplicateResult =
    await pool.query(
      `
        SELECT id
        FROM barber_date_overrides
        WHERE barber_id = $1
          AND override_date = $2
          AND (
            $3::integer IS NULL
            OR id <> $3
          )
        LIMIT 1
      `,
      [
        barberId,
        overrideDate,
        ignoredOverrideId,
      ]
    );

  if (duplicateResult.rowCount > 0) {
    return {
      valid: false,
      status: 409,
      message:
        "Bu tarih için zaten bir özel gün ayarı bulunmaktadır.",
    };
  }

  /*
    O tarihte mevcut randevular var mı?
  */
  const appointmentResult =
    await pool.query(
      `
        SELECT
          id,
          name,
          surname,
          TO_CHAR(
            appointment_time,
            'HH24:MI'
          ) AS appointment_time
        FROM appointments
        WHERE barber_id = $1
          AND appointment_date = $2
        ORDER BY appointment_time ASC
      `,
      [
        barberId,
        overrideDate,
      ]
    );

  /*
    Gün tamamen kapatılıyorsa mevcut
    randevu bulunmasına izin vermiyoruz.
  */
  if (
    !isOpen &&
    appointmentResult.rowCount > 0
  ) {
    return {
      valid: false,
      status: 409,
      message:
        `Bu tarihte ${appointmentResult.rowCount} randevu bulunduğu için gün kapatılamaz. Önce randevuları düzenleyin veya iptal edin.`,
    };
  }

  /*
    Gün açık fakat saatleri değişiyorsa,
    yeni çalışma aralığının dışında kalan
    mevcut randevuları kontrol ediyoruz.
  */
  if (
    isOpen &&
    appointmentResult.rowCount > 0
  ) {
    const invalidAppointments =
      appointmentResult.rows.filter(
        (appointment) =>
          appointment.appointment_time <
            openingTime ||
          appointment.appointment_time >=
            closingTime
      );

    if (
      invalidAppointments.length > 0
    ) {
      const invalidTimes =
        invalidAppointments
          .map(
            (appointment) =>
              appointment.appointment_time
          )
          .join(", ");

      return {
        valid: false,
        status: 409,
        message:
          `Yeni çalışma saatlerinin dışında kalan randevular bulunmaktadır: ${invalidTimes}. Önce bu randevuları düzenleyin veya iptal edin.`,
      };
    }
  }

  return {
    valid: true,
    finalOpeningTime: isOpen
      ? openingTime
      : null,
    finalClosingTime: isOpen
      ? closingTime
      : null,
    finalNote: note?.trim() || null,
  };
}

async function createOwnDateOverride(
  barberId,
  overrideData
) {
  const validation =
    await validateDateOverride(
      barberId,
      overrideData
    );

  if (!validation.valid) {
    return {
      status: validation.status,
      message: validation.message,
    };
  }

  const result = await pool.query(
    `
      INSERT INTO barber_date_overrides (
        barber_id,
        override_date,
        is_open,
        opening_time,
        closing_time,
        note
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING
        id,
        barber_id,
        TO_CHAR(
          override_date,
          'YYYY-MM-DD'
        ) AS override_date,
        is_open,
        TO_CHAR(
          opening_time,
          'HH24:MI'
        ) AS opening_time,
        TO_CHAR(
          closing_time,
          'HH24:MI'
        ) AS closing_time,
        note,
        created_at,
        updated_at
    `,
    [
      barberId,
      overrideData.overrideDate,
      overrideData.isOpen,
      validation.finalOpeningTime,
      validation.finalClosingTime,
      validation.finalNote,
    ]
  );

  return {
    status: 201,
    message: overrideData.isOpen
      ? "Özel çalışma günü başarıyla oluşturuldu."
      : "İzin günü başarıyla oluşturuldu.",
    dateOverride: result.rows[0],
  };
}

async function updateOwnDateOverride(
  barberId,
  overrideId,
  overrideData
) {
  const normalizedOverrideId =
    Number(overrideId);

  if (
    !Number.isInteger(
      normalizedOverrideId
    ) ||
    normalizedOverrideId <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir özel gün numarası giriniz.",
    };
  }

  const existingResult =
    await pool.query(
      `
        SELECT id
        FROM barber_date_overrides
        WHERE id = $1
          AND barber_id = $2
      `,
      [
        normalizedOverrideId,
        barberId,
      ]
    );

  if (existingResult.rowCount === 0) {
    return {
      status: 404,
      message:
        "Özel gün ayarı bulunamadı veya bu kaydı düzenleme yetkiniz yok.",
    };
  }

  const validation =
    await validateDateOverride(
      barberId,
      overrideData,
      normalizedOverrideId
    );

  if (!validation.valid) {
    return {
      status: validation.status,
      message: validation.message,
    };
  }

  const result = await pool.query(
    `
      UPDATE barber_date_overrides
      SET
        override_date = $1,
        is_open = $2,
        opening_time = $3,
        closing_time = $4,
        note = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
        AND barber_id = $7
      RETURNING
        id,
        barber_id,
        TO_CHAR(
          override_date,
          'YYYY-MM-DD'
        ) AS override_date,
        is_open,
        TO_CHAR(
          opening_time,
          'HH24:MI'
        ) AS opening_time,
        TO_CHAR(
          closing_time,
          'HH24:MI'
        ) AS closing_time,
        note,
        created_at,
        updated_at
    `,
    [
      overrideData.overrideDate,
      overrideData.isOpen,
      validation.finalOpeningTime,
      validation.finalClosingTime,
      validation.finalNote,
      normalizedOverrideId,
      barberId,
    ]
  );

  return {
    status: 200,
    message:
      "Özel gün ayarı başarıyla güncellendi.",
    dateOverride: result.rows[0],
  };
}

async function deleteOwnDateOverride(
  barberId,
  overrideId
) {
  const normalizedOverrideId =
    Number(overrideId);

  if (
    !Number.isInteger(
      normalizedOverrideId
    ) ||
    normalizedOverrideId <= 0
  ) {
    return {
      status: 400,
      message:
        "Geçerli bir özel gün numarası giriniz.",
    };
  }

  const result = await pool.query(
    `
      DELETE FROM barber_date_overrides
      WHERE id = $1
        AND barber_id = $2
      RETURNING
        id,
        TO_CHAR(
          override_date,
          'YYYY-MM-DD'
        ) AS override_date,
        is_open,
        note
    `,
    [
      normalizedOverrideId,
      barberId,
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Özel gün ayarı bulunamadı veya bu kaydı silme yetkiniz yok.",
    };
  }

  return {
    status: 200,
    message:
      "Özel gün ayarı kaldırıldı. Bu tarih yeniden haftalık çalışma düzenine göre hesaplanacak.",
    dateOverride: result.rows[0],
  };
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
  deleteOwnAppointment,
  updateOwnAppointment,
  getOwnDateOverrides,
  createOwnDateOverride,
  updateOwnDateOverride,
  deleteOwnDateOverride,
};