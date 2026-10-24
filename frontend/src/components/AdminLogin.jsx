import { useState } from "react";

function AdminLogin({
  onLogin,
  initialMessage = "",
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState(initialMessage);

  async function login() {
    if (!username.trim() || !password) {
      setMessage(
        "Kullanıcı adı ve şifre zorunludur."
      );
      return;
    }

    try {
      setMessage("Giriş yapılıyor...");

      const response = await fetch(
        "http://localhost:3000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Giriş başarısız."
        );
        return;
      }

      /*
        Yeni backend cevabında asıl kullanıcı
        bilgisi data.user içinde bulunuyor.

        Geriye uyumluluk için data.admin
        kontrolünü de bırakıyoruz.
      */
      const loggedInUser =
        data.user || data.admin;

      if (!loggedInUser) {
        setMessage(
          "Kullanıcı bilgileri alınamadı."
        );
        return;
      }

      /*
        Token anahtarını değiştirmiyoruz.

        Admin ve berber için aynı token alanı
        kullanılacak.
      */
      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "adminUsername",
        loggedInUser.username
      );

      localStorage.setItem(
        "adminRole",
        loggedInUser.role
      );

      localStorage.setItem(
        "adminMustChangePassword",
        String(
          loggedInUser.mustChangePassword
        )
      );

      /*
        Admin hesabında barberId null olur.

        Berber hesabında kendi berber id değeri
        bulunur.
      */
      if (loggedInUser.barberId) {
        localStorage.setItem(
          "adminBarberId",
          String(loggedInUser.barberId)
        );
      } else {
        localStorage.removeItem(
          "adminBarberId"
        );
      }

      setMessage("");

      /*
        App.jsx dosyasına giriş yapan
        kullanıcının tamamını gönderiyoruz.
      */
      onLogin(loggedInUser);
    } catch (error) {
      console.error(
        "Personel giriş hatası:",
        error
      );

      setMessage("Sunucuya bağlanılamadı.");
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      login();
    }
  }

  return (
    <div className="admin-login">
      <h2>Personel Girişi</h2>

      <p>
        Yönetici veya berber hesabınızla giriş
        yapın.
      </p>

      <input
        type="text"
        placeholder="Kullanıcı Adı"
        value={username}
        autoComplete="username"
        onChange={(event) =>
          setUsername(event.target.value)
        }
        onKeyDown={handleKeyDown}
      />

      <input
        type="password"
        placeholder="Şifre"
        value={password}
        autoComplete="current-password"
        onChange={(event) =>
          setPassword(event.target.value)
        }
        onKeyDown={handleKeyDown}
      />

      <button
        type="button"
        onClick={login}
      >
        Giriş Yap
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminLogin;