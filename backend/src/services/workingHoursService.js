const pool = require("../config/db");

function timeToMinutes(time) {
  const [hour, minute] = time
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

async function getWorkingHours() {
  const result = await pool.query(`
    SELECT
      id,
      day_of_week,
      day_name,
      opening_time,
      closing_time,
      is_open
    FROM working_hours
    ORDER BY day_of_week
  `);

  return result.rows;
}

async function updateWorkingHours(
  id,
  openingTime,
  closingTime,
  isOpen
) {
  const existingResult = await pool.query(
    `
      SELECT id
      FROM working_hours
      WHERE id = $1
    `,
    [id]
  );

  if (existingResult.rows.length === 0) {
    return {
      status: 404,
      message: "Çalışma günü bulunamadı.",
    };
  }

  let finalOpeningTime = openingTime;
  let finalClosingTime = closingTime;

  // Gün kapalıysa saat bilgilerini null olarak kaydet.
  if (!isOpen) {
    finalOpeningTime = null;
    finalClosingTime = null;
  }

  // Gün açıksa saatler zorunludur.
  if (isOpen) {
    if (!openingTime || !closingTime) {
      return {
        status: 400,
        message:
          "Açık günler için açılış ve kapanış saatlerini seçiniz.",
      };
    }

    const openingMinutes =
      timeToMinutes(openingTime);

    let closingMinutes =
      timeToMinutes(closingTime);

    /*
      00:00 normalde 0 dakika olarak hesaplanır.

      Fakat kapanış saati olarak seçildiğinde
      bunu ertesi günün gece yarısı kabul ediyoruz.

      24 × 60 = 1440 dakika
    */
    if (closingTime.slice(0, 5) === "00:00") {
      closingMinutes = 1440;
    }

    if (closingMinutes <= openingMinutes) {
      return {
        status: 400,
        message:
          "Kapanış saati açılış saatinden sonra olmalıdır.",
      };
    }
  }

  const result = await pool.query(
    `
      UPDATE working_hours
      SET
        opening_time = $1,
        closing_time = $2,
        is_open = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING
        id,
        day_of_week,
        day_name,
        opening_time,
        closing_time,
        is_open
    `,
    [
      finalOpeningTime,
      finalClosingTime,
      isOpen,
      id,
    ]
  );

  return {
    status: 200,
    message:
      "Çalışma saatleri başarıyla güncellendi.",
    workingHour: result.rows[0],
  };
}

module.exports = {
  getWorkingHours,
  updateWorkingHours,
};