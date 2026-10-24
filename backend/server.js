const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const appointmentService = require(
  "./src/services/appointmentService"
);

const appointmentRoutes = require(
  "./src/routes/appointmentRoutes"
);

const workingHoursRoutes = require(
  "./src/routes/workingHoursRoutes"
);

const authRoutes = require(
  "./src/routes/authRoutes"
);

const barberRoutes = require(
  "./src/routes/barberRoutes"
);


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Formen Kuaför API çalışıyor.");
});

app.use(
  "/appointments",
  appointmentRoutes
);

app.use(
  "/working-hours",
  workingHoursRoutes
);

app.use("/auth", authRoutes);

app.use("/barbers", barberRoutes);

const PORT = 3000;

/*
  Her gün saat 10:00'da yarının
  randevularını kontrol eder ve daha önce
  hatırlatma gönderilmemiş müşterilere
  WhatsApp mesajı gönderir.

  Türkiye saat dilimi özellikle belirtilmiştir.
*/
cron.schedule(
  "0 10 * * *",
  async () => {
    console.log(
      "Günlük WhatsApp hatırlatma kontrolü başladı..."
    );

    try {
      const result =
        await appointmentService
          .sendTomorrowAppointmentReminders();

      console.log(
        `Hatırlatma kontrolü tamamlandı. Gönderilen mesaj: ${result.sentCount}`
      );
    } catch (error) {
      console.error(
        "Otomatik hatırlatma görevi sırasında hata oluştu:",
        error
      );
    }
  },
  {
    timezone: "Europe/Istanbul",
    noOverlap: true,
  }
);

app.listen(PORT, () => {
  console.log(
    `Sunucu çalışıyor: http://localhost:${PORT}`
  );
});