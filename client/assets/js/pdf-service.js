// ============================================================================
// RouteReady Campus - Timetable PDF Download Service
// ============================================================================

const PDFService = {
  downloadRouteTimetable(route, day = 'All Weekdays (Mon-Fri)') {
    if (!route) {
      alert('Route details are not loaded.');
      return;
    }

    const stops = route.stops || [];
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print the timetable PDF.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timetable - ${route.route_number} ${route.name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F172A; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #0A2540; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .inst { font-size: 14px; font-weight: 700; color: #00A896; text-transform: uppercase; letter-spacing: 0.05em; }
          .title { font-size: 24px; font-weight: 800; color: #0A2540; margin: 4px 0; }
          .meta { font-size: 13px; color: #475569; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #F8FAFC; padding: 12px; border-radius: 6px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; }
          .meta-value { font-size: 14px; font-weight: 600; color: #0F172A; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background: #0A2540; color: #FFF; text-align: left; padding: 10px; font-weight: 600; }
          td { padding: 10px; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; background: #E6F7F5; color: #00A896; }
          .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 11px; color: #64748B; display: flex; justify-content: space-between; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px;">
          <button onclick="window.print()" style="background:#0A2540; color:#FFF; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:600;">🖨️ Print / Save as PDF</button>
          <span style="font-size:12px; color:#64748B; margin-left:10px;">Select 'Save as PDF' in the destination dropdown to save locally.</span>
        </div>

        <div class="header">
          <div>
            <div class="inst">Malla Reddy Engineering College for Women</div>
            <div class="title">Route ${route.route_number}: ${route.name}</div>
            <div style="font-size: 13px; color: #64748B;">Official College Transportation Timetable</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748B;">
            Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </div>
        </div>

        <div class="meta">
          <div class="meta-item">
            <span class="meta-label">Origin & Destination</span>
            <span class="meta-value">${route.origin_label} ➔ ${route.destination_label}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Operating Schedule</span>
            <span class="meta-value">${day}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Estimated Journey Time</span>
            <span class="meta-value">${route.estimated_duration_minutes} Minutes (Scheduled)</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Seq</th>
              <th>Stop Name</th>
              <th>Location Landmark</th>
              <th style="width: 140px;">Scheduled Departure</th>
              <th style="width: 100px;">Features</th>
            </tr>
          </thead>
          <tbody>
            ${stops.map((s, idx) => `
              <tr>
                <td style="font-weight:700; color:#0A2540;">#${s.sequence || idx + 1}</td>
                <td style="font-weight:600;">${s.name}</td>
                <td style="color:#64748B;">${s.address_label || s.description || '-'}</td>
                <td style="font-weight:600; color:#00A896;">+${s.scheduled_arrival_offset_minutes || 0} mins from start</td>
                <td>${s.is_accessible ? '<span class="badge">♿ Accessible</span>' : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>RouteReady Campus • Department of Transport • Malla Reddy Engineering College for Women</div>
          <div>Note: Times are scheduled offsets. Students are advised to arrive at their stop 5 minutes prior.</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};

window.PDFService = PDFService;

