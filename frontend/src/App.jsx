import { useEffect, useState } from "react";
import "./App.css";

import HomePage from "./components/HomePage";
import BookingPage from "./components/BookingPage";
import ManageAppointment from "./components/ManageAppointment";

import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import AdminChangePassword from "./components/AdminChangePassword";
import BarberPanel from "./components/BarberPanel";

import {
  clearAdminSession,
} from "./utils/adminAuth";

function App() {
  /*
    Açık olan sayfayı tutar.

    home:
    Ana sayfa

    customer:
    Randevu oluşturma

    manage:
    Müşteri randevu yönetimi

    staff:
    Admin veya berber giriş alanı
  */
  const [currentPage, setCurrentPage] =
    useState("home");

  /*
    Hem admin hem berber aynı token
    alanını kullanıyor.
  */
  const [
    isStaffLoggedIn,
    setIsStaffLoggedIn,
  ] = useState(
    localStorage.getItem("adminToken") !== null
  );

  /*
    Giriş yapan hesabın rolü:

    admin
    barber
  */
  const [staffRole, setStaffRole] =
    useState(
      localStorage.getItem("adminRole") || ""
    );

  const [
    mustChangePassword,
    setMustChangePassword,
  ] = useState(
    localStorage.getItem(
      "adminMustChangePassword"
    ) === "true"
  );

  const [
    authMessage,
    setAuthMessage,
  ] = useState("");

  /*
    Token geçersiz veya süresi dolmuşsa
    adminAuth.js bu olayı gönderir.

    Olayın adı eski sistemle uyumluluk için
    aynı bırakılmıştır.
  */
  useEffect(() => {
    function handleSessionExpired() {
      setIsStaffLoggedIn(false);
      setStaffRole("");
      setMustChangePassword(false);

      setAuthMessage(
        "Oturum süreniz doldu. Lütfen tekrar giriş yapın."
      );

      setCurrentPage("staff");
    }

    window.addEventListener(
      "admin-session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "admin-session-expired",
        handleSessionExpired
      );
    };
  }, []);

  /*
    Admin veya berber çıkış yaptığında
    bütün oturum bilgilerini temizler.
  */
  function logoutStaff() {
    clearAdminSession();

    localStorage.removeItem(
      "adminMustChangePassword"
    );

    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminBarberId");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminToken");

    setIsStaffLoggedIn(false);
    setStaffRole("");
    setMustChangePassword(false);
    setAuthMessage("");

    setCurrentPage("home");
  }

  /*
    Giriş başarılı olduğunda AdminLogin
    bileşeni kullanıcı nesnesini buraya gönderir.
  */
  function handleLogin(user) {
    setIsStaffLoggedIn(true);
    setStaffRole(user.role);

    setMustChangePassword(
      Boolean(user.mustChangePassword)
    );

    setAuthMessage("");
  }

  /*
    Admin veya berber panelinin ortak
    üst bölümüdür.
  */
  function renderStaffHeader() {
    return (
      <div className="admin-header">
        <span>
          Hoş geldiniz,{" "}
          {localStorage.getItem(
            "adminUsername"
          )}
        </span>

        <button
          type="button"
          className="logout-button"
          onClick={logoutStaff}
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  /*
    Giriş yapan kişinin rolüne göre
    doğru paneli gösterir.
  */
  function renderStaffPanel() {
    if (staffRole === "admin") {
      return (
        <>
          {renderStaffHeader()}
          <AdminPanel />
        </>
      );
    }

    if (staffRole === "barber") {
      return (
        <>
          {renderStaffHeader()}
          <BarberPanel />
        </>
      );
    }

    return (
      <div className="admin-login">
        <p>
          Hesap rolü belirlenemedi. Lütfen
          yeniden giriş yapın.
        </p>

        <button
          type="button"
          onClick={logoutStaff}
        >
          Oturumu Kapat
        </button>
      </div>
    );
  }

  return (
    <>
      <nav className="main-navigation">
        <button
          type="button"
          onClick={() =>
            setCurrentPage("home")
          }
        >
          Ana Sayfa
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentPage("staff")
          }
        >
          Personel Girişi
        </button>
      </nav>

      {currentPage === "home" ? (
        <HomePage
          onBookAppointment={() =>
            setCurrentPage("customer")
          }
        />
      ) : currentPage === "staff" ? (
        isStaffLoggedIn ? (
          mustChangePassword ? (
            <AdminChangePassword
              onPasswordChanged={() => {
                setMustChangePassword(false);

                localStorage.setItem(
                  "adminMustChangePassword",
                  "false"
                );
              }}
            />
          ) : (
            renderStaffPanel()
          )
        ) : (
          <AdminLogin
            initialMessage={authMessage}
            onLogin={handleLogin}
          />
        )
      ) : currentPage === "manage" ? (
        <ManageAppointment
          onBackToBooking={() =>
            setCurrentPage("customer")
          }
        />
      ) : (
        <BookingPage
          onManageAppointment={() =>
            setCurrentPage("manage")
          }
          onGoHome={() =>
            setCurrentPage("home")
          }
        />
      )}
    </>
  );
}

export default App;