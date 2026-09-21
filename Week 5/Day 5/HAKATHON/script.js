const CATEGORIES = [
    { id: "roads", label: "Roads & Potholes", icon: "" },
    { id: "water", label: "Water", icon: "" },
    { id: "power", label: "Electricity", icon: "" },
    { id: "garbage", label: "Garbage", icon: "" },
    { id: "lights", label: "Streetlights", icon: "" },
    { id: "drainage", label: "Drainage & Floods", icon: "" },
    { id: "security", label: "Security", icon: "" },
    { id: "other", label: "Other", icon: "" },
];
const STATUSES = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved"];
const STATUS_CLASS = ["b-submitted", "b-review", "b-assigned", "b-progress", "b-resolved"];
const STORE_KEY = "mtaafix_reports_v1";
const esc = (value) => {
    const container = document.createElement("div");
    container.textContent = value;
    return container.innerHTML;
};
const catById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
const fmtDate = (iso) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};
const seedReports = () => {
    const now = Date.now();
    return [
        {
            id: "MTF-2026-K2N7",
            cat: "roads",
            ward: "Kasarani",
            landmark: "Near Kasarani Stadium gate B",
            desc: "Huge pothole covering half the road on Kasarani–Mwiki road. Boda riders are swerving into oncoming traffic to avoid it.",
            name: "James Mwangi",
            phone: "0712***678",
            photo: null,
            status: 4,
            created: new Date(now - 12 * 86400000).toISOString(),
        },
        {
            id: "MTF-2026-P9Q4",
            cat: "water",
            ward: "Kibera (Sarang'ombe)",
            landmark: "Behind Toi Market",
            desc: "Water pipe burst three days ago. Water is flowing into the road, and we have had no supply at home since yesterday.",
            name: "Achieng O.",
            phone: "07***",
            photo: null,
            status: 3,
            created: new Date(now - 5 * 86400000).toISOString(),
        },
        {
            id: "MTF-2026-D4F8",
            cat: "lights",
            ward: "Westlands",
            landmark: "Parklands 5th Avenue",
            desc: "Streetlights along 5th Avenue have been off for two weeks. The stretch is now unsafe at night, especially for women walking from work.",
            name: "Fatuma Ali",
            phone: "07***",
            photo: null,
            status: 2,
            created: new Date(now - 3 * 86400000).toISOString(),
        },
        {
            id: "MTF-2026-M6R2",
            cat: "garbage",
            ward: "Embakasi East",
            landmark: "Nyayo Estate Phase 2 gate",
            desc: "Garbage has not been collected for three weeks. The heap is now blocking part of the road and smells terrible.",
            name: "Peter Njoroge",
            phone: "07***",
            photo: null,
            status: 1,
            created: new Date(now - 2 * 86400000).toISOString(),
        },
        {
            id: "MTF-2026-W8T5",
            cat: "drainage",
            ward: "Mvita, Mombasa",
            landmark: "Near Makadara Mosque",
            desc: "Blocked drainage on Abdel Nasser Road. Every light rain floods the shops along the road.",
            name: "Swaleh Omar",
            phone: "07***",
            photo: null,
            status: 0,
            created: new Date(now - 1 * 86400000).toISOString(),
        },
    ];
};
const loadReports = () => {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    }
    catch {
        // ignore invalid localStorage contents and fall back to seed data
    }
    const seeded = seedReports();
    saveReports(seeded);
    return seeded;
};
const saveReports = (reports) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(reports));
    }
    catch {
        // ignore storage errors
    }
};
let reports = loadReports();
let selectedCat = null;
let lastId = null;
let activeFilter = "all";
let toastTimer;
let photoData = null;
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const catPills = document.getElementById("catPills");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const reportForm = document.getElementById("reportForm");
const filtersEl = document.getElementById("filters");
const reportGrid = document.getElementById("reportGrid");
const trackForm = document.getElementById("trackForm");
const trackInput = document.getElementById("trackInput");
const trackResult = document.getElementById("trackResult");
const successModal = document.getElementById("successModal");
const modalId = document.getElementById("modalId");
const copyIdBtn = document.getElementById("copyIdBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const toastEl = document.getElementById("toast");
const toast = (msg) => {
    if (!toastEl)
        return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer !== undefined) {
        clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
        toastEl.classList.remove("show");
    }, 2600);
};
const renderCategoryPills = () => {
    if (!catPills)
        return;
    CATEGORIES.forEach((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cat-pill";
        button.dataset.cat = category.id;
        button.textContent = category.label;
        button.addEventListener("click", () => {
            selectedCat = category.id;
            catPills.querySelectorAll(".cat-pill").forEach((pill) => pill.classList.remove("selected"));
            button.classList.add("selected");
        });
        catPills.appendChild(button);
    });
};
const handlePhotoPreview = () => {
    if (!photoInput || !photoPreview || !photoPreviewImg)
        return;
    photoInput.addEventListener("change", () => {
        const file = photoInput.files?.[0];
        if (!file) {
            photoData = null;
            photoPreview.style.display = "none";
            photoPreviewImg.src = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result !== "string")
                return;
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement("canvas");
                const maxWidth = 800;
                const scale = Math.min(1, maxWidth / image.width);
                canvas.width = image.width * scale;
                canvas.height = image.height * scale;
                const context = canvas.getContext("2d");
                if (!context)
                    return;
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                photoData = canvas.toDataURL("image/jpeg", 0.7);
                photoPreviewImg.src = photoData;
                photoPreview.style.display = "block";
            };
            image.src = result;
        };
        reader.readAsDataURL(file);
    });
};
const renderDashboard = () => {
    if (!reportGrid)
        return;
    const list = activeFilter === "all" ? reports : reports.filter((report) => report.cat === activeFilter);
    if (list.length === 0) {
        reportGrid.innerHTML = '<div class="empty">No reports in this category yet. Be the first to report one! 👆</div>';
        return;
    }
    reportGrid.innerHTML = list
        .map((report) => {
        const category = catById(report.cat);
        return ('<div class="report-card">' +
            '<div class="top"><div class="cat">' +
            esc(category.label) +
            '</div><span class="badge ' +
            STATUS_CLASS[report.status] +
            '">' +
            STATUSES[report.status] +
            '</span></div>' +
            '<div class="loc">' +
            esc(report.ward) +
            (report.landmark ? " — " + esc(report.landmark) : "") +
            '</div>' +
            '<div class="desc">' + esc(report.desc) + '</div>' +
            (report.photo ? '<img src="' + report.photo + '" alt="Issue photo">' : "") +
            '<div class="meta"><span>' +
            esc(report.name) +
            '</span><span>' +
            fmtDate(report.created) +
            ' · ' +
            esc(report.id) +
            '</span></div>' +
            '</div>');
    })
        .join("");
};
const updateStats = () => {
    const totalEl = document.getElementById("statTotal");
    const resolvedEl = document.getElementById("statResolved");
    const activeEl = document.getElementById("statActive");
    const categoriesEl = document.getElementById("statCategories");
    if (!totalEl || !resolvedEl || !activeEl || !categoriesEl)
        return;
    totalEl.textContent = String(reports.length);
    resolvedEl.textContent = String(reports.filter((report) => report.status === 4).length);
    activeEl.textContent = String(reports.filter((report) => report.status > 0 && report.status < 4).length);
    categoriesEl.textContent = String(new Set(reports.map((report) => report.cat)).size);
};
const renderFilters = () => {
    if (!filtersEl)
        return;
    const filterOptions = [{ id: "all", label: "All Issues" }, ...CATEGORIES];
    filtersEl.innerHTML = "";
    filterOptions.forEach((filter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip" + (filter.id === activeFilter ? " active" : "");
        button.textContent = filter.label;
        button.addEventListener("click", () => {
            activeFilter = filter.id;
            filtersEl.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
            button.classList.add("active");
            renderDashboard();
        });
        filtersEl.appendChild(button);
    });
};
const handleNav = () => {
    if (!hamburger || !navLinks)
        return;
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => navLinks.classList.remove("open"));
    });
};
const handleReportSubmit = () => {
    if (!reportForm)
        return;
    reportForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedCat) {
            toast("Please choose an issue category");
            return;
        }
        const wardInput = document.getElementById("ward");
        const landmarkInput = document.getElementById("landmark");
        const descInput = document.getElementById("desc");
        const nameInput = document.getElementById("name");
        const phoneInput = document.getElementById("phone");
        if (!wardInput || !descInput || !nameInput || !phoneInput)
            return;
        const id = `MTF-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const newReport = {
            id,
            cat: selectedCat,
            ward: wardInput.value.trim(),
            landmark: landmarkInput?.value.trim() ?? "",
            desc: descInput.value.trim(),
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            photo: photoData,
            status: 0,
            created: new Date().toISOString(),
        };
        reports.unshift(newReport);
        saveReports(reports);
        lastId = id;
        if (modalId) {
            modalId.textContent = id;
        }
        if (successModal) {
            successModal.classList.add("show");
        }
        reportForm.reset();
        photoData = null;
        if (photoPreview)
            photoPreview.style.display = "none";
        if (photoPreviewImg)
            photoPreviewImg.src = "";
        selectedCat = null;
        if (catPills) {
            catPills.querySelectorAll(".cat-pill").forEach((pill) => pill.classList.remove("selected"));
        }
        renderDashboard();
        updateStats();
    });
};
const handleModalActions = () => {
    if (copyIdBtn) {
        copyIdBtn.addEventListener("click", async () => {
            if (!lastId)
                return;
            try {
                await navigator.clipboard.writeText(lastId);
                copyIdBtn.textContent = "Copied ✓";
                setTimeout(() => {
                    copyIdBtn.textContent = "Copy ID";
                }, 1500);
            }
            catch {
                toast("Clipboard not available");
            }
        });
    }
    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener("click", () => {
            successModal.classList.remove("show");
        });
    }
};
const handleTrackReport = () => {
    if (!trackForm || !trackInput || !trackResult)
        return;
    trackForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = trackInput.value.trim().toUpperCase();
        const report = reports.find((item) => item.id.toUpperCase() === id);
        if (!report) {
            trackResult.innerHTML = '<div class="track-card" style="text-align:center;color:var(--slate-3)">No report found with that ID. Double-check and try again.</div>';
            return;
        }
        const category = catById(report.cat);
        let timeline = "";
        STATUSES.forEach((status, index) => {
            const isDone = index < report.status;
            const isCurrent = index === report.status;
            const note = index === 0 ? "Received by Mtaafix" : index === 4 ? "Marked as fixed" : "";
            timeline += '<div class="t-item ' + (isDone || isCurrent ? "done" : "") + (isCurrent ? " current" : "") + '"><div class="t-dot"></div><h4>' + status + '</h4><p>' + note + '</p></div>';
        });
        trackResult.innerHTML = '<div class="track-card">' +
            '<div class="head"><div><h3>' + esc(category.label) + '</h3><div class="sub">' + esc(report.ward) + (report.landmark ? ' — ' + esc(report.landmark) : '') + ' · ' + fmtDate(report.created) + '</div></div>' +
            '<span class="badge ' + STATUS_CLASS[report.status] + '">' + STATUSES[report.status] + '</span></div>' +
            '<p style="font-size:14.5px;color:var(--slate-2);margin-bottom:22px">' + esc(report.desc) + '</p>' +
            '<div class="timeline">' + timeline + '</div>' +
            '<div class="demo-controls">Prototype demo: <button type="button" id="advanceBtn">Advance status</button> <span>(simulates the organization updating this report)</span></div>' +
            '</div>';
        const advanceButton = document.getElementById("advanceBtn");
        if (advanceButton) {
            advanceButton.addEventListener("click", () => {
                if (report.status < 4) {
                    report.status += 1;
                    saveReports(reports);
                    renderDashboard();
                    updateStats();
                    trackInput.value = report.id;
                    trackForm.dispatchEvent(new Event("submit"));
                    toast("Status updated: " + STATUSES[report.status]);
                }
                else {
                    toast("This report is already resolved 🎉");
                }
            });
        }
    });
};
const initializeApp = () => {
    handleNav();
    renderCategoryPills();
    handlePhotoPreview();
    handleReportSubmit();
    renderFilters();
    handleModalActions();
    handleTrackReport();
    renderDashboard();
    updateStats();
};
initializeApp();
