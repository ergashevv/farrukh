export function getStoredAuth() {
  const token = localStorage.getItem('authToken');
  const userRaw = localStorage.getItem('authUser');
  if (!token) return null;
  try {
    return { token, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return { token, user: null };
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('authUser', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}
