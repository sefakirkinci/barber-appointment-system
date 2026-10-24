import {
  useEffect,
  useState,
} from "react";

import {
  handleUnauthorizedResponse,
} from "../../utils/adminAuth";

function BarberDateOverrides() {
  const [
    dateOverrides,
    setDateOverrides,
  ] = useState([]);

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);

  const [
    editingOverrideId,
    setEditingOverrideId,
  ] = useState(null);

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    openingTime,
    setOpeningTime,
  ] = useState("09:00");

  const [
    closingTime,
    setClosingTime,
  ] = useState("18:00");

  const [note, setNote] =
    useState("");

  const [message, setMessage] =
    useState(
      "Özel günler yükleniyor..."
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    deletingOverrideId,
    setDeletingOverrideId,
  ] = useState(null);

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(
      today.getMonth() + 1
    ).padStart(2, "0"),
    String(
      today.getDate()
    ).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    fetchDateOverrides();
  }, []);

  async function fetchDateOverrides() {
    try {
      setIsLoading(true);
      setMessage(
        "Özel günler yükleniyor..."
      );

      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        setMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
        setDateOverrides([]);
        return;
      }

      const response = await fetch(
        "http://localhost:3000/barbers/me/date-overrides",
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
        setMessage(
          data.message ||
            "Özel günler alınamadı."
        );
        setDateOverrides([]);
        return;
      }

      const overrideList =
        Array.isArray(
          data.dateOverrides
        )
          ? data.dateOverrides
          : [];

      setDateOverrides(
        overrideList
      );

      if (
        overrideList.length === 0
      ) {
        setMessage(
          "Henüz özel gün veya izin kaydınız bulunmuyor."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error(
        "Özel günler alınırken hata oluştu:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );
      setDateOverrides([]);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEditingOverrideId(null);
    setStartDate("");
    setEndDate("");
    setIsOpen(false);
    setOpeningTime("09:00");
    setClosingTime("18:00");
    setNote("");
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
    setMessage("");
  }

  function closeForm() {
    setIsFormOpen(false);
    resetForm();
  }

  function startEditing(
    dateOverride
  ) {
    const normalizedDate =
      dateOverride.override_date
        .split("T")[0];

    setEditingOverrideId(
      dateOverride.id
    );

    setStartDate(
      normalizedDate
    );

    setEndDate(
      normalizedDate
    );

    setIsOpen(
      dateOverride.is_open
    );

    setOpeningTime(
      dateOverride.opening_time ||
        "09:00"
    );

    setClosingTime(
      dateOverride.closing_time ||
        "18:00"
    );

    setNote(
      dateOverride.note || ""
    );

    setIsFormOpen(true);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getDatesBetween(
    start,
    end
  ) {
    const dates = [];

    const currentDate =
      new Date(`${start}T00:00:00`);

    const finalDate =
      new Date(`${end}T00:00:00`);

    while (
      currentDate <= finalDate
    ) {
      const dateString = [
        currentDate.getFullYear(),
        String(
          currentDate.getMonth() + 1
        ).padStart(2, "0"),
        String(
          currentDate.getDate()
        ).padStart(2, "0"),
      ].join("-");

      dates.push(dateString);

      currentDate.setDate(
        currentDate.getDate() + 1
      );
    }

    return dates;
  }

  async function saveDateOverride() {
    if (
      !startDate ||
      !endDate
    ) {
      setMessage(
        "Lütfen başlangıç ve bitiş tarihlerini seçin."
      );
      return;
    }

    if (
      startDate < minimumDate ||
      endDate < minimumDate
    ) {
      setMessage(
        "Geçmiş tarihler için özel gün ayarı oluşturamazsınız."
      );
      return;
    }

    if (
      endDate < startDate
    ) {
      setMessage(
        "Bitiş tarihi başlangıç tarihinden önce olamaz."
      );
      return;
    }

    if (
      isOpen &&
      (!openingTime ||
        !closingTime)
    ) {
      setMessage(
        "Açık günlerde açılış ve kapanış saatleri zorunludur."
      );
      return;
    }

    if (
      isOpen &&
      openingTime >= closingTime
    ) {
      setMessage(
        "Açılış saati kapanış saatinden önce olmalıdır."
      );
      return;
    }

    if (
      note.trim().length > 150
    ) {
      setMessage(
        "Açıklama en fazla 150 karakter olabilir."
      );
      return;
    }

    try {
      setIsSaving(true);

      setMessage(
        editingOverrideId
          ? "Özel gün güncelleniyor..."
          : "Tarih aralığı kaydediliyor..."
      );

      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        setMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
        return;
      }

      const payload = {
        isOpen,

        openingTime: isOpen
          ? openingTime
          : null,

        closingTime: isOpen
          ? closingTime
          : null,

        note:
          note.trim() || null,
      };

      const isEditing =
        editingOverrideId !== null;

      if (isEditing) {
        const response = await fetch(
          `http://localhost:3000/barbers/me/date-overrides/${editingOverrideId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              ...payload,
              overrideDate:
                startDate,
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
          setMessage(
            data.message ||
              "Özel gün güncellenemedi."
          );
          return;
        }

        await fetchDateOverrides();
        closeForm();

        setMessage(
          data.message ||
            "Özel gün başarıyla güncellendi."
        );

        return;
      }

      const selectedDates =
        getDatesBetween(
          startDate,
          endDate
        );

      let savedCount = 0;

      for (
        const selectedDate
        of selectedDates
      ) {
        const response = await fetch(
          "http://localhost:3000/barbers/me/date-overrides",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              ...payload,
              overrideDate:
                selectedDate,
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
          await fetchDateOverrides();

          setMessage(
            `${formatDate(
              selectedDate
            )} tarihi kaydedilemedi: ${
              data.message ||
              "Bilinmeyen hata oluştu."
            }`
          );

          return;
        }

        savedCount += 1;
      }

      await fetchDateOverrides();
      closeForm();

      setMessage(
        `${savedCount} günlük özel tarih ayarı başarıyla kaydedildi.`
      );
    } catch (error) {
      console.error(
        "Özel gün kaydetme hatası:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteDateOverride(
    dateOverride
  ) {
    const confirmed =
      window.confirm(
        `${formatDate(
          dateOverride.override_date
        )} tarihli özel gün ayarını kaldırmak istediğinize emin misiniz?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingOverrideId(
        dateOverride.id
      );

      setMessage(
        "Özel gün ayarı kaldırılıyor..."
      );

      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        setMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
        return;
      }

      const response = await fetch(
        `http://localhost:3000/barbers/me/date-overrides/${dateOverride.id}`,
        {
          method: "DELETE",

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
        setMessage(
          data.message ||
            "Özel gün ayarı kaldırılamadı."
        );
        return;
      }

      setDateOverrides(
        (previousOverrides) =>
          previousOverrides.filter(
            (item) =>
              item.id !==
              dateOverride.id
          )
      );

      if (
        editingOverrideId ===
        dateOverride.id
      ) {
        closeForm();
      }

      setMessage(
        data.message ||
          "Özel gün ayarı kaldırıldı."
      );
    } catch (error) {
      console.error(
        "Özel gün silme hatası:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setDeletingOverrideId(
        null
      );
    }
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const normalizedDate =
      date.split("T")[0];

    const [year, month, day] =
      normalizedDate.split("-");

    if (
      !year ||
      !month ||
      !day
    ) {
      return date;
    }

    return `${day}.${month}.${year}`;
  }

  return (
    <section className="barber-date-overrides-section">
      <div className="barber-section-heading">
        <div>
          <h2>
            Özel Günler ve İzinler
          </h2>

          <p>
            Gelecekte izinli olacağınız
            günleri veya farklı saatlerde
            çalışacağınız tarihleri
            yönetin.
          </p>
        </div>

        <div className="barber-date-override-heading-actions">
          <button
            type="button"
            className="barber-create-date-override-button"
            onClick={() => {
              if (isFormOpen) {
                closeForm();
              } else {
                openCreateForm();
              }
            }}
          >
            {isFormOpen
              ? "Formu Kapat"
              : "+ Yeni Özel Gün"}
          </button>

          <button
            type="button"
            className="barber-refresh-button"
            onClick={
              fetchDateOverrides
            }
            disabled={isLoading}
          >
            {isLoading
              ? "Yükleniyor..."
              : "Listeyi Yenile"}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <section className="barber-date-override-form-card">
          <div className="barber-date-override-form-heading">
            <h3>
              {editingOverrideId
                ? "Özel Günü Düzenle"
                : "Yeni Özel Gün"}
            </h3>

            <p>
              Belirli bir tarihi veya tarih
              aralığını kapatın ya da farklı
              çalışma saatleri belirleyin.
            </p>
          </div>

          <div className="barber-date-override-form-grid">
            <label>
              Başlangıç Tarihi

              <input
                type="date"
                min={minimumDate}
                value={startDate}
                onChange={(event) => {
                  const selectedDate =
                    event.target.value;

                  setStartDate(
                    selectedDate
                  );

                  if (
                    !endDate ||
                    endDate <
                      selectedDate
                  ) {
                    setEndDate(
                      selectedDate
                    );
                  }

                  setMessage("");
                }}
              />
            </label>

            {!editingOverrideId && (
              <label>
                Bitiş Tarihi

                <input
                  type="date"
                  min={
                    startDate ||
                    minimumDate
                  }
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(
                      event.target.value
                    );

                    setMessage("");
                  }}
                />
              </label>
            )}

            <label>
              Günün Durumu

              <select
                value={
                  isOpen
                    ? "open"
                    : "closed"
                }
                onChange={(event) => {
                  const nextIsOpen =
                    event.target.value ===
                    "open";

                  setIsOpen(
                    nextIsOpen
                  );

                  setMessage("");
                }}
              >
                <option value="closed">
                  Kapalı / İzinli
                </option>

                <option value="open">
                  Özel Saatlerde Açık
                </option>
              </select>
            </label>

            {isOpen && (
              <>
                <label>
                  Açılış Saati

                  <input
                    type="time"
                    value={openingTime}
                    onChange={(event) => {
                      setOpeningTime(
                        event.target.value
                      );

                      setMessage("");
                    }}
                  />
                </label>

                <label>
                  Kapanış Saati

                  <input
                    type="time"
                    value={closingTime}
                    onChange={(event) => {
                      setClosingTime(
                        event.target.value
                      );

                      setMessage("");
                    }}
                  />
                </label>
              </>
            )}

            <label className="barber-date-override-note-label">
              Açıklama

              <textarea
                maxLength={150}
                rows={3}
                placeholder={
                  isOpen
                    ? "Örneğin: Yarım gün çalışma"
                    : "Örneğin: İzinli, hastalık, tatil"
                }
                value={note}
                onChange={(event) => {
                  setNote(
                    event.target.value
                  );

                  setMessage("");
                }}
              />

              <small>
                {note.length}/150
              </small>
            </label>
          </div>

          <div className="barber-date-override-form-actions">
            <button
              type="button"
              className="barber-save-date-override-button"
              onClick={
                saveDateOverride
              }
              disabled={isSaving}
            >
              {isSaving
                ? "Kaydediliyor..."
                : editingOverrideId
                  ? "Değişiklikleri Kaydet"
                  : "Tarih Aralığını Kaydet"}
            </button>

            <button
              type="button"
              className="barber-cancel-date-override-button"
              onClick={closeForm}
              disabled={isSaving}
            >
              Vazgeç
            </button>
          </div>
        </section>
      )}

      {message && (
        <p className="barber-panel-message">
          {message}
        </p>
      )}

      {!isLoading &&
        dateOverrides.length > 0 && (
          <div className="barber-date-override-list">
            {dateOverrides.map(
              (dateOverride) => (
                <article
                  key={dateOverride.id}
                  className={
                    dateOverride.is_open
                      ? "barber-date-override-card open"
                      : "barber-date-override-card closed"
                  }
                >
                  <div className="barber-date-override-card-main">
                    <div className="barber-date-override-date">
                      <small>
                        Özel Tarih
                      </small>

                      <h3>
                        {formatDate(
                          dateOverride.override_date
                        )}
                      </h3>
                    </div>

                    <span
                      className={
                        dateOverride.is_open
                          ? "barber-date-override-status open"
                          : "barber-date-override-status closed"
                      }
                    >
                      {dateOverride.is_open
                        ? "Özel Saatlerde Açık"
                        : "Kapalı / İzinli"}
                    </span>
                  </div>

                  <div className="barber-date-override-information">
                    {dateOverride.is_open ? (
                      <div>
                        <small>
                          Çalışma Saatleri
                        </small>

                        <strong>
                          {dateOverride.opening_time}{" "}
                          -{" "}
                          {dateOverride.closing_time}
                        </strong>
                      </div>
                    ) : (
                      <div>
                        <small>
                          Çalışma Durumu
                        </small>

                        <strong>
                          Bu tarihte randevu
                          alınamaz.
                        </strong>
                      </div>
                    )}

                    <div>
                      <small>
                        Açıklama
                      </small>

                      <strong>
                        {dateOverride.note ||
                          "Açıklama eklenmedi."}
                      </strong>
                    </div>
                  </div>

                  <div className="barber-date-override-card-actions">
                    <button
                      type="button"
                      className="barber-edit-date-override-button"
                      onClick={() =>
                        startEditing(
                          dateOverride
                        )
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="barber-delete-date-override-button"
                      onClick={() =>
                        deleteDateOverride(
                          dateOverride
                        )
                      }
                      disabled={
                        deletingOverrideId ===
                        dateOverride.id
                      }
                    >
                      {deletingOverrideId ===
                      dateOverride.id
                        ? "Kaldırılıyor..."
                        : "Ayarı Kaldır"}
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
    </section>
  );
}

export default BarberDateOverrides;