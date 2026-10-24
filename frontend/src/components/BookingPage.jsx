import { useEffect, useState } from "react";

function BookingPage({
  onManageAppointment,
  onGoHome,
}) {
  /*
    Backend'den gelen aktif berberleri tutar.
  */
  const [barbers, setBarbers] = useState([]);

  /*
    Kullanıcının seçtiği berberin id değeridir.
  */
  const [selectedBarberId, setSelectedBarberId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [availableTimes, setAvailableTimes] =
    useState([]);

  const [message, setMessage] = useState("");

  const [selectedTime, setSelectedTime] =
    useState("");

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [
    createdAppointment,
    setCreatedAppointment,
  ] = useState(null);

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  /*
    BookingPage ilk açıldığında aktif berberleri
    backend'den getiriyoruz.
  */
  useEffect(() => {
    fetchBarbers();
  }, []);

  async function fetchBarbers() {
    try {
      setMessage("Berberler yükleniyor...");

      const response = await fetch(
        "http://localhost:3000/barbers"
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Berberler alınamadı."
        );

        setBarbers([]);
        return;
      }

      const barberList = Array.isArray(
        data.barbers
      )
        ? data.barbers
        : [];

      setBarbers(barberList);

      if (barberList.length === 0) {
        setMessage(
          "Şu anda randevu alınabilecek aktif bir berber bulunmuyor."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error(
        "Berberleri getirme hatası:",
        error
      );

      setMessage("Sunucuya bağlanılamadı.");
      setBarbers([]);
    }
  }

  async function fetchAvailableTimes() {
    if (!selectedBarberId) {
      setMessage("Lütfen önce bir berber seçin.");
      setAvailableTimes([]);
      return;
    }

    if (!selectedDate) {
      setMessage("Lütfen bir tarih seçin.");
      setAvailableTimes([]);
      return;
    }

    try {
      setMessage("Müsait saatler yükleniyor...");

      const response = await fetch(
        `http://localhost:3000/appointments/available/${selectedBarberId}/${selectedDate}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Müsait saatler alınamadı."
        );

        setAvailableTimes([]);
        return;
      }

      const times = Array.isArray(
        data.availableTimes
      )
        ? data.availableTimes
        : [];

      setAvailableTimes(times);
      setSelectedTime("");

      if (times.length === 0) {
        setMessage(
          data.message ||
            "Bu tarihte müsait saat bulunmuyor."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("Bağlantı hatası:", error);

      setMessage("Sunucuya bağlanılamadı.");
      setAvailableTimes([]);
    }
  }

  async function createAppointment() {
    if (
      !selectedBarberId ||
      !selectedDate ||
      !selectedTime ||
      !name.trim() ||
      !surname.trim() ||
      !phone
    ) {
      setMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    if (!/^0\d{10}$/.test(phone)) {
      setMessage(
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
      );
      return;
    }

    try {
      setMessage("Randevu oluşturuluyor...");

      const response = await fetch(
        "http://localhost:3000/appointments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            barberId: Number(selectedBarberId),
            name: name.trim(),
            surname: surname.trim(),
            phone,
            date: selectedDate,
            time: selectedTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Randevu oluşturulamadı."
        );
        return;
      }

      setCreatedAppointment(data.appointment);

      setName("");
      setSurname("");
      setPhone("");
      setSelectedTime("");
      setMessage("");
    } catch (error) {
      console.error(
        "Randevu oluşturma hatası:",
        error
      );

      setMessage("Sunucuya bağlanılamadı.");
    }
  }

  function resetBookingForm() {
    setSelectedBarberId("");
    setSelectedDate("");
    setAvailableTimes([]);
    setMessage("");
    setSelectedTime("");
    setName("");
    setSurname("");
    setPhone("");
    setCreatedAppointment(null);
  }

  const selectedBarber = barbers.find(
    (barber) =>
      barber.id === Number(selectedBarberId)
  );

  return (
    <main className="app booking-page">
      <section className="booking-header">
        <p className="booking-label">
          Online Randevu
        </p>

        <h1>Randevunuzu Oluşturun</h1>

        <p className="booking-description">
          Berberinizi, size uygun tarihi ve saati
          seçin. Ardından iletişim bilgilerinizi
          girerek randevunuzu tamamlayın.
        </p>
      </section>

      <div className="customer-page-navigation">
        <button
          type="button"
          className="customer-page-button active"
          onClick={resetBookingForm}
        >
          Randevu Oluştur
        </button>

        <button
          type="button"
          className="customer-page-button"
          onClick={onManageAppointment}
        >
          Randevumu Yönet
        </button>
      </div>

      {createdAppointment ? (
        <section className="confirmation-card">
          <div className="confirmation-success">
            ✅
          </div>

          <h2>
            Randevunuz Başarıyla Oluşturuldu
          </h2>

          <div className="appointment-number">
            <span>Randevu Numarası</span>

            <strong>
              #{createdAppointment.id}
            </strong>
          </div>

          <div className="confirmation-information">
            <p>
              ✂️
              <strong> Berber:</strong>{" "}
              {selectedBarber
                ? `${selectedBarber.name} ${selectedBarber.surname}`
                : "Belirtilmedi"}
            </p>

            <p>
              👤
              <strong> Ad Soyad:</strong>{" "}
              {createdAppointment.name}{" "}
              {createdAppointment.surname}
            </p>

            <p>
              📅
              <strong> Tarih:</strong>{" "}
              {
                createdAppointment.appointment_date
              }
            </p>

            <p>
              🕒
              <strong> Saat:</strong>{" "}
              {createdAppointment.appointment_time.slice(
                0,
                5
              )}
            </p>

            <p>
              📞
              <strong> Telefon:</strong>{" "}
              {createdAppointment.phone}
            </p>
          </div>

          <p className="appointment-id-note">
             Randevu numaranızı saklayın. 
          Bu numara ile randevunuzu
          görüntüleyebilir veya iptal edebilirsiniz.
        </p>

          <div className="confirmation-buttons">
            <button
              type="button"
              className="manage-button"
              onClick={onManageAppointment}
            >
              Randevumu Yönet
            </button>

            <button
              type="button"
              className="home-button"
              onClick={() => {
                resetBookingForm();
                onGoHome();
              }}
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="booking-card">
            <div className="booking-card-heading">
              <span className="booking-step-number">
                1
              </span>

              <div>
                <h2>Berber, Tarih ve Saat Seçin</h2>

                <p>
                  Önce hizmet almak istediğiniz
                  berberi seçin. Ardından uygun
                  günü ve saati belirleyin.
                </p>
              </div>
            </div>

            <div className="booking-selection-area">
              <div className="booking-field">
                <label htmlFor="barber-select">
                  Berber
                </label>

                <select
                  id="barber-select"
                  value={selectedBarberId}
                  onChange={(event) => {
                    setSelectedBarberId(
                      event.target.value
                    );

                    setSelectedDate("");
                    setAvailableTimes([]);
                    setSelectedTime("");
                    setMessage("");
                  }}
                >
                  <option value="">
                    Berber seçiniz
                  </option>

                  {barbers.map((barber) => (
                    <option
                      key={barber.id}
                      value={barber.id}
                    >
                      {barber.name}{" "}
                      {barber.surname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="booking-field">
                <label htmlFor="booking-date">
                  Randevu Tarihi
                </label>

                <input
                  id="booking-date"
                  type="date"
                  min={minimumDate}
                  value={selectedDate}
                  disabled={!selectedBarberId}
                  onChange={(event) => {
                    setSelectedDate(
                      event.target.value
                    );

                    setAvailableTimes([]);
                    setSelectedTime("");
                    setMessage("");
                  }}
                />
              </div>

              <button
                type="button"
                className="show-times-button"
                onClick={fetchAvailableTimes}
                disabled={
                  !selectedBarberId ||
                  !selectedDate
                }
              >
                Müsait Saatleri Göster
              </button>
            </div>

            {message && (
              <p className="booking-message">
                {message}
              </p>
            )}

            <div className="time-list">
              {availableTimes.map((time) => (
                <button
                  type="button"
                  key={time}
                  className={
                    selectedTime === time
                      ? "time-button selected"
                      : "time-button"
                  }
                  onClick={() =>
                    setSelectedTime(time)
                  }
                >
                  {time}
                </button>
              ))}
            </div>

            {selectedTime && (
              <p className="selected-time-message">
                Seçilen Berber:{" "}
                <strong>
                  {selectedBarber?.name}{" "}
                  {selectedBarber?.surname}
                </strong>
                <br />
                Seçilen Saat:{" "}
                <strong>{selectedTime}</strong>
              </p>
            )}
          </section>

          {selectedTime && (
            <section className="booking-card appointment-form">
              <div className="booking-card-heading">
                <span className="booking-step-number">
                  2
                </span>

                <div>
                  <h2>Bilgilerinizi Girin</h2>

                  <p>
                    Randevu kaydı için
                    bilgilerinizi eksiksiz
                    doldurun.
                  </p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Adınız"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />

              <input
                type="text"
                placeholder="Soyadınız"
                value={surname}
                onChange={(event) =>
                  setSurname(event.target.value)
                }
              />

              <input
                type="tel"
                placeholder="0555 555 55 55"
                value={phone}
                maxLength={11}
                onChange={(event) => {
                  const onlyNumbers =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setPhone(onlyNumbers);
                }}
              />

              <button
                type="button"
                className="create-button"
                onClick={createAppointment}
              >
                Randevu Oluştur
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default BookingPage;