import { useEffect, useState } from "react";

import {
  handleUnauthorizedResponse,
} from "../utils/adminAuth";

import BarberAppointments from
  "./barber/BarberAppointments";


import BarberProfile from
  "./barber/BarberProfile";  

import BarberDateOverrides from
  "./barber/BarberDateOverrides";

function BarberPanel() {

  const [activeSection, setActiveSection] =
  useState("appointments");

  /*
    Berberin haftalık çalışma saatlerini tutar.
  */
  const [workingHours, setWorkingHours] =
    useState([]);

  /*
    Çalışma saatleri alanında gösterilecek
    yüklenme, başarı veya hata mesajını tutar.
  */
  const [
    workingHoursMessage,
    setWorkingHoursMessage,
  ] = useState(
    "Çalışma saatleri yükleniyor..."
  );

  /*
    Çalışma saatleri backend'den alınırken
    butonları geçici olarak devre dışı bırakır.
  */
  const [
    isWorkingHoursLoading,
    setIsWorkingHoursLoading,
  ] = useState(true);

  /*
    Hangi çalışma günü kaydediliyorsa onun
    id değerini tutar.

    Böylece yalnızca ilgili günün butonunda
    "Kaydediliyor..." yazısı görünür.
  */
  const [
    savingWorkingHourId,
    setSavingWorkingHourId,
  ] = useState(null);

  /*
    Giriş yapan berberin bilgilerini
    localStorage içinden alıyoruz.
  */
  const username =
    localStorage.getItem("adminUsername");

  const barberId =
    localStorage.getItem("adminBarberId");

  /*
    BarberPanel açıldığında berberin çalışma
    saatlerini backend'den getirir.

    Randevular artık BarberAppointments
    bileşeni tarafından ayrıca getiriliyor.
  */
  useEffect(() => {
    fetchOwnWorkingHours();
  }, []);

  /*
    Giriş yapan berberin kendi çalışma
    saatlerini backend'den getirir.

    Berber id değerini URL üzerinden
    göndermiyoruz. Backend, JWT token içindeki
    barberId değerini kullanıyor.
  */
  async function fetchOwnWorkingHours() {
    try {
      setIsWorkingHoursLoading(true);

      setWorkingHoursMessage(
        "Çalışma saatleri yükleniyor..."
      );

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setWorkingHoursMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );

        setWorkingHours([]);
        return;
      }

      const response = await fetch(
        "http://localhost:3000/barbers/me/working-hours",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      /*
        Token geçersiz veya süresi dolmuşsa
        mevcut yardımcı fonksiyon oturumu
        kapatıp giriş ekranına yönlendirir.
      */
      if (handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setWorkingHoursMessage(
          data.message ||
            "Çalışma saatleri alınamadı."
        );

        setWorkingHours([]);
        return;
      }

      const hours = Array.isArray(
        data.workingHours
      )
        ? data.workingHours
        : [];

      setWorkingHours(hours);

      if (hours.length === 0) {
        setWorkingHoursMessage(
          "Çalışma saati ayarı bulunamadı."
        );
      } else {
        setWorkingHoursMessage("");
      }
    } catch (error) {
      console.error(
        "Çalışma saatleri alınırken hata oluştu:",
        error
      );

      setWorkingHoursMessage(
        "Sunucuya bağlanılamadı."
      );

      setWorkingHours([]);
    } finally {
      setIsWorkingHoursLoading(false);
    }
  }

  /*
    Bir çalışma gününün açılış veya kapanış
    saati değiştiğinde yalnızca o günü
    günceller.
  */
  function updateWorkingHourState(
    id,
    field,
    value
  ) {
    setWorkingHours((previousHours) =>
      previousHours.map((workingHour) =>
        workingHour.id === id
          ? {
              ...workingHour,
              [field]: value,
            }
          : workingHour
      )
    );

    setWorkingHoursMessage("");
  }

  /*
    Berber bir günü açık veya kapalı yaptığında
    çalışma saati state'ini düzenler.
  */
  function handleOpenChange(id, isOpen) {
    setWorkingHours((previousHours) =>
      previousHours.map((workingHour) => {
        if (workingHour.id !== id) {
          return workingHour;
        }

        return {
          ...workingHour,

          is_open: isOpen,

          /*
            Gün tekrar açılıyorsa ve kayıtlı
            bir saat yoksa varsayılan değerler
            kullanılır.
          */
          opening_time: isOpen
            ? workingHour.opening_time ||
              "09:00"
            : "",

          closing_time: isOpen
            ? workingHour.closing_time ||
              "18:00"
            : "",
        };
      })
    );

    setWorkingHoursMessage("");
  }

  /*
    Seçilen çalışma gününü backend'e göndererek
    kaydeder.
  */
  async function saveWorkingHour(workingHour) {
    /*
      Gün açıksa açılış ve kapanış saatlerinin
      doldurulmuş olması gerekir.
    */
    if (
      workingHour.is_open &&
      (!workingHour.opening_time ||
        !workingHour.closing_time)
    ) {
      setWorkingHoursMessage(
        `${workingHour.day_name} için açılış ve kapanış saatini girin.`
      );

      return;
    }

    try {
      setSavingWorkingHourId(
        workingHour.id
      );

      setWorkingHoursMessage(
        `${workingHour.day_name} kaydediliyor...`
      );

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setWorkingHoursMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );

        return;
      }

      const response = await fetch(
        `http://localhost:3000/barbers/me/working-hours/${workingHour.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            /*
              Gün kapalıysa backend'e saatler
              null olarak gönderilir.
            */
            openingTime: workingHour.is_open
              ? workingHour.opening_time
              : null,

            closingTime: workingHour.is_open
              ? workingHour.closing_time
              : null,

            isOpen: workingHour.is_open,
          }),
        }
      );

      if (handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setWorkingHoursMessage(
          data.message ||
            "Çalışma saati güncellenemedi."
        );

        return;
      }

      /*
        Backend güncellenmiş çalışma günü
        bilgisini döndürürse state içindeki
        ilgili günü yeniliyoruz.
      */
      if (data.workingHour) {
        setWorkingHours(
          (previousHours) =>
            previousHours.map((item) =>
              item.id ===
              data.workingHour.id
                ? data.workingHour
                : item
            )
        );
      }

      setWorkingHoursMessage(
        data.message ||
          "Çalışma saati başarıyla güncellendi."
      );
    } catch (error) {
      console.error(
        "Çalışma saati güncelleme hatası:",
        error
      );

      setWorkingHoursMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setSavingWorkingHourId(null);
    }
  }

return (
  <main className="barber-panel">
    <section className="barber-panel-header">
      <p className="booking-label">
        Berber Paneli
      </p>

      <h1>
        Hoş geldiniz, {username}
      </h1>

      <p>
        Size ait randevuları ve haftalık
        çalışma düzeninizi buradan
        yönetebilirsiniz.
      </p>
    </section>

    <nav className="barber-panel-navigation">
      <button
        type="button"
        className={
          activeSection === "appointments"
            ? "barber-panel-navigation-button active"
            : "barber-panel-navigation-button"
        }
        onClick={() =>
          setActiveSection("appointments")
        }
      >
        Randevularım
      </button>

      <button
        type="button"
        className={
          activeSection === "working-hours"
            ? "barber-panel-navigation-button active"
            : "barber-panel-navigation-button"
        }
        onClick={() =>
          setActiveSection("working-hours")
        }
      >
        Çalışma Saatlerim
      </button>


      <button
        type="button"
        className={
          activeSection ===
          "date-overrides"
            ? "barber-panel-navigation-button active"
            : "barber-panel-navigation-button"
        }
        onClick={() =>
          setActiveSection(
            "date-overrides"
          )
        }
      >
        Özel Günler
      </button>

      <button
        type="button"
        className={
          activeSection === "account"
            ? "barber-panel-navigation-button active"
            : "barber-panel-navigation-button"
        }
        onClick={() =>
          setActiveSection("account")
        }
      >
        Hesabım
      </button>
    </nav>

    <div className="barber-panel-section-content">
      {activeSection === "appointments" && (
        <BarberAppointments />
      )}

      {activeSection === "working-hours" && (
        <section className="barber-working-hours-section">
          <div className="barber-section-heading">
            <div>
              <h2>Çalışma Saatlerim</h2>

              <p>
                Haftalık çalışma günlerinizi ve
                saatlerinizi düzenleyin.
              </p>
            </div>

            <button
              type="button"
              className="barber-refresh-button"
              onClick={fetchOwnWorkingHours}
              disabled={isWorkingHoursLoading}
            >
              {isWorkingHoursLoading
                ? "Yükleniyor..."
                : "Saatleri Yenile"}
            </button>
          </div>

          {workingHoursMessage && (
            <p className="barber-panel-message">
              {workingHoursMessage}
            </p>
          )}

          {!isWorkingHoursLoading &&
            workingHours.length > 0 && (
              <div className="barber-working-hours-list">
                {workingHours.map(
                  (workingHour) => (
                    <article
                      key={workingHour.id}
                      className={
                        workingHour.is_open
                          ? "barber-working-hour-card"
                          : "barber-working-hour-card closed"
                      }
                    >
                      <div className="barber-working-hour-day">
                        <h3>
                          {workingHour.day_name}
                        </h3>

                        <label className="barber-open-toggle">
                          <input
                            type="checkbox"
                            checked={
                              workingHour.is_open
                            }
                            onChange={(event) =>
                              handleOpenChange(
                                workingHour.id,
                                event.target.checked
                              )
                            }
                          />

                          <span>
                            {workingHour.is_open
                              ? "Açık"
                              : "Kapalı"}
                          </span>
                        </label>
                      </div>

                      <div className="barber-working-hour-fields">
                        <label>
                          Açılış

                          <input
                            type="time"
                            value={
                              workingHour.opening_time ||
                              ""
                            }
                            disabled={
                              !workingHour.is_open
                            }
                            onChange={(event) =>
                              updateWorkingHourState(
                                workingHour.id,
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
                            value={
                              workingHour.closing_time ||
                              ""
                            }
                            disabled={
                              !workingHour.is_open
                            }
                            onChange={(event) =>
                              updateWorkingHourState(
                                workingHour.id,
                                "closing_time",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          className="barber-save-hours-button"
                          disabled={
                            savingWorkingHourId ===
                            workingHour.id
                          }
                          onClick={() =>
                            saveWorkingHour(
                              workingHour
                            )
                          }
                        >
                          {savingWorkingHourId ===
                          workingHour.id
                            ? "Kaydediliyor..."
                            : "Kaydet"}
                        </button>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </section>
      )}

      {activeSection === "date-overrides" && (
  <BarberDateOverrides />
)}

      {activeSection === "account" && (
        <>
          <BarberProfile />

          <p className="barber-panel-id">
            Berber numarası:{" "}
            {barberId || "-"}
          </p>
        </>
      )}
    </div>
  </main>
);
}

export default BarberPanel;