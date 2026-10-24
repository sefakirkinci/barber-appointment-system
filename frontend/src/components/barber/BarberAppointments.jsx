import { useEffect, useState } from "react";

import {
  handleUnauthorizedResponse,
} from "../../utils/adminAuth";

function BarberAppointments() {
  const [appointments, setAppointments] =
    useState([]);

  const [
    appointmentsMessage,
    setAppointmentsMessage,
  ] = useState(
    "Randevular yükleniyor..."
  );

  const [
    isAppointmentsLoading,
    setIsAppointmentsLoading,
  ] = useState(true);

  useEffect(() => {
    fetchOwnAppointments();
  }, []);

  const [
  isCreateAppointmentOpen,
  setIsCreateAppointmentOpen,
] = useState(false);

const [newName, setNewName] =
  useState("");

const [newSurname, setNewSurname] =
  useState("");

const [newPhone, setNewPhone] =
  useState("");

const [newDate, setNewDate] =
  useState("");

const [newTime, setNewTime] =
  useState("");

const [
  newAvailableTimes,
  setNewAvailableTimes,
] = useState([]);

const [
  createAppointmentMessage,
  setCreateAppointmentMessage,
] = useState("");

const [
  isAvailableTimesLoading,
  setIsAvailableTimesLoading,
] = useState(false);

const [
  isCreatingAppointment,
  setIsCreatingAppointment,
] = useState(false);

const [nameFilter, setNameFilter] =
  useState("");

const [phoneFilter, setPhoneFilter] =
  useState("");

const [dateFilter, setDateFilter] =
  useState("");

  const [
  deletingAppointmentId,
  setDeletingAppointmentId,
] = useState(null);

const [
  editingAppointmentId,
  setEditingAppointmentId,
] = useState(null);

const [editName, setEditName] =
  useState("");

const [editSurname, setEditSurname] =
  useState("");

const [editPhone, setEditPhone] =
  useState("");

const [editDate, setEditDate] =
  useState("");

const [editTime, setEditTime] =
  useState("");

const [
  editAvailableTimes,
  setEditAvailableTimes,
] = useState([]);

const [
  editAppointmentMessage,
  setEditAppointmentMessage,
] = useState("");

const [
  isEditTimesLoading,
  setIsEditTimesLoading,
] = useState(false);

const [
  updatingAppointmentId,
  setUpdatingAppointmentId,
] = useState(null);

const today = new Date();

const minimumDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(
    2,
    "0"
  ),
  String(today.getDate()).padStart(
    2,
    "0"
  ),
].join("-");
  /*
    Giriş yapan berberin yalnızca kendi
    randevularını backend'den getirir.

    Berber numarası frontend'den gönderilmez.
    Backend, JWT içindeki barberId değerini
    kullanır.
  */
  async function fetchOwnAppointments() {
    try {
      setIsAppointmentsLoading(true);

      setAppointmentsMessage(
        "Randevular yükleniyor..."
      );

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setAppointmentsMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );

        setAppointments([]);
        return;
      }

      const response = await fetch(
        "http://localhost:3000/barbers/me/appointments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setAppointmentsMessage(
          data.message ||
            "Randevular alınamadı."
        );

        setAppointments([]);
        return;
      }

      const appointmentList = Array.isArray(
        data.appointments
      )
        ? data.appointments
        : [];

      setAppointments(appointmentList);

      if (appointmentList.length === 0) {
        setAppointmentsMessage(
          "Yaklaşan randevunuz bulunmuyor."
        );
      } else {
        setAppointmentsMessage("");
      }
    } catch (error) {
      console.error(
        "Berber randevuları alınırken hata oluştu:",
        error
      );

      setAppointmentsMessage(
        "Sunucuya bağlanılamadı."
      );

      setAppointments([]);
    } finally {
      setIsAppointmentsLoading(false);
    }
  }

  function startEditingAppointment(
  appointment
) {
  setEditingAppointmentId(
    appointment.id
  );

  setEditName(
    appointment.name || ""
  );

  setEditSurname(
    appointment.surname || ""
  );

  setEditPhone(
    appointment.phone || ""
  );

  setEditDate(
    appointment.appointment_date
      .split("T")[0]
  );

  setEditTime(
    appointment.appointment_time
      .slice(0, 5)
  );

  setEditAvailableTimes([]);
  setEditAppointmentMessage("");
}

function cancelEditingAppointment() {
  setEditingAppointmentId(null);
  setEditName("");
  setEditSurname("");
  setEditPhone("");
  setEditDate("");
  setEditTime("");
  setEditAvailableTimes([]);
  setEditAppointmentMessage("");
}

async function fetchEditAvailableTimes(
  appointment
) {
  if (!editDate) {
    setEditAppointmentMessage(
      "Lütfen önce yeni bir tarih seçin."
    );
    return;
  }

  try {
    setIsEditTimesLoading(true);

    setEditAppointmentMessage(
      "Müsait saatler yükleniyor..."
    );

    setEditAvailableTimes([]);

    const token =
      localStorage.getItem(
        "adminToken"
      );

    const barberId =
      localStorage.getItem(
        "adminBarberId"
      );

    if (!token || !barberId) {
      setEditAppointmentMessage(
        "Oturum veya berber bilgisi bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/appointments/available/${barberId}/${editDate}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (
      handleUnauthorizedResponse(
        response
      )
    ) {
      return;
    }

    const data =
      await response.json();

    if (!response.ok) {
      setEditAppointmentMessage(
        data.message ||
          "Müsait saatler alınamadı."
      );
      return;
    }

    let times = Array.isArray(
      data.availableTimes
    )
      ? data.availableTimes
      : Array.isArray(data)
        ? data
        : [];

    const currentDate =
      appointment.appointment_date
        .split("T")[0];

    const currentTime =
      appointment.appointment_time
        .slice(0, 5);

    /*
      Aynı tarih düzenleniyorsa mevcut
      randevu saati API tarafından dolu
      sayılarak listeden çıkarılabilir.

      Berber saati değiştirmeden diğer
      bilgileri güncelleyebilsin diye mevcut
      saati yeniden ekliyoruz.
    */
    if (
      editDate === currentDate &&
      !times.includes(currentTime)
    ) {
      times = [
        ...times,
        currentTime,
      ].sort((first, second) =>
        first.localeCompare(second)
      );
    }

    setEditAvailableTimes(times);

    /*
      Form ilk açıldığında mevcut saati
      korumak istiyoruz.

      Tarih değiştirilmişse yeni saat
      seçilmesi zorunlu olacak.
    */
    if (editDate !== currentDate) {
      setEditTime("");
    }

   if (times.length === 0) {
  setEditAppointmentMessage(
    data.message ||
      "Bu tarihte müsait saat bulunmuyor."
  );
} else {
  setEditAppointmentMessage(
    "Müsait saatlerden birini seçin."
  );
}
  } catch (error) {
    console.error(
      "Randevu düzenleme saatleri alınırken hata:",
      error
    );

    setEditAppointmentMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setIsEditTimesLoading(false);
  }
}

async function updateOwnAppointment(
  appointment
) {
  const normalizedName =
    editName.trim();

  const normalizedSurname =
    editSurname.trim();

  if (
    !normalizedName ||
    !normalizedSurname ||
    !editPhone ||
    !editDate ||
    !editTime
  ) {
    setEditAppointmentMessage(
      "Lütfen bütün alanları doldurun ve bir saat seçin."
    );
    return;
  }

  if (!/^0\d{10}$/.test(editPhone)) {
    setEditAppointmentMessage(
      "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
    );
    return;
  }

  try {
    setUpdatingAppointmentId(
      appointment.id
    );

    setEditAppointmentMessage(
      "Randevu güncelleniyor..."
    );

    const token =
      localStorage.getItem(
        "adminToken"
      );

    if (!token) {
      setEditAppointmentMessage(
        "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/barbers/me/appointments/${appointment.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: normalizedName,
          surname: normalizedSurname,
          phone: editPhone,
          date: editDate,
          time: editTime,
        }),
      }
    );

    if (
      handleUnauthorizedResponse(
        response
      )
    ) {
      return;
    }

    const data =
      await response.json();

    if (!response.ok) {
      setEditAppointmentMessage(
        data.message ||
          "Randevu güncellenemedi."
      );
      return;
    }

    if (data.appointment) {
      setAppointments(
        (previousAppointments) =>
          previousAppointments
            .map((item) =>
              item.id ===
              data.appointment.id
                ? data.appointment
                : item
            )
            .sort((first, second) => {
              const firstValue =
                `${first.appointment_date} ${first.appointment_time}`;

              const secondValue =
                `${second.appointment_date} ${second.appointment_time}`;

              return firstValue.localeCompare(
                secondValue
              );
            })
      );
    }

    cancelEditingAppointment();

    setAppointmentsMessage(
      data.message ||
        "Randevu başarıyla güncellendi."
    );
  } catch (error) {
    console.error(
      "Berber randevu güncelleme hatası:",
      error
    );

    setEditAppointmentMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setUpdatingAppointmentId(null);
  }
}

  async function deleteOwnAppointment(
  appointment
) {
  const confirmed = window.confirm(
    `${appointment.name} ${appointment.surname} adlı müşterinin ${formatDate(
      appointment.appointment_date
    )} tarihli ${appointment.appointment_time} randevusunu iptal etmek istediğinize emin misiniz?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingAppointmentId(
      appointment.id
    );

    setAppointmentsMessage(
      "Randevu iptal ediliyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setAppointmentsMessage(
        "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/barbers/me/appointments/${appointment.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (
      handleUnauthorizedResponse(response)
    ) {
      return;
    }

    const data =
      await response.json();

    if (!response.ok) {
      setAppointmentsMessage(
        data.message ||
          "Randevu iptal edilemedi."
      );
      return;
    }

    setAppointments(
      (previousAppointments) =>
        previousAppointments.filter(
          (item) =>
            item.id !== appointment.id
        )
    );

    setAppointmentsMessage(
      data.message ||
        "Randevu başarıyla iptal edildi."
    );
  } catch (error) {
    console.error(
      "Berber randevu iptal hatası:",
      error
    );

    setAppointmentsMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setDeletingAppointmentId(null);
  }
}


  function resetCreateAppointmentForm() {
  setNewName("");
  setNewSurname("");
  setNewPhone("");
  setNewDate("");
  setNewTime("");
  setNewAvailableTimes([]);
  setCreateAppointmentMessage("");
}

function closeCreateAppointmentForm() {
  setIsCreateAppointmentOpen(false);
  resetCreateAppointmentForm();
}

async function fetchNewAvailableTimes() {
  if (!newDate) {
    setCreateAppointmentMessage(
      "Lütfen önce bir tarih seçin."
    );
    return;
  }

  try {
    setIsAvailableTimesLoading(true);

    setCreateAppointmentMessage(
      "Müsait saatler yükleniyor..."
    );

    setNewAvailableTimes([]);
    setNewTime("");

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setCreateAppointmentMessage(
        "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

   const barberId =
  localStorage.getItem("adminBarberId");

if (!barberId) {
  setCreateAppointmentMessage(
    "Berber hesabı bilgisi bulunamadı. Lütfen tekrar giriş yapın."
  );
  return;
}

const response = await fetch(
  `http://localhost:3000/appointments/available/${barberId}/${newDate}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    if (
      handleUnauthorizedResponse(response)
    ) {
      return;
    }

    const contentType =
  response.headers.get("content-type");

if (
  !contentType ||
  !contentType.includes("application/json")
) {
  setCreateAppointmentMessage(
    `Müsait saat isteği başarısız oldu. HTTP durum kodu: ${response.status}`
  );

  return;
}

    const data =
      await response.json();

    if (!response.ok) {
      setCreateAppointmentMessage(
        data.message ||
          "Müsait saatler alınamadı."
      );
      return;
    }

    const times = Array.isArray(
      data.availableTimes
    )
      ? data.availableTimes
      : Array.isArray(data)
        ? data
        : [];

    setNewAvailableTimes(times);

    if (times.length === 0) {
      setCreateAppointmentMessage(
        data.message ||
          "Bu tarihte müsait saat bulunmuyor."
      );
    } else {
      setCreateAppointmentMessage(
        "Müsait saatlerden birini seçin."
      );
    }
  } catch (error) {
    console.error(
      "Yeni randevu saatleri alınırken hata oluştu:",
      error
    );

    setCreateAppointmentMessage(
      "Sunucuya bağlanılamadı."
    );

    setNewAvailableTimes([]);
  } finally {
    setIsAvailableTimesLoading(false);
  }
}

async function createOwnAppointment() {
  const trimmedName =
    newName.trim();

  const trimmedSurname =
    newSurname.trim();

  if (
    !trimmedName ||
    !trimmedSurname ||
    !newPhone ||
    !newDate ||
    !newTime
  ) {
    setCreateAppointmentMessage(
      "Lütfen bütün alanları doldurun ve bir saat seçin."
    );
    return;
  }

  if (!/^0\d{10}$/.test(newPhone)) {
    setCreateAppointmentMessage(
      "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
    );
    return;
  }

  try {
    setIsCreatingAppointment(true);

    setCreateAppointmentMessage(
      "Randevu oluşturuluyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setCreateAppointmentMessage(
        "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      "http://localhost:3000/barbers/me/appointments",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          surname: trimmedSurname,
          phone: newPhone,
          date: newDate,
          time: newTime,
        }),
      }
    );

    if (
      handleUnauthorizedResponse(response)
    ) {
      return;
    }

    const data =
      await response.json();

    if (!response.ok) {
      setCreateAppointmentMessage(
        data.message ||
          "Randevu oluşturulamadı."
      );
      return;
    }

    setCreateAppointmentMessage(
      data.message ||
        "Randevu başarıyla oluşturuldu."
    );

    await fetchOwnAppointments();

    setTimeout(() => {
      closeCreateAppointmentForm();
    }, 1000);
  } catch (error) {
    console.error(
      "Berber tarafından randevu oluşturma hatası:",
      error
    );

    setCreateAppointmentMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setIsCreatingAppointment(false);
  }
}
  /*
    YYYY-MM-DD tarihini DD.MM.YYYY
    biçimine dönüştürür.
  */
  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const [year, month, day] =
      date.split("-");

    if (!year || !month || !day) {
      return date;
    }

    return `${day}.${month}.${year}`;
  }

  /*
    Telefon numarasını kullanıcı için
    daha okunabilir biçime dönüştürür.

    05304785290
    →
    0530 478 52 90
  */
  function formatPhone(phone) {
    if (!phone || phone.length !== 11) {
      return phone || "-";
    }

    return `${phone.slice(
      0,
      4
    )} ${phone.slice(
      4,
      7
    )} ${phone.slice(
      7,
      9
    )} ${phone.slice(9, 11)}`;
  }

  /*
    Türkiye telefon numarasını WhatsApp'ın
    istediği uluslararası biçime dönüştürür.

    05304785290
    →
    905304785290
  */
  function convertPhoneToWhatsApp(phone) {
    if (!phone) {
      return "";
    }

    const onlyNumbers =
      phone.replace(/\D/g, "");

    if (
      onlyNumbers.startsWith("0") &&
      onlyNumbers.length === 11
    ) {
      return `90${onlyNumbers.slice(1)}`;
    }

    if (
      onlyNumbers.startsWith("90") &&
      onlyNumbers.length === 12
    ) {
      return onlyNumbers;
    }

    return onlyNumbers;
  }

  /*
    WhatsApp açıldığında hazır olarak
    görünecek mesajı oluşturur.
  */
  function createCustomerWhatsAppMessage(
    appointment
  ) {
    return [
      `Merhaba ${appointment.name} ${appointment.surname},`,
      "",
      "Formen Kuaför randevu bilginiz:",
      "",
      `Randevu No: ${appointment.id}`,
      `Tarih: ${formatDate(
        appointment.appointment_date
      )}`,
      `Saat: ${appointment.appointment_time}`,
      "",
      "Randevunuzla ilgili bir değişiklik olması durumunda bizimle iletişime geçebilirsiniz.",
    ].join("\n");
  }

  /*
    Randevunun bugün olup olmadığını kontrol
    eder. Bugünkü randevular özel biçimde
    gösterilir.
  */
  function isAppointmentToday(date) {
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(today.getDate()).padStart(
        2,
        "0"
      ),
    ].join("-");

    return date === todayString;
  }

  const filteredAppointments =
  appointments.filter((appointment) => {
    const fullName =
      `${appointment.name} ${appointment.surname}`
        .toLocaleLowerCase("tr-TR");

    const normalizedName =
      nameFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

    const normalizedPhone =
      phoneFilter.replace(/\D/g, "");

    const matchesName =
      normalizedName === "" ||
      fullName.includes(normalizedName);

    const matchesPhone =
      normalizedPhone === "" ||
      appointment.phone.includes(
        normalizedPhone
      );

    const matchesDate =
      dateFilter === "" ||
      appointment.appointment_date ===
        dateFilter;

    return (
      matchesName &&
      matchesPhone &&
      matchesDate
    );
  });

  return (
    <section className="barber-appointments-section">
    <div className="barber-section-heading">
  <div>
    <h2>Randevularım</h2>

    <p>
      Günlük ve yaklaşan müşteri
      randevularınız.
    </p>
  </div>

  <div className="barber-appointment-heading-actions">
    <button
      type="button"
      className="barber-create-appointment-button"
      onClick={() => {
        if (isCreateAppointmentOpen) {
          closeCreateAppointmentForm();
        } else {
          setIsCreateAppointmentOpen(true);
          setCreateAppointmentMessage("");
        }
      }}
    >
      {isCreateAppointmentOpen
        ? "Formu Kapat"
        : "+ Yeni Randevu Ekle"}
    </button>

    <button
      type="button"
      className="barber-refresh-button"
      onClick={fetchOwnAppointments}
      disabled={isAppointmentsLoading}
    >
      {isAppointmentsLoading
        ? "Yükleniyor..."
        : "Listeyi Yenile"}
    </button>
  </div>
</div>

  {isCreateAppointmentOpen && (
  <section className="barber-create-appointment-card">
    <div className="barber-create-appointment-heading">
      <div>
        <h3>Yeni Randevu Ekle</h3>

        <p>
          Telefonla arayan veya işletmeye
          gelen müşteri adına randevu
          oluşturun.
        </p>
      </div>
    </div>

    <div className="barber-create-appointment-form">
      <label>
        Müşteri Adı

        <input
          type="text"
          placeholder="Müşterinin adı"
          value={newName}
          onChange={(event) => {
            setNewName(
              event.target.value
            );

            setCreateAppointmentMessage("");
          }}
        />
      </label>

      <label>
        Müşteri Soyadı

        <input
          type="text"
          placeholder="Müşterinin soyadı"
          value={newSurname}
          onChange={(event) => {
            setNewSurname(
              event.target.value
            );

            setCreateAppointmentMessage("");
          }}
        />
      </label>

      <label>
        Telefon Numarası

        <input
          type="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder="0555 555 55 55"
          value={newPhone}
          onChange={(event) => {
            const onlyNumbers =
              event.target.value.replace(
                /\D/g,
                ""
              );

            setNewPhone(
              onlyNumbers
            );

            setCreateAppointmentMessage("");
          }}
        />
      </label>

      <label>
        Randevu Tarihi

        <input
          type="date"
          min={minimumDate}
          value={newDate}
          onChange={(event) => {
            setNewDate(
              event.target.value
            );

            setNewTime("");
            setNewAvailableTimes([]);
            setCreateAppointmentMessage("");
          }}
        />
      </label>
    </div>

    <button
      type="button"
      className="barber-show-available-times-button"
      onClick={fetchNewAvailableTimes}
      disabled={
        isAvailableTimesLoading ||
        !newDate
      }
    >
      {isAvailableTimesLoading
        ? "Saatler Yükleniyor..."
        : "Müsait Saatleri Göster"}
    </button>

    {newAvailableTimes.length > 0 && (
      <div className="barber-new-time-list">
        {newAvailableTimes.map((time) => (
          <button
            key={time}
            type="button"
            className={
              newTime === time
                ? "time-button selected"
                : "time-button"
            }
            onClick={() => {
              setNewTime(time);

              setCreateAppointmentMessage(
                `Seçilen saat: ${time}`
              );
            }}
          >
            {time}
          </button>
        ))}
      </div>
    )}

    {createAppointmentMessage && (
      <p className="barber-create-appointment-message">
        {createAppointmentMessage}
      </p>
    )}

    <div className="barber-create-appointment-actions">
      <button
        type="button"
        className="barber-submit-appointment-button"
        onClick={createOwnAppointment}
        disabled={isCreatingAppointment}
      >
        {isCreatingAppointment
          ? "Randevu Oluşturuluyor..."
          : "Randevuyu Oluştur"}
      </button>

      <button
        type="button"
        className="barber-cancel-create-appointment-button"
        onClick={closeCreateAppointmentForm}
        disabled={isCreatingAppointment}
      >
        Vazgeç
      </button>
    </div>
  </section>
)}

{appointments.length > 0 && (
  <section className="barber-appointment-filters">
    <div className="barber-appointment-filter-heading">
      <div>
        <h3>Randevu Ara</h3>

        <p>
          Müşteri adı, telefon numarası
          veya tarihe göre filtreleyin.
        </p>
      </div>

      <button
        type="button"
        className="barber-clear-filter-button"
        onClick={() => {
          setNameFilter("");
          setPhoneFilter("");
          setDateFilter("");
        }}
      >
        Filtreleri Temizle
      </button>
    </div>

    <div className="barber-appointment-filter-grid">
      <label>
        Ad veya Soyad

        <input
          type="text"
          placeholder=""
          value={nameFilter}
          onChange={(event) =>
            setNameFilter(
              event.target.value
            )
          }
        />
      </label>

      <label>
        Telefon

        <input
          type="tel"
          inputMode="numeric"
          maxLength={11}
          placeholder=""
          value={phoneFilter}
          onChange={(event) => {
            const onlyNumbers =
              event.target.value.replace(
                /\D/g,
                ""
              );

            setPhoneFilter(
              onlyNumbers
            );
          }}
        />
      </label>

      <label>
        Tarih

        <input
          type="date"
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(
              event.target.value
            )
          }
        />
      </label>
    </div>
  </section>
)}

      {appointmentsMessage && (
        <p className="barber-panel-message">
          {appointmentsMessage}
        </p>
      )}

      {appointments.length > 0 &&
  filteredAppointments.length === 0 && (
    <p className="barber-panel-message">
      Arama kriterlerine uygun randevu
      bulunamadı.
    </p>
  )}

      {!isAppointmentsLoading &&
  filteredAppointments.length > 0 && (
          <div className="barber-appointment-list">
            {filteredAppointments.map(
              (appointment) => (
                <article
                  key={appointment.id}
                  className={
                    isAppointmentToday(
                      appointment.appointment_date
                    )
                      ? "barber-appointment-card today"
                      : "barber-appointment-card"
                  }
                >
                  <div className="barber-appointment-card-header">
                    <div>
                      <span className="barber-appointment-number">
                        Randevu #
                        {appointment.id}
                      </span>

                      <h3>
                        {appointment.name}{" "}
                        {appointment.surname}
                      </h3>
                    </div>

                    {isAppointmentToday(
                      appointment.appointment_date
                    ) && (
                      <span className="today-badge">
                        Bugün
                      </span>
                    )}
                  </div>

                  <div className="barber-appointment-details">
                    <div className="barber-appointment-detail">
                      <span>📅</span>

                      <div>
                        <small>Tarih</small>

                        <strong>
                          {formatDate(
                            appointment.appointment_date
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="barber-appointment-detail">
                      <span>🕒</span>

                      <div>
                        <small>Saat</small>

                        <strong>
                          {
                            appointment.appointment_time
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="barber-appointment-detail">
                      <span>📞</span>

                      <div>
                        <small>Telefon</small>

                        <a
                          href={`tel:${appointment.phone}`}
                        >
                          {formatPhone(
                            appointment.phone
                          )}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="barber-appointment-actions">
                    <a
                      className="barber-whatsapp-button"
                      href={`https://wa.me/${convertPhoneToWhatsApp(
                        appointment.phone
                      )}?text=${encodeURIComponent(
                        createCustomerWhatsAppMessage(
                          appointment
                        )
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp’tan Yaz
                    </a>

                    <a
                      className="barber-call-button"
                      href={`tel:${appointment.phone}`}
                    >
                      Müşteriyi Ara
                    </a>

                    <button
                    type="button"
                    className="barber-edit-appointment-button"
                    onClick={() =>
                      startEditingAppointment(
                        appointment
                      )
                    }
                  >
                    {editingAppointmentId ===
                    appointment.id
                      ? "Düzenleniyor"
                      : "Randevuyu Düzenle"}
                  </button>

                    <button
                      type="button"
                      className="barber-delete-appointment-button"
                      onClick={() =>
                        deleteOwnAppointment(
                          appointment
                        )
                      }
                      disabled={
                        deletingAppointmentId ===
                        appointment.id
                      }
                    >
                      {deletingAppointmentId ===
                      appointment.id
                        ? "İptal Ediliyor..."
                        : "Randevuyu İptal Et"}
                    </button>
                  </div>

               {editingAppointmentId ===
                  appointment.id && (
                  <section className="barber-appointment-edit-form">
                    <div className="barber-appointment-edit-heading">
                      <h4>Randevuyu Düzenle</h4>

                      <p>
                        Müşteri bilgilerini veya randevu
                        tarih ve saatini değiştirebilirsiniz.
                      </p>
                    </div>

                    <div className="barber-appointment-edit-grid">
                      <label>
                        Müşteri Adı

                        <input
                          type="text"
                          value={editName}
                          onChange={(event) => {
                            setEditName(
                              event.target.value
                            );

                            setEditAppointmentMessage("");
                          }}
                        />
                      </label>

                      <label>
                        Müşteri Soyadı

                        <input
                          type="text"
                          value={editSurname}
                          onChange={(event) => {
                            setEditSurname(
                              event.target.value
                            );

                            setEditAppointmentMessage("");
                          }}
                        />
                      </label>

                      <label>
                        Telefon Numarası

                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={11}
                          value={editPhone}
                          onChange={(event) => {
                            const onlyNumbers =
                              event.target.value.replace(
                                /\D/g,
                                ""
                              );

                            setEditPhone(onlyNumbers);
                            setEditAppointmentMessage("");
                          }}
                        />
                      </label>

                      <label>
                        Randevu Tarihi

                        <input
                          type="date"
                          min={minimumDate}
                          value={editDate}
                          onChange={(event) => {
                            setEditDate(
                              event.target.value
                            );

                            setEditTime("");
                            setEditAvailableTimes([]);
                            setEditAppointmentMessage("");
                          }}
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="barber-show-edit-times-button"
                      onClick={() =>
                        fetchEditAvailableTimes(
                          appointment
                        )
                      }
                      disabled={
                        isEditTimesLoading ||
                        !editDate
                      }
                    >
                      {isEditTimesLoading
                        ? "Saatler Yükleniyor..."
                        : "Müsait Saatleri Göster"}
                    </button>

                    {editAvailableTimes.length > 0 && (
                      <div className="barber-edit-time-list">
                        {editAvailableTimes.map(
                          (time) => (
                            <button
                              key={time}
                              type="button"
                              className={
                                editTime === time
                                  ? "time-button selected"
                                  : "time-button"
                              }
                              onClick={() => {
                                setEditTime(time);

                                setEditAppointmentMessage(
                                  `Seçilen saat: ${time}`
                                );
                              }}
                            >
                              {time}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {editAppointmentMessage && (
                      <p className="barber-edit-appointment-message">
                        {editAppointmentMessage}
                      </p>
                    )}

                    <div className="barber-appointment-edit-actions">
                      <button
                        type="button"
                        className="barber-save-appointment-edit-button"
                        onClick={() =>
                          updateOwnAppointment(
                            appointment
                          )
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        {updatingAppointmentId ===
                        appointment.id
                          ? "Kaydediliyor..."
                          : "Değişiklikleri Kaydet"}
                      </button>

                      <button
                        type="button"
                        className="barber-cancel-appointment-edit-button"
                        onClick={
                          cancelEditingAppointment
                        }
                        disabled={
                          updatingAppointmentId ===
                          appointment.id
                        }
                      >
                        Vazgeç
                      </button>
                    </div>
                  </section>
                )}
                </article>
              )
            )}
          </div>
        )}
    </section>
  );
}

export default BarberAppointments;