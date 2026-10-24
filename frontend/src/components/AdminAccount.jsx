import { useState } from "react";

import AdminChangePassword from
  "./AdminChangePassword";

import {
  handleUnauthorizedResponse,
} from "../utils/adminAuth";

function AdminAccount() {
  const storedUsername =
    localStorage.getItem(
      "adminUsername"
    ) || "";

  const [username, setUsername] =
    useState(storedUsername);

  const [
    usernameMessage,
    setUsernameMessage,
  ] = useState("");

  const [
    isUsernameSaving,
    setIsUsernameSaving,
  ] = useState(false);

  async function updateUsername() {
    const normalizedUsername =
      username.trim().toLowerCase();

    if (!normalizedUsername) {
      setUsernameMessage(
        "Kullanıcı adı zorunludur."
      );
      return;
    }

    if (
      !/^[a-z0-9._-]{3,30}$/.test(
        normalizedUsername
      )
    ) {
      setUsernameMessage(
        "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir."
      );
      return;
    }

    try {
      setIsUsernameSaving(true);

      setUsernameMessage(
        "Kullanıcı adı güncelleniyor..."
      );

      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        setUsernameMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );
        return;
      }

      const response = await fetch(
        "http://localhost:3000/auth/update-username",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            username:
              normalizedUsername,
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
        setUsernameMessage(
          data.message ||
            "Kullanıcı adı güncellenemedi."
        );
        return;
      }

      localStorage.setItem(
        "adminUsername",
        data.admin.username
      );

      setUsername(
        data.admin.username
      );

      setUsernameMessage(
        data.message ||
          "Kullanıcı adı başarıyla güncellendi."
      );
    } catch (error) {
      console.error(
        "Yönetici kullanıcı adı güncelleme hatası:",
        error
      );

      setUsernameMessage(
        "Sunucuya bağlanılamadı."
      );
    } finally {
      setIsUsernameSaving(false);
    }
  }

  return (
    <section className="admin-account">
      <div className="admin-account-heading">
        <div>
          <h2>Hesabım</h2>

          <p>
            Yönetici hesap bilgilerinizi
            görüntüleyin ve şifrenizi
            yönetin.
          </p>
        </div>
      </div>

      <div className="admin-account-grid">
        <article className="admin-account-information-card">
          <div className="admin-account-avatar">
            {username
              .charAt(0)
              .toLocaleUpperCase(
                "tr-TR"
              )}
          </div>

          <div className="admin-account-user-heading">
            <span>
              İşletme Yöneticisi
            </span>

            <h3>{username}</h3>

            <p>
              Bu hesap işletmedeki
              personelleri, istatistikleri
              ve yönetim ayarlarını
              kontrol edebilir.
            </p>
          </div>

          <div className="admin-account-details">
            <div>
              <small>
                Kullanıcı Adı
              </small>

              <input
                type="text"
                maxLength={30}
                value={username}
                onChange={(event) => {
                  const value =
                    event.target.value
                      .toLowerCase()
                      .replace(
                        /\s/g,
                        ""
                      );

                  setUsername(value);
                  setUsernameMessage("");
                }}
              />

              <button
                type="button"
                className="admin-account-username-save"
                onClick={updateUsername}
                disabled={
                  isUsernameSaving
                }
              >
                {isUsernameSaving
                  ? "Kaydediliyor..."
                  : "Kullanıcı Adını Kaydet"}
              </button>

              {usernameMessage && (
                <p className="admin-account-username-message">
                  {usernameMessage}
                </p>
              )}
            </div>

            <div>
              <small>
                Hesap Türü
              </small>

              <strong>
                Süper Yönetici
              </strong>
            </div>

            <div>
              <small>
                Yetki Durumu
              </small>

              <strong className="admin-account-active">
                Aktif
              </strong>
            </div>
          </div>
        </article>

        <AdminChangePassword
          isRequired={false}
        />
      </div>
    </section>
  );
}

export default AdminAccount;