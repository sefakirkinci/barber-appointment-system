export function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUsername");
}

export function handleUnauthorizedResponse(response) {
  if (response.status !== 401) {
    return false;
  }

  clearAdminSession();

  window.dispatchEvent(
    new CustomEvent("admin-session-expired")
  );

  return true;
}