export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = { ...options.headers }; // Start with user-provided headers

  // Only set Content-Type to application/json if it's not a FormData and not already set
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token is invalid or expired, clear it and reload to trigger redirect to login
    localStorage.removeItem('token');
    window.location.reload();
    // You might want to redirect to login page more gracefully with useNavigate
    // but window.location.reload() is simple and effective.
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'An unknown error occurred' }));
    throw new Error(errorData.msg || `HTTP error! status: ${response.status}`);
  }

  // If response has no content, return null or an empty object
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  return {}; 
};
