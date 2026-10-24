import { useState } from "react";

function ManageAppointment({
  onBackToBooking,
}) {
  const [
    appointmentId,
    setAppointmentId,
  ] = useState("");

  const [phone, setPhone] =
    useState("");

  const [
    appointment,
    setAppointment,
  ] = useState(null);

  const [message, setMessage] =
    useState("");

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    isCancelling,
    setIsCancelling,
  ] = useState(false);

  async function findAppointment() {
    setAppointment(null);
    setMessage("");

    if (!appointmentId || !phone) {
      setMessage(
        "Randevu numarası ve telefon numarası zorunludur."
      );
      return;
    }

    if (!/^\d+$/.test(appointmentId)) {
      setMessage(
        "Geçerli bir randevu numarası giriniz."
      );
      return;
    }

    if (!/^0\d{10}$/.test(phone)) {
      setMessage(
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
      );
      return;
    }

    try {
      setIsSearching(true);

      const response = await fetch(
        "http://localhost:3000/appointments/find",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: Number(appointmentId),
            phone,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Randevu bulunamadı."
        );
        return;
      }

      setAppointment(
        data.appointment
      );

      setMessage(
        data.message ||
          "Randevu bulundu."
      );
    } catch (error) {
      console.error(
        "Randevu arama hatası:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function cancelAppointment() {
    if (!appointment) {
      return;
    }

    const shouldCancel =
      window.confirm(
        "Randevunuzu iptal etmek istediğinize emin misiniz?"
      );

    if (!shouldCancel) {
      return;
    }

    try {
      setIsCancelling(true);
      setMessage(
        "Randevu iptal ediliyor..."
      );

      const response = await fetch(
        `http://localhost:3000/appointments/manage/${appointment.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            phone: appointment.phone,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            "Randevu iptal edilemedi."
        );
        return;
      }

      setMessage(
        data.message ||
          "Randevunuz başarıyla iptal edildi."
      );

      setAppointment(null);
      setAppointmentId("");
      setPhone("");
    } catch (error) {
      console.error(
        "Randevu iptal hatası:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  function formatAppointmentDate(
    date
  ) {
    if (!date) {
      return "-";
    }

    return date.split("T")[0];
  }

  function formatAppointmentTime(
    time
  ) {
    if (!time) {
      return "-";
    }

    return time.slice(0, 5);
  }

  return (
    <main className="manage-appointment">
      <h1>Randevumu Yönet</h1>

      <button
        type="button"
        className="back-to-booking-button"
        onClick={onBackToBooking}
      >
        Randevu Alma Ekranına Dön
      </button>

      <p>
        Randevunuzu görüntülemek için
        randevu numaranızı ve telefon
        numaranızı girin.
      </p>

      <section className="find-appointment-form">
        <label htmlFor="appointment-id">
          Randevu Numarası
        </label>

        <input
          id="appointment-id"
          type="text"
          inputMode="numeric"
          placeholder="Örneğin: 12"
          value={appointmentId}
          onChange={(event) => {
            const onlyNumbers =
              event.target.value.replace(
                /\D/g,
                ""
              );

            setAppointmentId(
              onlyNumbers
            );

            setMessage("");
            setAppointment(null);
          }}
        />

        <label htmlFor="appointment-phone">
          Telefon Numarası
        </label>

        <input
          id="appointment-phone"
          type="tel"
          inputMode="numeric"
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

            setMessage("");
            setAppointment(null);
          }}
        />

        <button
          type="button"
          className="find-button"
          onClick={findAppointment}
          disabled={isSearching}
        >
          {isSearching
            ? "Randevu Aranıyor..."
            : "Randevumu Bul"}
        </button>
      </section>

      {message && (
        <p className="manage-message">
          {message}
        </p>
      )}

      {appointment && (
        <section className="found-appointment-card">
          <h2>
            {appointment.name}{" "}
            {appointment.surname}
          </h2>

          <p>
            <strong>
              Randevu No:
            </strong>{" "}
            {appointment.id}
          </p>

          <p>
            <strong>Telefon:</strong>{" "}
            {appointment.phone}
          </p>

          <p>
            <strong>Tarih:</strong>{" "}
            {formatAppointmentDate(
              appointment.appointment_date
            )}
          </p>

          <p>
            <strong>Saat:</strong>{" "}
            {formatAppointmentTime(
              appointment.appointment_time
            )}
          </p>

          <div className="manage-actions">
            <button
              type="button"
              className="customer-cancel-button"
              onClick={
                cancelAppointment
              }
              disabled={isCancelling}
            >
              {isCancelling
                ? "İptal Ediliyor..."
                : "Randevuyu İptal Et"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default ManageAppointment;