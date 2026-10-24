import { useState } from "react";

import AdminAccount from
  "./AdminAccount";

import AdminDashboard from
  "./AdminDashboard";

import AdminStatistics from
  "./AdminStatistics";

import BarberManagement from
  "./BarberManagement";

function AdminPanel() {
  const [activeSection, setActiveSection] =
    useState("dashboard");

  function getNavigationButtonClass(
    sectionName
  ) {
    return activeSection === sectionName
      ? "admin-section-button active"
      : "admin-section-button";
  }

  function renderActiveSection() {
    if (activeSection === "dashboard") {
      return <AdminDashboard />;
    }

    if (activeSection === "statistics") {
      return <AdminStatistics />;
    }

    if (activeSection === "barbers") {
      return <BarberManagement />;
    }

    if (activeSection === "account") {
      return <AdminAccount />;
    }

    return <AdminDashboard />;
  }

  return (
    <main className="admin-panel">
      <div className="admin-panel-title">
        <p className="booking-label">
          İşletme Yönetimi
        </p>

        <h1>Süper Yönetici Paneli</h1>

        <p>
          Randevuları, berberleri ve işletme
          bilgilerini tek panel üzerinden
          yönetin.
        </p>
      </div>

      <nav className="admin-section-navigation">
        <button
          type="button"
          className={getNavigationButtonClass(
            "dashboard"
          )}
          onClick={() =>
            setActiveSection("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className={getNavigationButtonClass(
            "statistics"
          )}
          onClick={() =>
            setActiveSection("statistics")
          }
        >
          İstatistikler
        </button>
        
        <button
          type="button"
          className={getNavigationButtonClass(
            "account"
          )}
          onClick={() =>
            setActiveSection("account")
          }
        >
          Hesabım
        </button>
        

        <button
          type="button"
          className={getNavigationButtonClass(
            "barbers"
          )}
          onClick={() =>
            setActiveSection("barbers")
          }
        >
          Berber Yönetimi
        </button>

      </nav>

      <section className="admin-section-content">
        {renderActiveSection()}
      </section>
    </main>
  );
}

export default AdminPanel;