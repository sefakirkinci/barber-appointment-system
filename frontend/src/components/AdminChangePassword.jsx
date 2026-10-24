import { useState } from "react";

import {
  handleUnauthorizedResponse,
} from "../utils/adminAuth";

function AdminChangePassword({
  onPasswordChanged,
  isRequired = true,
}) {
  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("info");

  const [isSaving, setIsSaving] =
    useState(false);

  async function changePassword() {
    setMessage("");

    if (
      !newPassword ||
      !confirmNewPassword
    ) {
      setMessage(
        "Yeni şifre ve şifre tekrarı zorunludur."
      );

      setMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMessage(
        "Yeni şifre en az 8 karakter olmalıdır."
      );

      setMessageType("error");
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setMessage(
        "Girdiğiniz şifreler birbiriyle eşleşmiyor."
      );

      setMessageType("error");
      return;
    }

    try {
      setIsSaving(true);

      setMessage(
        "Şifreniz değiştiriliyor..."
      );

      setMessageType("info");

      const token =
        localStorage.getItem(
          "adminToken"
        );

      if (!token) {
        setMessage(
          "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın."
        );

        setMessageType("error");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/auth/change-password",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            newPassword,
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
            "Şifre değiştirilemedi."
        );

        setMessageType("error");
        return;
      }

      setNewPassword("");
      setConfirmNewPassword("");

      localStorage.setItem(
        "adminMustChangePassword",
        "false"
      );

      setMessage(
        data.message ||
          "Şifreniz başarıyla değiştirildi."
      );

      setMessageType("success");

      if (
        typeof onPasswordChanged ===
        "function"
      ) {
        onPasswordChanged();
      }
    } catch (error) {
      console.error(
        "Şifre değiştirme hatası:",
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı."
      );

      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main
      className={
        isRequired
          ? "admin-password-page"
          : "admin-password-section"
      }
    >
      <section className="admin-password-card">
        <div className="admin-password-icon">
          🔐
        </div>

        <div className="admin-password-heading">
          <p className="booking-label">
            Hesap Güvenliği
          </p>

          <h1>
            {isRequired
              ? "Şifrenizi Değiştirin"
              : "Şifre Değiştir"}
          </h1>

          <p>
            {isRequired
              ? "Güvenliğiniz için geçici şifrenizi değiştirmeniz gerekiyor."
              : "Hesabınızın güvenliği için güçlü ve yalnızca size ait bir şifre kullanın."}
          </p>
        </div>

        <div className="admin-password-form">
          <label htmlFor="admin-new-password">
            Yeni Şifre

            <input
              id="admin-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(
                  event.target.value
                );

                setMessage("");
              }}
            />
          </label>

          <label htmlFor="admin-confirm-password">
            Yeni Şifre Tekrar

            <input
              id="admin-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Yeni şifreyi tekrar girin"
              value={confirmNewPassword}
              onChange={(event) => {
                setConfirmNewPassword(
                  event.target.value
                );

                setMessage("");
              }}
            />
          </label>

          <div className="admin-password-requirements">
            <span>
              ✓ En az 8 karakter
            </span>

            <span>
              ✓ Kolay tahmin edilmeyen bir şifre
            </span>
          </div>

          {message && (
            <p
              className={`admin-password-message ${messageType}`}
            >
              {message}
            </p>
          )}

          <button
            type="button"
            className="admin-password-submit"
            onClick={changePassword}
            disabled={isSaving}
          >
            {isSaving
              ? "Şifre Değiştiriliyor..."
              : "Şifreyi Değiştir"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default AdminChangePassword;