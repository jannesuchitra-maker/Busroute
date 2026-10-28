// ============================================================================
// RouteReady Campus - Common UI Shell & Header/Sidebar Component Generator
// ============================================================================

const UI = {
  renderNavbar(activePage = '') {
    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (!navPlaceholder) return;

    const user = Auth.getUser();
    const isAuth = Boolean(user);
    const dashboardLink = isAuth ? Auth.getDashboardUrl(user.role) : 'login.html';

    navPlaceholder.innerHTML = `
      <nav class="navbar">
        <a href="index.html" class="nav-brand">
          <span style="font-size: 1.5rem;">🚌</span>
          <span>RouteReady <span style="color: var(--color-accent);">Campus</span></span>
          <span class="brand-badge">MRECW</span>
        </a>

        <ul class="nav-menu">
          <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a></li>
          <li><a href="routes.html" class="nav-link ${activePage === 'routes' ? 'active' : ''}">Routes</a></li>
          <li><a href="stops.html" class="nav-link ${activePage === 'stops' ? 'active' : ''}">Stops</a></li>
          <li><a href="timetable.html" class="nav-link ${activePage === 'timetable' ? 'active' : ''}">Timetable</a></li>
          ${isAuth ? `<li><a href="${dashboardLink}" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a></li>` : ''}
        </ul>

        <div class="nav-actions">
          <button class="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Theme">
            🌙 Dark Mode
          </button>
          ${isAuth ? `
            <a href="${dashboardLink}" class="btn btn-outline btn-sm">
              <span>👤 ${user.full_name.split(' ')[0]}</span>
              <span class="badge badge-accent">${user.role}</span>
            </a>
            <button onclick="Auth.logout()" class="btn btn-outline btn-sm" title="Sign Out">Sign Out</button>
          ` : `
            <a href="login.html" class="btn btn-outline btn-sm">Sign In</a>
            <a href="register.html" class="btn btn-accent btn-sm">Register</a>
          `}
        </div>
      </nav>
    `;
  },

  renderAppShell(activeSection = '') {
    const shellPlaceholder = document.getElementById('sidebar-placeholder');
    if (!shellPlaceholder) return;

    const user = Auth.getUser() || { full_name: 'Guest User', role: 'student' };
    const role = user.role;

    let roleLinks = '';
    if (role === 'student') {
      roleLinks = `
        <a href="student-dashboard.html" class="sidebar-link ${activeSection === 'overview' ? 'active' : ''}">📊 My Dashboard</a>
        <a href="routes.html" class="sidebar-link ${activeSection === 'routes' ? 'active' : ''}">🗺️ Explore Routes</a>
        <a href="stops.html" class="sidebar-link ${activeSection === 'stops' ? 'active' : ''}">📍 Nearby Stops</a>
        <a href="timetable.html" class="sidebar-link ${activeSection === 'timetable' ? 'active' : ''}">📅 Timetables & PDF</a>
        <a href="reports.html" class="sidebar-link ${activeSection === 'reports' ? 'active' : ''}">⚠️ Report Issue</a>
        <a href="feedback.html" class="sidebar-link ${activeSection === 'feedback' ? 'active' : ''}">⭐ Give Feedback</a>
      `;
    } else if (role === 'driver') {
      roleLinks = `
        <a href="driver-dashboard.html" class="sidebar-link ${activeSection === 'driver-trips' ? 'active' : ''}">🚍 Assigned Trips & GPS</a>
        <a href="routes.html" class="sidebar-link ${activeSection === 'routes' ? 'active' : ''}">🗺️ Routes & Stops</a>
        <a href="reports.html" class="sidebar-link ${activeSection === 'reports' ? 'active' : ''}">⚠️ Report Breakdown</a>
      `;
    } else if (role === 'admin') {
      roleLinks = `
        <a href="admin-dashboard.html" class="sidebar-link ${activeSection === 'admin-overview' ? 'active' : ''}">⚙️ Administration</a>
        <a href="routes.html" class="sidebar-link ${activeSection === 'routes' ? 'active' : ''}">🗺️ Routes & Timetables</a>
        <a href="stops.html" class="sidebar-link ${activeSection === 'stops' ? 'active' : ''}">📍 College Stops</a>
        <a href="reports.html" class="sidebar-link ${activeSection === 'reports' ? 'active' : ''}">📋 Review Issues</a>
      `;
    } else if (role === 'transport_manager') {
      roleLinks = `
        <a href="manager-dashboard.html" class="sidebar-link ${activeSection === 'manager-overview' ? 'active' : ''}">📈 Transport Operations</a>
        <a href="routes.html" class="sidebar-link ${activeSection === 'routes' ? 'active' : ''}">🗺️ Routes & Fleet</a>
        <a href="reports.html" class="sidebar-link ${activeSection === 'reports' ? 'active' : ''}">⚠️ Open Issues</a>
      `;
    }

    shellPlaceholder.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <a href="index.html" class="nav-brand" style="font-size: 1.1rem;">
            <span>🚌 RouteReady</span>
            <span class="brand-badge">${user.role.toUpperCase()}</span>
          </a>
        </div>

        <nav class="sidebar-nav">
          ${roleLinks}
          <div style="height: 1px; background: var(--border-subtle); margin: var(--space-3) 0;"></div>
          <a href="profile.html" class="sidebar-link ${activeSection === 'profile' ? 'active' : ''}">👤 Account Settings</a>
          <a href="index.html" class="sidebar-link">🌐 Public Portal</a>
        </nav>

        <div class="sidebar-footer">
          <div>
            <div style="font-weight: 700; font-size: var(--font-size-xs);">${user.full_name}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${user.email}</div>
          </div>
          <button onclick="Auth.logout()" class="btn btn-outline btn-sm" title="Sign Out">🚪</button>
        </div>
      </aside>
    `;
  }
};

window.UI = UI;

