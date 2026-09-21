function createStatusBadge(status) {
  const map = {
    new: "New",
    acknowledged: "Acknowledged",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed"
  };
  return '<span class="status">' + (map[status] || status) + '</span>';
}

function renderReports(container, reports) {
  if (!reports || !reports.length) {
    container.innerHTML = '<p>No reports found.</p>';
    return;
  }

  container.innerHTML = reports.map(function (report) {
    return [
      '<article class="report-card">',
      '  <div class="meta">',
      '    <strong>#' + (report.id || "") + '</strong>',
      '    <span>' + createStatusBadge(report.status) + '</span>',
      '  </div>',
      '  <h3>' + (report.title || "Untitled") + '</h3>',
      '  <p>' + (report.description || "") + '</p>',
      '  <div class="meta">',
      '    <span>' + (report.area || "") + '</span>',
      '    <span>' + (report.category || "") + '</span>',
      '  </div>',
      '  <p>Resident: ' + (report.resident_name || report.name || "Anonymous") + '</p>',
      '  <p>Rating: ' + (report.avg_rating || 0).toFixed(1) + ' (' + (report.rating_count || 0) + ')</p>',
      '  <div class="meta">',
      '    <span>' + (report.created_at || "") + '</span>',
      '  </div>',
      '</article>'
    ].join("");
  }).join("");
}
