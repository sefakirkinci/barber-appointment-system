import { useEffect, useState } from "react";

import {
  handleUnauthorizedResponse,
} from "../utils/adminAuth";

function BarberManagement() {
  const [barbers, setBarbers] = useState([]);

  const [message, setMessage] = useState(
    "Berberler yükleniyor..."
  );

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  /*
    Adminin aktif ve pasif bütün berberleri
    görüntülemesini sağlar.
  */

    const [showCreateForm, setShowCreateForm] =
  useState(false);

const [newBarber, setNewBarber] = useState({
  name: "",
  surname: "",
  phone: "",
  whatsappNumber: "",
  username: "",
  temporaryPassword: "",
});

const [isCreatingBarber, setIsCreatingBarber] =
  useState(false);

const [createdTemporaryPassword, setCreatedTemporaryPassword] =
  useState("");


const [editingBarberId, setEditingBarberId] =
  useState(null);

const [editBarber, setEditBarber] = useState({
  name: "",
  surname: "",
  phone: "",
  whatsappNumber: "",
  username: "",
});

const [isUpdatingBarber, setIsUpdatingBarber] =
  useState(false);  

  const [
  resettingPasswordBarberId,
  setResettingPasswordBarberId,
] = useState(null);

const [
  resetPasswordValue,
  setResetPasswordValue,
] = useState("");

const [
  isResettingPassword,
  setIsResettingPassword,
] = useState(false);

const [
  resetPasswordResult,
  setResetPasswordResult,
] = useState("");

const [copiedPassword, setCopiedPassword] =
  useState(false);

const [
  selectedBarberAppointments,
  setSelectedBarberAppointments,
] = useState([]);

const [
  appointmentBarber,
  setAppointmentBarber,
] = useState(null);

const [
  loadingAppointments,
  setLoadingAppointments,
] = useState(false);

const [
  openedAppointmentBarberId,
  setOpenedAppointmentBarberId,
] = useState(null);

const [
  deletingAppointmentId,
  setDeletingAppointmentId,
] = useState(null);

const [
  editingAppointmentId,
  setEditingAppointmentId,
] = useState(null);

const [
  editAppointmentDate,
  setEditAppointmentDate,
] = useState("");

const [
  editAppointmentTime,
  setEditAppointmentTime,
] = useState("");

const [
  editAvailableTimes,
  setEditAvailableTimes,
] = useState([]);

const [
  isEditTimesLoading,
  setIsEditTimesLoading,
] = useState(false);

const [
  updatingAppointmentId,
  setUpdatingAppointmentId,
] = useState(null);

const [
  selectedWorkingHoursBarber,
  setSelectedWorkingHoursBarber,
] = useState(null);

const [
  workingHours,
  setWorkingHours,
] = useState([]);

const [
  loadingWorkingHours,
  setLoadingWorkingHours,
] = useState(false);

const [
  updatingWorkingHourId,
  setUpdatingWorkingHourId,
] = useState(null);

  async function fetchBarbers() {
    try {
      setIsLoading(true);
      setMessage("Berberler yükleniyor...");

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setMessage(
          "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
        );

        setBarbers([]);
        return;
      }

      const response = await fetch(
        "http://localhost:3000/barbers/admin/all",
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
        setMessage(
          data.message ||
            "Berber listesi alınamadı."
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
          "Sistemde kayıtlı berber bulunmuyor."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error(
        "Berber listesi alınırken hata oluştu:",
        error
      );

      setMessage("Sunucuya bağlanılamadı.");
      setBarbers([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewBarberChange(field, value) {
  setNewBarber((previousBarber) => ({
    ...previousBarber,
    [field]: value,
  }));

  setMessage("");
  setCreatedTemporaryPassword("");
}

function resetCreateBarberForm() {
  setNewBarber({
    name: "",
    surname: "",
    phone: "",
    whatsappNumber: "",
    username: "",
    temporaryPassword: "",
  });

  setShowCreateForm(false);
  setCreatedTemporaryPassword("");
}

async function createBarber() {
  const {
    name,
    surname,
    phone,
    whatsappNumber,
    username,
    temporaryPassword,
  } = newBarber;

  if (
    !name.trim() ||
    !surname.trim() ||
    !phone ||
    !whatsappNumber ||
    !username.trim() ||
    !temporaryPassword
  ) {
    setMessage(
      "Lütfen bütün yeni berber bilgilerini doldurun."
    );
    return;
  }

  if (!/^0\d{10}$/.test(phone)) {
    setMessage(
      "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
    );
    return;
  }

  if (!/^90\d{10}$/.test(whatsappNumber)) {
    setMessage(
      "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır."
    );
    return;
  }

  if (
    !/^[a-z0-9._-]{3,30}$/.test(
      username.trim().toLowerCase()
    )
  ) {
    setMessage(
      "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir."
    );
    return;
  }

  if (temporaryPassword.length < 8) {
    setMessage(
      "Geçici şifre en az 8 karakter olmalıdır."
    );
    return;
  }

  try {
    setIsCreatingBarber(true);
    setMessage("Yeni berber oluşturuluyor...");
    setCreatedTemporaryPassword("");

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      "http://localhost:3000/barbers/admin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          phone,
          whatsappNumber,
          username: username.trim().toLowerCase(),
          temporaryPassword,
        }),
      }
    );

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Yeni berber oluşturulamadı."
      );
      return;
    }

    setCreatedTemporaryPassword(
      data.temporaryPassword || temporaryPassword
    );

    setMessage(
      data.message ||
        "Yeni berber başarıyla oluşturuldu."
    );

    setNewBarber({
      name: "",
      surname: "",
      phone: "",
      whatsappNumber: "",
      username: "",
      temporaryPassword: "",
    });

    await fetchBarbers();
  } catch (error) {
    console.error(
      "Yeni berber oluşturma hatası:",
      error
    );

    setMessage("Sunucuya bağlanılamadı.");
  } finally {
    setIsCreatingBarber(false);
  }
}


function startEditingBarber(barber) {
  setEditingBarberId(barber.id);

  setEditBarber({
    name: barber.name || "",
    surname: barber.surname || "",
    phone: barber.phone || "",
    whatsappNumber:
      barber.whatsapp_number || "",
    username: barber.username || "",
  });

  setMessage("");
  setCreatedTemporaryPassword("");
}

function handleEditBarberChange(
  field,
  value
) {
  setEditBarber((previousBarber) => ({
    ...previousBarber,
    [field]: value,
  }));

  setMessage("");
}

function cancelEditingBarber() {
  setEditingBarberId(null);

  setEditBarber({
    name: "",
    surname: "",
    phone: "",
    whatsappNumber: "",
    username: "",
  });

  setMessage("");
}



async function updateBarber() {
  const {
    name,
    surname,
    phone,
    whatsappNumber,
    username,
  } = editBarber;

  if (!editingBarberId) {
    setMessage(
      "Düzenlenecek berber bulunamadı."
    );
    return;
  }

  if (
    !name.trim() ||
    !surname.trim() ||
    !phone ||
    !whatsappNumber ||
    !username.trim()
  ) {
    setMessage(
      "Lütfen bütün berber bilgilerini doldurun."
    );
    return;
  }

  if (!/^0\d{10}$/.test(phone)) {
    setMessage(
      "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
    );
    return;
  }

  if (!/^90\d{10}$/.test(whatsappNumber)) {
    setMessage(
      "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır."
    );
    return;
  }

  const normalizedUsername =
    username.trim().toLowerCase();

  if (
    !/^[a-z0-9._-]{3,30}$/.test(
      normalizedUsername
    )
  ) {
    setMessage(
      "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir."
    );
    return;
  }

  try {
    setIsUpdatingBarber(true);

    setMessage(
      "Berber bilgileri güncelleniyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${editingBarberId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          phone,
          whatsappNumber,
          username: normalizedUsername,
        }),
      }
    );

    if (
      handleUnauthorizedResponse(response)
    ) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Berber bilgileri güncellenemedi."
      );
      return;
    }

    /*
      Backend'in döndürdüğü güncel berberi
      doğrudan listedeki eski kayıtla
      değiştiriyoruz.
    */
    if (data.barber) {
      setBarbers((previousBarbers) =>
        previousBarbers.map((barber) =>
          barber.id === data.barber.id
            ? data.barber
            : barber
        )
      );
    }

    setEditingBarberId(null);

    setEditBarber({
      name: "",
      surname: "",
      phone: "",
      whatsappNumber: "",
      username: "",
    });

    setMessage(
      data.message ||
        "Berber bilgileri başarıyla güncellendi."
    );
  } catch (error) {
    console.error(
      "Berber güncelleme hatası:",
      error
    );

    setMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setIsUpdatingBarber(false);
  }
}

function startResettingPassword(barber) {
  setResettingPasswordBarberId(barber.id);
  setResetPasswordValue("");
  setResetPasswordResult("");
  setMessage("");
}

function cancelResettingPassword() {
  setResettingPasswordBarberId(null);
  setResetPasswordValue("");
  setResetPasswordResult("");
  setMessage("");
}

async function copyTemporaryPassword() {
  if (!resetPasswordResult) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      resetPasswordResult
    );

    setCopiedPassword(true);

    setTimeout(() => {
      setCopiedPassword(false);
    }, 2000);
  } catch (error) {
    console.error(
      "Şifre kopyalanamadı:",
      error
    );

    setMessage(
      "Şifre panoya kopyalanamadı."
    );
  }
}

async function resetBarberPassword(barber) {
  if (!resetPasswordValue) {
    setMessage(
      "Lütfen yeni geçici şifreyi girin."
    );
    return;
  }

  if (resetPasswordValue.length < 8) {
    setMessage(
      "Geçici şifre en az 8 karakter olmalıdır."
    );
    return;
  }

  const confirmed = window.confirm(
    `${barber.name} ${barber.surname} için şifreyi sıfırlamak istediğinize emin misiniz?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setIsResettingPassword(true);
    setMessage("Şifre sıfırlanıyor...");
    setResetPasswordResult("");

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${barber.id}/reset-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          temporaryPassword:
            resetPasswordValue,
        }),
      }
    );

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Şifre sıfırlanamadı."
      );
      return;
    }

    if (data.barber) {
      setBarbers((previousBarbers) =>
        previousBarbers.map((item) =>
          item.id === data.barber.id
            ? {
                ...item,
                ...data.barber,
              }
            : item
        )
      );
    }

    setResetPasswordResult(
      data.temporaryPassword ||
        resetPasswordValue
    );

    setResetPasswordValue("");

    setMessage(
      data.message ||
        "Berber şifresi başarıyla sıfırlandı."
    );
  } catch (error) {
    console.error(
      "Berber şifre sıfırlama hatası:",
      error
    );

    setMessage("Sunucuya bağlanılamadı.");
  } finally {
    setIsResettingPassword(false);
  }
}

async function loadBarberAppointments(
  barber
) {
  try {
    setLoadingAppointments(true);
    setMessage("");

    const token =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${barber.id}/appointments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Randevular alınamadı."
      );
      return;
    }

    setAppointmentBarber(data.barber);

    setSelectedBarberAppointments(
      data.appointments
    );

    setOpenedAppointmentBarberId(
      barber.id
    );
  } catch (error) {
    console.error(error);

    setMessage("Sunucuya bağlanılamadı.");
  } finally {
    setLoadingAppointments(false);
  }
}

async function loadWorkingHours(barber) {
  try {
    setLoadingWorkingHours(true);

    setSelectedWorkingHoursBarber(
      barber
    );

    const token =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${barber.id}/working-hours`,
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
      setMessage(
        data.message ||
          "Çalışma saatleri alınamadı."
      );
      return;
    }

    setWorkingHours(
      data.workingHours || []
    );

    setMessage("");
  } catch (error) {
    console.error(error);

    setMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setLoadingWorkingHours(false);
  }
}

function updateWorkingHourField(
  id,
  field,
  value
) {
  setWorkingHours((previous) =>
    previous.map((day) =>
      day.id === id
        ? {
            ...day,
            [field]: value,
          }
        : day
    )
  );
}

async function saveWorkingHour(day) {
  try {
    setUpdatingWorkingHourId(day.id);

    const token =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${selectedWorkingHoursBarber.id}/working-hours/${day.id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          openingTime: day.opening_time,
          closingTime: day.closing_time,
          isOpen: day.is_open,
        }),
      }
    );

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Kaydedilemedi."
      );

      return;
    }

    setWorkingHours((previous) =>
      previous.map((item) =>
        item.id === day.id
          ? data.workingHour
          : item
      )
    );

    setMessage(data.message);
  } catch (error) {
    console.error(error);

    setMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setUpdatingWorkingHourId(null);
  }
}

function startEditingAppointment(
  appointment
) {
  const currentDate =
    appointment.appointment_date.split("T")[0];

  const currentTime =
    appointment.appointment_time.slice(0, 5);

  setEditingAppointmentId(appointment.id);
  setEditAppointmentDate(currentDate);
  setEditAppointmentTime(currentTime);
  setEditAvailableTimes([]);
  setMessage("");
}

function cancelEditingAppointment() {
  setEditingAppointmentId(null);
  setEditAppointmentDate("");
  setEditAppointmentTime("");
  setEditAvailableTimes([]);
  setMessage("");
}

async function loadEditAvailableTimes(
  appointment
) {
  if (!editAppointmentDate) {
    setMessage(
      "Lütfen önce yeni bir tarih seçin."
    );
    return;
  }

  if (!appointment.barber_id) {
    setMessage(
      "Randevuya ait berber bilgisi bulunamadı."
    );
    return;
  }

  try {
    setIsEditTimesLoading(true);

    setMessage(
      "Müsait saatler yükleniyor..."
    );

    const response = await fetch(
      `http://localhost:3000/appointments/available/${appointment.barber_id}/${editAppointmentDate}`
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Müsait saatler alınamadı."
      );

      setEditAvailableTimes([]);
      return;
    }

    let times = Array.isArray(
      data.availableTimes
    )
      ? data.availableTimes
      : [];

    const currentDate =
      appointment.appointment_date.split("T")[0];

    const currentTime =
      appointment.appointment_time.slice(0, 5);

    /*
      Randevu aynı tarih üzerinde düzenleniyorsa
      mevcut saat dolu kabul edilerek API
      listesinden çıkabilir.

      Yönetici aynı saati koruyabilsin diye
      mevcut saati tekrar listeye ekliyoruz.
    */
    if (
      editAppointmentDate === currentDate &&
      !times.includes(currentTime)
    ) {
      times = [...times, currentTime].sort();
    }

    setEditAvailableTimes(times);
    setEditAppointmentTime("");

    if (times.length === 0) {
      setMessage(
        data.message ||
          "Bu tarihte müsait saat bulunmuyor."
      );
    } else {
      setMessage("");
    }
  } catch (error) {
    console.error(
      "Randevu düzenleme saatleri alınırken hata:",
      error
    );

    setMessage("Sunucuya bağlanılamadı.");
    setEditAvailableTimes([]);
  } finally {
    setIsEditTimesLoading(false);
  }
}

async function updateSelectedAppointment(
  appointment
) {
  if (
    !editAppointmentDate ||
    !editAppointmentTime
  ) {
    setMessage(
      "Lütfen yeni tarih ve saati seçin."
    );
    return;
  }

  try {
    setUpdatingAppointmentId(
      appointment.id
    );

    setMessage(
      "Randevu güncelleniyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/appointments/${appointment.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",

          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barberId: appointment.barber_id,
          name: appointment.name,
          surname: appointment.surname,
          phone: appointment.phone,
          date: editAppointmentDate,
          time: editAppointmentTime,
        }),
      }
    );

    if (
      handleUnauthorizedResponse(response)
    ) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Randevu güncellenemedi."
      );
      return;
    }

    if (data.appointment) {
      setSelectedBarberAppointments(
        (previousAppointments) =>
          previousAppointments.map((item) =>
            item.id === data.appointment.id
              ? {
                  ...item,
                  ...data.appointment,
                  barber_id:
                    data.appointment.barber_id ||
                    item.barber_id,
                }
              : item
          )
      );
    }

    setEditingAppointmentId(null);
    setEditAppointmentDate("");
    setEditAppointmentTime("");
    setEditAvailableTimes([]);

    setMessage(
      data.message ||
        "Randevu başarıyla güncellendi."
    );
  } catch (error) {
    console.error(
      "Admin randevu güncelleme hatası:",
      error
    );

    setMessage("Sunucuya bağlanılamadı.");
  } finally {
    setUpdatingAppointmentId(null);
  }
}

async function deleteBarberAppointment(
  appointment
) {
  const confirmed = window.confirm(
    `${appointment.name} ${appointment.surname} adlı müşterinin ${appointment.appointment_date} tarihli ${appointment.appointment_time} randevusunu iptal etmek istediğinize emin misiniz?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingAppointmentId(
      appointment.id
    );

    setMessage(
      "Randevu iptal ediliyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/appointments/${appointment.id}`,
      {
        method: "DELETE",
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

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Randevu iptal edilemedi."
      );
      return;
    }

    /*
      Silinen randevuyu açık listeden
      kaldırıyoruz.
    */
    setSelectedBarberAppointments(
      (previousAppointments) =>
        previousAppointments.filter(
          (item) =>
            item.id !== appointment.id
        )
    );

    setMessage(
      data.message ||
        "Randevu başarıyla iptal edildi."
    );
  } catch (error) {
    console.error(
      "Admin randevu iptal hatası:",
      error
    );

    setMessage(
      "Sunucuya bağlanılamadı."
    );
  } finally {
    setDeletingAppointmentId(null);
  }
}

  function formatPhone(phone) {
    if (!phone || phone.length !== 11) {
      return phone || "-";
    }

    return `${phone.slice(0, 4)} ${phone.slice(
      4,
      7
    )} ${phone.slice(7, 9)} ${phone.slice(
      9,
      11
    )}`;
  }

  function formatWhatsAppNumber(number) {
    if (!number || number.length !== 12) {
      return number || "-";
    }

    return `+${number.slice(
      0,
      2
    )} ${number.slice(
      2,
      5
    )} ${number.slice(
      5,
      8
    )} ${number.slice(
      8,
      10
    )} ${number.slice(10, 12)}`;
  }

  const totalBarbers = barbers.length;

  const activeBarbers = barbers.filter(
    (barber) => barber.is_active
  ).length;

  const passiveBarbers =
    totalBarbers - activeBarbers;



async function toggleBarberStatus(barber) {
  const newStatus = !barber.is_active;

  const confirmationMessage = newStatus
    ? `${barber.name} ${barber.surname} hesabını aktif yapmak istiyor musunuz?`
    : `${barber.name} ${barber.surname} hesabını pasif yapmak istiyor musunuz?`;

  const confirmed = window.confirm(
    confirmationMessage
  );

  if (!confirmed) {
    return;
  }

  try {
    setMessage(
      newStatus
        ? "Berber hesabı aktif yapılıyor..."
        : "Berber hesabı pasif yapılıyor..."
    );

    const token =
      localStorage.getItem("adminToken");

    if (!token) {
      setMessage(
        "Yönetici oturumu bulunamadı. Lütfen tekrar giriş yapın."
      );
      return;
    }

    const response = await fetch(
      `http://localhost:3000/barbers/admin/${barber.id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: newStatus,
        }),
      }
    );

    if (handleUnauthorizedResponse(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      setMessage(
        data.message ||
          "Berber durumu güncellenemedi."
      );
      return;
    }

    if (data.barber) {
      setBarbers((previousBarbers) =>
        previousBarbers.map((item) =>
          item.id === data.barber.id
            ? data.barber
            : item
        )
      );
    }

    setMessage(
      data.message ||
        "Berber durumu güncellendi."
    );
  } catch (error) {
    console.error(
      "Berber durumu değiştirme hatası:",
      error
    );

    setMessage("Sunucuya bağlanılamadı.");
  }
}


  return (
    <section className="admin-barber-management">
      <div className="admin-barber-heading">
        <div>
          <h2>Berber Yönetimi</h2>

          <p>
            İşletmede çalışan berber hesaplarını
            ve durumlarını yönetin.
          </p>
        </div>

        <div className="admin-barber-heading-actions">
          <button
            type="button"
            className="admin-refresh-barbers-button"
            onClick={fetchBarbers}
            disabled={isLoading}
          >
            {isLoading
              ? "Yükleniyor..."
              : "Listeyi Yenile"}
          </button>

         <button
            type="button"
            className="admin-add-barber-button"
            onClick={() => {
                setShowCreateForm((currentValue) => !currentValue);
                setMessage("");
                setCreatedTemporaryPassword("");
            }}
            >
            {showCreateForm
                ? "Formu Kapat"
                : "+ Yeni Berber Ekle"}
            </button>
        </div>
      </div>

      <div className="admin-barber-statistics">
        <article className="admin-barber-stat-card">
          <span>Toplam Berber</span>

          <strong>{totalBarbers}</strong>
        </article>

        <article className="admin-barber-stat-card">
          <span>Aktif Berber</span>

          <strong>{activeBarbers}</strong>
        </article>

        <article className="admin-barber-stat-card">
          <span>Pasif Berber</span>

          <strong>{passiveBarbers}</strong>
        </article>
      </div>

      {showCreateForm && (
  <section className="admin-create-barber-form">
    <div className="admin-create-barber-heading">
      <div>
        <h3>Yeni Berber Ekle</h3>

        <p>
          Yeni personel hesabını ve geçici
          giriş bilgilerini oluşturun.
        </p>
      </div>
    </div>

    <div className="admin-create-barber-grid">
      <label>
        Ad

        <input
          type="text"
          value={newBarber.name}
          onChange={(event) =>
            handleNewBarberChange(
              "name",
              event.target.value
            )
          }
        />
      </label>

      <label>
        Soyad

        <input
          type="text"
          value={newBarber.surname}
          onChange={(event) =>
            handleNewBarberChange(
              "surname",
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
          placeholder="0**********"
          value={newBarber.phone}
          onChange={(event) => {
            const onlyNumbers =
              event.target.value.replace(
                /\D/g,
                ""
              );

            handleNewBarberChange(
              "phone",
              onlyNumbers
            );
          }}
        />
      </label>

      <label>
        WhatsApp

        <input
          type="tel"
          inputMode="numeric"
          maxLength={12}
          placeholder="90**********"
          value={newBarber.whatsappNumber}
          onChange={(event) => {
            const onlyNumbers =
              event.target.value.replace(
                /\D/g,
                ""
              );

            handleNewBarberChange(
              "whatsappNumber",
              onlyNumbers
            );
          }}
        />
      </label>

      <label>
        Kullanıcı Adı

        <input
          type="text"
          placeholder=""
          value={newBarber.username}
          onChange={(event) =>
            handleNewBarberChange(
              "username",
              event.target.value
                .toLowerCase()
                .replace(/\s/g, "")
            )
          }
        />
      </label>

      <label>
        Geçici Şifre

        <input
          type="password"
          autoComplete="new-password"
          placeholder="En az 8 karakter"
          value={newBarber.temporaryPassword}
          onChange={(event) =>
            handleNewBarberChange(
              "temporaryPassword",
              event.target.value
            )
          }
        />
      </label>
    </div>

    <p className="admin-create-barber-help">
      Yeni berber ilk girişinde geçici şifresini
      değiştirmek zorunda olacaktır.
    </p>

    <div className="admin-create-barber-actions">
      <button
        type="button"
        className="admin-create-barber-save"
        onClick={createBarber}
        disabled={isCreatingBarber}
      >
        {isCreatingBarber
          ? "Berber Oluşturuluyor..."
          : "Berberi Kaydet"}
      </button>

      <button
        type="button"
        className="admin-create-barber-cancel"
        onClick={resetCreateBarberForm}
        disabled={isCreatingBarber}
      >
        İptal
      </button>
    </div>

    {createdTemporaryPassword && (
      <div className="admin-created-password-box">
        <strong>Geçici Şifre:</strong>{" "}
        {createdTemporaryPassword}

        <p>
          Bu şifreyi güvenli şekilde yeni
          berbere iletin. İlk girişte
          değiştirilmesi istenecektir.
        </p>
      </div>
    )}
  </section>
)}

      {message && (
        <p className="admin-barber-message">
          {message}
        </p>
      )}

      {!isLoading && barbers.length > 0 && (
        <div className="admin-barber-list">
          {barbers.map((barber) => (
            <article
              key={barber.id}
              className={
                barber.is_active
                  ? "admin-barber-card"
                  : "admin-barber-card passive"
              }
            >
              <div className="admin-barber-card-header">
                <div>
                  <span className="admin-barber-number">
                    Berber #{barber.id}
                  </span>

                  <h3>
                    {barber.name} {barber.surname}
                  </h3>
                </div>

                <span
                  className={
                    barber.is_active
                      ? "admin-barber-status active"
                      : "admin-barber-status passive"
                  }
                >
                  {barber.is_active
                    ? "Aktif"
                    : "Pasif"}
                </span>
              </div>

              <div className="admin-barber-information">
                <div>
                  <small>Kullanıcı Adı</small>

                  <strong>
                    {barber.username}
                  </strong>
                </div>

                <div>
                  <small>Telefon</small>

                  <strong>
                    {formatPhone(barber.phone)}
                  </strong>
                </div>

                <div>
                  <small>WhatsApp</small>

                  <strong>
                    {formatWhatsAppNumber(
                      barber.whatsapp_number
                    )}
                  </strong>
                </div>

                <div>
                  <small>Şifre Durumu</small>

                  <strong>
                    {barber.must_change_password
                      ? "Değiştirmesi gerekiyor"
                      : "Güncel"}
                  </strong>
                </div>
              </div>

              <div className="admin-barber-actions">
                 <button
                  type="button"
                  onClick={() =>
                    startEditingBarber(barber)
                  }
                >
                  {editingBarberId === barber.id
                    ? "Düzenleniyor"
                    : "Düzenle"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    startResettingPassword(barber)
                  }
                >
                  {resettingPasswordBarberId === barber.id
                    ? "Şifre Formu Açık"
                    : "Şifre Sıfırla"}
                </button>

                <button
                type="button"
                className={
                  barber.is_active
                    ? "admin-barber-status-button deactivate"
                    : "admin-barber-status-button activate"
                }
                onClick={() =>
                  toggleBarberStatus(barber)
                }
              >
                {barber.is_active
                  ? "Pasif Yap"
                  : "Aktif Yap"}
              </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      openedAppointmentBarberId === barber.id
                    ) {
                      setOpenedAppointmentBarberId(null);
                      setSelectedBarberAppointments([]);
                      setAppointmentBarber(null);
                    } else {
                      loadBarberAppointments(barber);
                    }
                  }}
                >
                  {openedAppointmentBarberId === barber.id
                    ? "Randevuları Kapat"
                    : "Randevular"}
                </button>

                <button
                type="button"
                onClick={() =>
                  loadWorkingHours(barber)
                }
              >
                Çalışma Saatleri
              </button>
              </div>
              
              {editingBarberId === barber.id && (
                <section className="admin-edit-barber-form">
                  <div className="admin-edit-barber-heading">
                    <h4>Berber Bilgilerini Düzenle</h4>

                    <p>
                      Personelin temel bilgilerini
                      güncelleyin.
                    </p>
                  </div>

                  <div className="admin-edit-barber-grid">
                    <label>
                      Ad

                      <input
                        type="text"
                        value={editBarber.name}
                        onChange={(event) =>
                          handleEditBarberChange(
                            "name",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      Soyad

                      <input
                        type="text"
                        value={editBarber.surname}
                        onChange={(event) =>
                          handleEditBarberChange(
                            "surname",
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
                        value={editBarber.phone}
                        onChange={(event) => {
                          const onlyNumbers =
                            event.target.value.replace(
                              /\D/g,
                              ""
                            );

                          handleEditBarberChange(
                            "phone",
                            onlyNumbers
                          );
                        }}
                      />
                    </label>

                    <label>
                      WhatsApp

                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={12}
                        value={
                          editBarber.whatsappNumber
                        }
                        onChange={(event) => {
                          const onlyNumbers =
                            event.target.value.replace(
                              /\D/g,
                              ""
                            );

                          handleEditBarberChange(
                            "whatsappNumber",
                            onlyNumbers
                          );
                        }}
                      />
                    </label>

                    <label className="admin-edit-username-field">
                      Kullanıcı Adı

                      <input
                        type="text"
                        value={editBarber.username}
                        onChange={(event) =>
                          handleEditBarberChange(
                            "username",
                            event.target.value
                              .toLowerCase()
                              .replace(/\s/g, "")
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="admin-edit-barber-actions">
                    <button
                      type="button"
                      className="admin-edit-barber-save"
                      onClick={updateBarber}
                      disabled={isUpdatingBarber}
                    >
                      {isUpdatingBarber
                        ? "Kaydediliyor..."
                        : "Değişiklikleri Kaydet"}
                    </button>

                    <button
                      type="button"
                      className="admin-edit-barber-cancel"
                      onClick={cancelEditingBarber}
                      disabled={isUpdatingBarber}
                    >
                      Vazgeç
                    </button>
                  </div>
                </section>
              )}

              {resettingPasswordBarberId ===
                barber.id && (
                <section className="admin-reset-password-form">
                  <div className="admin-reset-password-heading">
                    <h4>Şifre Sıfırla</h4>

                    <p>
                      {barber.name} {barber.surname} için
                      yeni geçici şifre belirleyin.
                    </p>
                  </div>

                  <label>
                    Yeni Geçici Şifre

                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="En az 8 karakter"
                      value={resetPasswordValue}
                      onChange={(event) => {
                        setResetPasswordValue(
                          event.target.value
                        );

                        setMessage("");
                        setResetPasswordResult("");
                      }}
                    />
                  </label>

                  <p className="admin-reset-password-help">
                    Berber bu şifreyle giriş yaptıktan sonra
                    kendi şifresini değiştirmek zorunda
                    olacaktır.
                  </p>

                  <div className="admin-reset-password-actions">
                    <button
                      type="button"
                      className="admin-reset-password-save"
                      onClick={() =>
                        resetBarberPassword(barber)
                      }
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword
                        ? "Sıfırlanıyor..."
                        : "Şifreyi Sıfırla"}
                    </button>

                    <button
                      type="button"
                      className="admin-reset-password-cancel"
                      onClick={cancelResettingPassword}
                      disabled={isResettingPassword}
                    >
                      Vazgeç
                    </button>
                  </div>

                    {resetPasswordResult && (
                      <div className="admin-reset-password-result">

                        <div className="admin-reset-password-top">

                          <div>

                            <strong>
                              Yeni Geçici Şifre
                            </strong>

                            <h3>
                              {resetPasswordResult}
                            </h3>

                          </div>

                          <button
                            type="button"
                            className="copy-password-button"
                            onClick={copyTemporaryPassword}
                          >
                            📋 Kopyala
                          </button>

                        </div>

                        {copiedPassword && (
                          <p className="password-copied-message">
                            ✓ Şifre panoya kopyalandı.
                          </p>
                        )}

                        <p>
                          Bu şifreyi güvenli şekilde
                          berbere iletin.
                        </p>

                      </div>
                    )}
                </section>
              )}

              {openedAppointmentBarberId === barber.id && (
                <section className="admin-barber-appointments-panel">
                  <div className="admin-barber-appointments-heading">
                    <div>
                      <h4>
                        {appointmentBarber?.name}{" "}
                        {appointmentBarber?.surname} Randevuları
                      </h4>

                      <p>
                        Bu berbere ait kayıtlı randevular.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-close-appointments-button"
                      onClick={() => {
                        setOpenedAppointmentBarberId(null);
                        setSelectedBarberAppointments([]);
                        setAppointmentBarber(null);
                      }}
                    >
                      Kapat
                    </button>
                  </div>

                  {loadingAppointments ? (
                    <p className="admin-barber-message">
                      Randevular yükleniyor...
                    </p>
                  ) : selectedBarberAppointments.length === 0 ? (
                    <p className="admin-barber-message">
                      Bu berbere ait randevu bulunmuyor.
                    </p>
                  ) : (
                    <div className="admin-selected-appointments-list">
                      {selectedBarberAppointments.map(
                        (appointment) => (
                          <article
                            key={appointment.id}
                            className="admin-selected-appointment-card"
                          >
                            <div className="admin-selected-appointment-header">
                              <div>
                                <span>
                                  Randevu #{appointment.id}
                                </span>

                                <h5>
                                  {appointment.name}{" "}
                                  {appointment.surname}
                                </h5>
                              </div>
                            </div>

                            <div className="admin-selected-appointment-info">
                              <div>
                                <small>Tarih</small>

                                <strong>
                                  {appointment.appointment_date}
                                </strong>
                              </div>

                              <div>
                                <small>Saat</small>

                                <strong>
                                  {appointment.appointment_time}
                                </strong>
                              </div>

                              <div>
                                <small>Telefon</small>

                                <strong>
                                  {appointment.phone}
                                </strong>
                              </div>
                            </div>


                           <div className="admin-selected-appointment-actions">
                           <button
                            type="button"
                            className="admin-edit-appointment-button"
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
                            className="admin-delete-appointment-button"
                            onClick={() =>
                              deleteBarberAppointment(
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
                          <section className="admin-appointment-edit-form">
                            <div className="admin-appointment-edit-heading">
                              <h6>Randevuyu Düzenle</h6>

                              <p>
                                Yeni tarihi seçtikten sonra müsait
                                saatleri görüntüleyin.
                              </p>
                            </div>

                            <label>
                              Yeni Tarih

                              <input
                                type="date"
                                value={editAppointmentDate}
                                onChange={(event) => {
                                  setEditAppointmentDate(
                                    event.target.value
                                  );

                                  setEditAppointmentTime("");
                                  setEditAvailableTimes([]);
                                  setMessage("");
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              className="admin-show-edit-times-button"
                              onClick={() =>
                                loadEditAvailableTimes(
                                  appointment
                                )
                              }
                              disabled={
                                isEditTimesLoading ||
                                !editAppointmentDate
                              }
                            >
                              {isEditTimesLoading
                                ? "Saatler Yükleniyor..."
                                : "Müsait Saatleri Göster"}
                            </button>

                            {editAvailableTimes.length > 0 && (
                              <div className="admin-edit-time-list">
                                {editAvailableTimes.map((time) => (
                                  <button
                                    type="button"
                                    key={time}
                                    className={
                                      editAppointmentTime === time
                                        ? "time-button selected"
                                        : "time-button"
                                    }
                                    onClick={() =>
                                      setEditAppointmentTime(time)
                                    }
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            )}

                            {editAppointmentTime && (
                              <p className="admin-selected-edit-time">
                                Seçilen yeni saat:{" "}
                                <strong>
                                  {editAppointmentTime}
                                </strong>
                              </p>
                            )}

                            <div className="admin-appointment-edit-actions">
                              <button
                                type="button"
                                className="admin-save-appointment-edit"
                                onClick={() =>
                                  updateSelectedAppointment(
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
                                className="admin-cancel-appointment-edit"
                                onClick={cancelEditingAppointment}
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
              )}
              {selectedWorkingHoursBarber && (
                <section className="admin-working-hours-section">

                  <div className="admin-working-hours-header">

                    <div>
                      <h3>
                        {selectedWorkingHoursBarber.name}{" "}
                        {selectedWorkingHoursBarber.surname}
                      </h3>

                      <p>Çalışma Saatleri</p>
                    </div>

                    <button
                      type="button"
                      className="close-working-hours-button"
                      onClick={() => {
                        setSelectedWorkingHoursBarber(null);
                        setWorkingHours([]);
                      }}
                    >
                      Kapat
                    </button>

                  </div>

                  {loadingWorkingHours ? (

                    <p>Çalışma saatleri yükleniyor...</p>

                  ) : (

                    <div className="admin-working-hours-list">

                      {workingHours.map((day) => (

                        <article
                          key={day.id}
                          className="admin-working-day-card"
                        >

                      <h4>{day.day_name}</h4>

                        <label className="working-switch">

                        <input
                        type="checkbox"

                        checked={day.is_open}

                        onChange={(event)=>
                        updateWorkingHourField(
                        day.id,
                        "is_open",
                        event.target.checked
                        )
                        }
                        />

                        Açık
                        </label>

                        {day.is_open && (

                        <>

                        <label>

                        Açılış

                        <input

                        type="time"

                        value={day.opening_time || ""}

                        onChange={(event)=>

                        updateWorkingHourField(

                        day.id,

                        "opening_time",

                        event.target.value

                        )

                        }

                        />

                        </label>

                        <label>

                        Kapanış

                        <input

                        type="time"

                        value={day.closing_time || ""}

                        onChange={(event)=>

                        updateWorkingHourField(

                        day.id,

                        "closing_time",

                        event.target.value

                        )

                        }

                        />

                        </label>

                        </>

                        )}

                        <button

                        type="button"

                        className="save-working-hour-button"

                        onClick={()=>

                        saveWorkingHour(day)

                        }

                        disabled={

                        updatingWorkingHourId===day.id

                        }

                        >

                        {updatingWorkingHourId===day.id

                        ? "Kaydediliyor..."

                        : "Kaydet"}

                        </button>

                        </article>

                      ))}

                    </div>

                  )}

                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BarberManagement;