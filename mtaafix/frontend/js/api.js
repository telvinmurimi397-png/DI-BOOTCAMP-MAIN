const API = {
  baseUrl: "http://localhost:8000",

  request: function (path, options) {
    const method = (options && options.method) || "GET";
    const headers = Object.assign({ "Content-Type": "application/json" }, (options && options.headers) || {});
    const token = localStorage.getItem("mtaafix_token");
    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return fetch(this.baseUrl + path, {
      method: method,
      headers: headers,
      body: options && options.body ? options.body : null
    }).then(function (response) {
      return response.text().then(function (text) {
        let data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            const error = new Error("Server returned an invalid response (HTTP " + response.status + ")");
            error.status = response.status;
            error.data = text;
            throw error;
          }
        }
        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }
        return data;
      });
    });
  },

  loginResident: function (phone, password) {
    return this.request("/api/residents/login", {
      method: "POST",
      body: JSON.stringify({ phone: phone, password: password })
    });
  },

  loginRuler: function (username, password) {
    return this.request("/api/rulers/login", {
      method: "POST",
      body: JSON.stringify({ username: username, password: password })
    });
  },

  getAreas: function () {
    return this.request("/api/areas");
  },

  getCategories: function () {
    return this.request("/api/categories");
  },

  getReports: function () {
    return this.request("/api/reports");
  },

  createReport: function (payload) {
    return this.request("/api/reports", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateReport: function (reportId, payload) {
    return this.request("/api/reports/" + reportId, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  deleteReport: function (reportId) {
    return this.request("/api/reports/" + reportId, {
      method: "DELETE"
    });
  },

  rateReport: function (reportId, score) {
    return this.request("/api/reports/" + reportId + "/rate", {
      method: "POST",
      body: JSON.stringify({ score: score })
    });
  },

  getRulerDashboard: function () {
    return this.request("/api/rulers/dashboard");
  },

  updateStatus: function (reportId, status, note) {
    return this.request("/api/rulers/reports/" + reportId + "/status", {
      method: "POST",
      body: JSON.stringify({ status: status, note: note || "" })
    });
  },

  sendMessage: function (reportId, message) {
    return this.request("/api/rulers/reports/" + reportId + "/message", {
      method: "POST",
      body: JSON.stringify({ message: message })
    });
  }
};
