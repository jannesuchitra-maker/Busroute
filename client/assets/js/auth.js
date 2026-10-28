// ============================================================================
// RouteReady Campus - Authentication & Session Manager
// ============================================================================

const Auth = {
  TOKEN_KEY: 'routeready_token',
  USER_KEY: 'routeready_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },

  getDashboardUrl(role) {
    switch (role) {
      case 'driver':
        return 'driver-dashboard.html';
      case 'admin':
        return 'admin-dashboard.html';
      case 'transport_manager':
        return 'manager-dashboard.html';
      case 'student':
      default:
        return 'student-dashboard.html';
    }
  },

  // Route Guard: Call on protected pages
  guard(allowedRoles = []) {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }

    const currentRole = this.getRole();
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
      alert(`Unauthorized Access: This page requires one of [${allowedRoles.join(', ')}] permissions. You are signed in as '${currentRole}'.`);
      window.location.href = this.getDashboardUrl(currentRole);
      return false;
    }

    return true;
  }
};

window.Auth = Auth;

