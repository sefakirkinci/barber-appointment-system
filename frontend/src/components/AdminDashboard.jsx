import { useEffect, useState } from "react";
import {
  handleUnauthorizedResponse,
} from "../utils/adminAuth";


function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState(
    "Dashboard yükleniyor..."
  );



  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const response = await fetch(
  "http://localhost:3000/appointments/dashboard",
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem(
        "adminToken"
      )}`,
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
            "Dashboard bilgileri alınamadı."
        );
        return;
      }

      setSummary(data);
      setMessage("");
    } catch (error) {
      console.error(error);

      setMessage("Sunucuya bağlanılamadı.");
    }
  }

  if (message) {
    return <p>{message}</p>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Dashboard</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Bugünkü Randevu</h3>

          <p>{summary.today_appointments}</p>
        </div>

        <div className="dashboard-card">
          <h3>Bu Hafta</h3>

          <p>{summary.week_appointments}</p>
        </div>

        <div className="dashboard-card">
          <h3>Toplam</h3>

          <p>{summary.total_appointments}</p>
        </div>

        <div className="dashboard-card">
          <h3>Sonraki Randevu</h3>

          <p>
            {summary.next_appointment_date
              ? `${summary.next_appointment_date} ${summary.next_appointment_time}`
              : "Yaklaşan randevu yok"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;