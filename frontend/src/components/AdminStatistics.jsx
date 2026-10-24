import { useEffect, useState } from "react";
import { handleUnauthorizedResponse } from "../utils/adminAuth";

function AdminStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [message, setMessage] = useState(
    "İstatistikler yükleniyor..."
  );

  useEffect(() => {
    fetchStatistics();
  }, []);

  async function fetchStatistics() {
    try {
      const response = await fetch(
        "http://localhost:3000/appointments/statistics",
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
            "İstatistikler alınamadı."
        );
        return;
      }

      setStatistics(data);
      setMessage("");
    } catch (error) {
      console.error(error);

      setMessage("Sunucuya bağlanılamadı.");
    }
  }

  if (message) {
    return <p>{message}</p>;
  }


  const maximumAppointmentCount =
  statistics.appointmentsByDay.length > 0
    ? Math.max(
        ...statistics.appointmentsByDay.map(
          (item) => item.appointment_count
        )
      )
    : 0;

  return (
    <div className="admin-statistics">
      <h2>İstatistikler</h2>

      <div className="statistics-cards">
        <div className="statistics-card">
          <h3>En Yoğun Gün</h3>

         <p>
  {statistics.busiestDay
    ? statistics.busiestDay.day_name
    : "Veri yok"}
</p>

          <span>
  {statistics.busiestDay
    ? `${statistics.busiestDay.appointment_count} randevu`
    : "Henüz randevu bulunmuyor"}
</span>
        </div>

       <div className="statistics-card">
  <h3>En Yoğun Saat</h3>

  <p>
    {statistics.busiestTime
      ? statistics.busiestTime.appointment_time
      : "Veri yok"}
  </p>

  <span>
    {statistics.busiestTime
      ? `${statistics.busiestTime.appointment_count} randevu`
      : "Henüz randevu bulunmuyor"}
  </span>
</div>
      </div>

      <h3>Haftalık Dağılım</h3>

      {statistics.appointmentsByDay.map(
        (item) => (
          <div
            key={item.day_number}
            className="statistics-row"
          >
            <strong>{item.day_name}</strong>

            <div className="statistics-bar">
              <div
  className="statistics-fill"
  style={{
    width:
      maximumAppointmentCount > 0
        ? `${
            (item.appointment_count /
              maximumAppointmentCount) *
            100
          }%`
        : "0%",
  }}
/>
            </div>

            <span>
              {item.appointment_count}
            </span>
          </div>
        )
      )}
    </div>
  );
}

export default AdminStatistics;
