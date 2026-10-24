import { useEffect, useState } from "react";

import {
  handleUnauthorizedResponse,
} from "../../utils/adminAuth";

function BarberProfile() {
  /*
    Backend'den alınan profil bilgileri.
  */
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    phone: "",
    whatsappNumber: "",
    username: "",
  });

  const [profileMessage, setProfileMessage] =
    useState("Hesap bilgileri yükleniyor...");

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  const [isProfileSaving, setIsProfileSaving] =
    useState(false);

  /*
    Şifre değiştirme alanları.
  */
  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    isPasswordSaving,
    setIsPasswordSaving,
  ] = useState(false);

  useEffect(() => {
    fetchOwnProfile();
  }, []);

  /*
    Giriş yapan berberin profil bilgilerini
    backend'den getirir.
  */
  async function fetchOwnProfile() {
    try {
      setIsProfileLoading(true);

      setProfileMessage(
        "Hesap bilgileri yükleniyor..."
      );

      const token =
        localStorage.getItem("adminToken");

      if (!token) {
        setProfileMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
        return;
      }

      const response = await fetch(
        "http://localhost:3000/barbers/me/profile",
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
        setProfileMessage(
          data.message ||
            "Hesap bilgileri alınamadı."
        );
        return;
      }

      const barber = data.barber;

      setProfile({
        name: barber.name || "",
        surname: barber.surname || "",
        phone: barber.phone || "",
        whatsappNumber:
          barber.whatsapp_number || "",
        username: barber.username || "",
      });

      setProfileMessage("");
    } catch (error) {
      console.error(
        "Hesap bilgileri alınırken hata oluştu:",
        error
      );

      setProfileMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsProfileLoading(false);
    }
  }

  /*
    Profil formundaki alanları değiştirir.
  */
  function handleProfileChange(field, value) {
    setProfile((previousProfile) => ({
      ...previousProfile,
      [field]: value,
    }));

    setProfileMessage("");
  }

  /*
    Profil bilgilerini backend'e gönderir.
  */
  async function saveProfile() {
const {
  name,
  surname,
  phone,
  whatsappNumber,
  username,
} = profile;

   if (
  !name.trim() ||
  !surname.trim() ||
  !phone ||
  !whatsappNumber ||
  !username.trim()
) {
  setProfileMessage(
    "Lütfen tüm hesap bilgilerini doldurun."
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
  setProfileMessage(
    "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir."
  );
  return;
}

    if (!/^0\d{10}$/.test(phone)) {
      setProfileMessage(
        "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır."
      );
      return;
    }

    if (!/^90\d{10}$/.test(whatsappNumber)) {
      setProfileMessage(
        "WhatsApp numarası 90 ile başlamalı ve 12 haneli olmalıdır."
      );
      return;
    }

    try {
      setIsProfileSaving(true);

      setProfileMessage(
        "Hesap bilgileri kaydediliyor..."
      );

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        "http://localhost:3000/barbers/me/profile",
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

      if (handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(
          data.message ||
            "Hesap bilgileri güncellenemedi."
        );
        return;
      }

      if (data.barber) {
        setProfile({
          name: data.barber.name || "",
          surname:
            data.barber.surname || "",
          phone: data.barber.phone || "",
          whatsappNumber:
            data.barber.whatsapp_number || "",
          username:
            data.barber.username || "",
        });

        localStorage.setItem(
        "adminUsername",
        data.barber.username
      );
      }

      setProfileMessage(
        data.message ||
          "Hesap bilgileriniz başarıyla güncellendi."
      );
    } catch (error) {
      console.error(
        "Hesap güncelleme hatası:",
        error
      );

      setProfileMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsProfileSaving(false);
    }
  }

  /*
    Giriş yapan berberin şifresini değiştirir.
  */
  async function changePassword() {
    if (!newPassword || !confirmNewPassword) {
      setPasswordMessage(
        "Yeni şifre ve şifre tekrarı zorunludur."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "Yeni şifre en az 8 karakter olmalıdır."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage(
        "Yeni şifreler birbiriyle eşleşmiyor."
      );
      return;
    }

    try {
      setIsPasswordSaving(true);

      setPasswordMessage(
        "Şifre değiştiriliyor..."
      );

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        "http://localhost:3000/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newPassword,
          }),
        }
      );

      if (handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage(
          data.message ||
            "Şifre değiştirilemedi."
        );
        return;
      }

      setNewPassword("");
      setConfirmNewPassword("");

      localStorage.setItem(
        "adminMustChangePassword",
        "false"
      );

      setPasswordMessage(
        data.message ||
          "Şifreniz başarıyla değiştirildi."
      );
    } catch (error) {
      console.error(
        "Şifre değiştirme hatası:",
        error
      );

      setPasswordMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsPasswordSaving(false);
    }
  }

  return (
    <section className="barber-profile-section">
      <div className="barber-section-heading">
        <div>
          <h2>Hesabım</h2>

          <p>
            Kişisel bilgilerinizi ve şifrenizi
            buradan yönetebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          className="barber-refresh-button"
          onClick={fetchOwnProfile}
          disabled={isProfileLoading}
        >
          {isProfileLoading
            ? "Yükleniyor..."
            : "Bilgileri Yenile"}
        </button>
      </div>

      {profileMessage && (
        <p className="barber-panel-message">
          {profileMessage}
        </p>
      )}

      {!isProfileLoading && (
        <div className="barber-profile-grid">
          <article className="barber-profile-card">
            <div className="barber-profile-card-heading">
              <h3>Profil Bilgileri</h3>

              <p>
                Müşterilerin görebileceği iletişim
                bilgilerinizi güncelleyin.
              </p>
            </div>

            <div className="barber-profile-form">
              <label>
                Kullanıcı Adı

                <input
                  type="text"
                  value={profile.username}
                  maxLength={30}
                  onChange={(event) => {
                    const normalizedValue =
                      event.target.value
                        .toLowerCase()
                        .replace(/\s/g, "");

                    handleProfileChange(
                      "username",
                      normalizedValue
                    );
                  }}
                />
              </label>

              <div className="barber-profile-name-row">
                <label>
                  Ad

                  <input
                    type="text"
                    value={profile.name}
                    onChange={(event) =>
                      handleProfileChange(
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
                    value={profile.surname}
                    onChange={(event) =>
                      handleProfileChange(
                        "surname",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              <label>
                Telefon Numarası

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="05304785290"
                  value={profile.phone}
                  onChange={(event) => {
                    const onlyNumbers =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    handleProfileChange(
                      "phone",
                      onlyNumbers
                    );
                  }}
                />
              </label>

              <label>
                WhatsApp Numarası

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="905304785290"
                  value={
                    profile.whatsappNumber
                  }
                  onChange={(event) => {
                    const onlyNumbers =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    handleProfileChange(
                      "whatsappNumber",
                      onlyNumbers
                    );
                  }}
                />
              </label>

              <p className="barber-profile-help">
                WhatsApp numarasını ülke koduyla,
                başında artı işareti olmadan yazın.
                Örnek: 905304785290
              </p>

              <button
                type="button"
                className="barber-profile-save-button"
                onClick={saveProfile}
                disabled={isProfileSaving}
              >
                {isProfileSaving
                  ? "Kaydediliyor..."
                  : "Profil Bilgilerini Kaydet"}
              </button>
            </div>
          </article>

          <article className="barber-profile-card">
            <div className="barber-profile-card-heading">
              <h3>Şifre Değiştir</h3>

              <p>
                Hesabınızın güvenliği için güçlü
                bir şifre kullanın.
              </p>
            </div>

            <div className="barber-profile-form">
              <label>
                Yeni Şifre

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(
                      event.target.value
                    );

                    setPasswordMessage("");
                  }}
                />
              </label>

              <label>
                Yeni Şifre Tekrar

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Yeni şifreyi tekrar girin"
                  value={confirmNewPassword}
                  onChange={(event) => {
                    setConfirmNewPassword(
                      event.target.value
                    );

                    setPasswordMessage("");
                  }}
                />
              </label>

              {passwordMessage && (
                <p className="barber-password-message">
                  {passwordMessage}
                </p>
              )}

              <button
                type="button"
                className="barber-password-save-button"
                onClick={changePassword}
                disabled={isPasswordSaving}
              >
                {isPasswordSaving
                  ? "Şifre Değiştiriliyor..."
                  : "Şifreyi Değiştir"}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default BarberProfile;