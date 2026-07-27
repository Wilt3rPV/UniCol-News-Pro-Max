const params = new URLSearchParams(window.location.search);
const selectedCollege = params.get("college");

const container = document.getElementById('news-container');
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");
const courseFilter = document.getElementById("courseFilter");
const paginationContainer = document.getElementById("pagination");

let allPosts = [];
let filteredPosts = [];

const calendarRowsEl = document.getElementById("calendarRows");
const addBtn = document.getElementById("addCalendarRowBtn");

// ============================================================
// CAMPUS-SPECIFIC DEPARTMENTS
// ============================================================
const campusDepartments = {
  prmsuIba: [
    { value: 'comtech', label: 'Communication & Information Technology', short: 'ComTech' },
    { value: 'indtech', label: 'Industrial Technology', short: 'IndTech' },
    { value: 'education', label: 'Education', short: 'Educ' },
    { value: 'business', label: 'Business Administration', short: 'Business' },
    { value: 'nursing', label: 'Nursing', short: 'Nursing' },
    { value: 'arts', label: 'Arts & Sciences', short: 'Arts & Sci' },
    { value: 'engineering', label: 'Engineering', short: 'Eng' },
    { value: 'agri', label: 'Agriculture & Forestry', short: 'Agri' },
    { value: 'hospitality', label: 'Hospitality Management', short: 'Hospitality' },
    { value: 'criminology', label: 'Criminology', short: 'Crim' },
    { value: 'midwifery', label: 'Midwifery', short: 'Midwifery' }
  ],
  prmsuBotolan: [
    { value: 'agri', label: 'Agriculture & Forestry', short: 'Agri' },
    { value: 'education', label: 'Education', short: 'Educ' }
  ],
  prmsuCaste: [
    { value: 'education', label: 'Education', short: 'Educ' },
    { value: 'business', label: 'Business Administration', short: 'Business' },
    { value: 'comtech', label: 'Communication & Information Technology', short: 'ComTech' }
  ],
  macsatIba: [
    { value: 'comtech', label: 'Computer Science', short: 'CompSci' },
    { value: 'business', label: 'Business Administration', short: 'Business' }
  ],
  ccGapo: [
    { value: 'business', label: 'Business & Accountancy', short: 'Business' },
    { value: 'education', label: 'Arts, Sciences & Education', short: 'ASE' },
    { value: 'comtech', label: 'Computer Studies', short: 'CompSci' },
    { value: 'engineering', label: 'Engineering', short: 'Eng' },
    { value: 'architecture', label: 'Architecture', short: 'Arch' },
    { value: 'nursing', label: 'Nursing', short: 'Nursing' }
  ],
  ccCruz: [
    { value: 'education', label: 'Education', short: 'Educ' },
    { value: 'business', label: 'Business Administration', short: 'Business' },
    { value: 'comtech', label: 'Information Systems', short: 'InfoSys' }
  ],
  prmsuMan: [
    { value: 'comtech', label: 'Communication & Information Technology', short: 'ComTech' },
    { value: 'business', label: 'Business Administration', short: 'Business' },
    { value: 'education', label: 'Education', short: 'Educ' }
  ],
  prmsuCruz: [
    { value: 'comtech', label: 'Communication & Information Technology', short: 'CompTech' },
    { value: 'education', label: 'Education', short: 'Educ' }
  ],
  gcGapo: [
    { value: 'business', label: 'Business & Accountancy', short: 'Business' },
    { value: 'comtech', label: 'Computer Studies', short: 'CompSci' },
    { value: 'education', label: 'Arts, Sciences & Education', short: 'ASE' },
    { value: 'hospitality', label: 'Hospitality and Tourism Management', short: 'Hospitality' }
  ],
  lyceumBotolan: [
    { value: 'business', label: 'Business Administration', short: 'Business' },
    { value: 'comtech', label: 'Computer Studies', short: 'CompSci' },
    { value: 'education', label: 'Education', short: 'Educ' },
    { value: 'hospitality', label: 'Hospitality Management', short: 'Hospitality' }
  ]
};

function populateCourseFilter() {
  const select = document.getElementById("courseFilter");
  if (!select || !campusDepartments[selectedCollege]) return;

  let optionsHTML = '<option value="all">All</option>';
  campusDepartments[selectedCollege].forEach(dept => {
    optionsHTML += `<option value="${dept.value}">${dept.label}</option>`;
  });
  select.innerHTML = optionsHTML;

  select.addEventListener("change", function() {
    currentPage = 1;
    applyAllFilters();
  });
}

// ============================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================
function showToast(message, type = 'loading') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.getElementById('toast');
  const text = document.getElementById('toastText');

  text.textContent = message;

  toast.className = 'toast';
  container.classList.remove('visible');

  if (type === 'loading' || type === 'publishing' || type === 'deleting') {
    toast.classList.add('publishing');
  } else if (type === 'success') {
    toast.classList.add('success');
  } else if (type === 'error') {
    toast.classList.add('error');
  }

  requestAnimationFrame(() => {
    container.classList.add('visible');
  });
}

function hideToast() {
  const container = document.getElementById('toastContainer');
  if (container) {
    container.classList.remove('visible');
  }
}

function showError(message) {
  showToast(message, 'error');
  setTimeout(hideToast, 3000);
}

// ============================================================
// CAMPUS THEMES
// ============================================================
const themes = {
  prmsuIba: {
    name: "President Ramon Magsaysay State University - Iba Campus",
    divider_top: "#4b75fd",
    divider_bottom: "#ffd829"
  },
  prmsuBotolan: {
    name: "President Ramon Magsaysay State University - Botolan Campus",
    divider_top: "#961313",
    divider_bottom: "#942525"
  },
  prmsuCaste: {
    name: "President Ramon Magsaysay State University - Castillejos Campus",
    divider_top: "#D2B48C",
    divider_bottom: "#D2B48C"
  },
  macsatIba: {
    name: "Mirco Asia College of Science And Technology - Iba Campus",
    divider_top: "#169c33",
    divider_bottom: "#57ff48"
  },
  ccGapo: {
    name: "Columban College - Olongapo Campus",
    divider_top: "#7797ff",
    divider_bottom: "#f2ff7e"
  },
  ccCruz: {
    name: "Columban College - Sta. Cruz Campus",
    divider_top: "#6580d8",
    divider_bottom: "#dcdfc1"
  },
  prmsuMan: {
    name: "President Ramon Magsaysay State University - Masinloc Campus",
    divider_top: "#797979",
    divider_bottom: "#555555"
  },
  prmsuCruz: {
    name: "President Ramon Magsaysay State University - Sta. Cruz Campus",
    divider_top: "#4b75fd",
    divider_bottom: "#ffd829"
  },
  gcGapo: {
    name: "Gordon College - Olongapo Campus",
    divider_top: "#0c530a",
    divider_bottom: "#ddce00"
  },
  lyceumBotolan: {
    name: "Lyceum Of Western Luzon - Botolan Campus",
    divider_top: "#169c33",
    divider_bottom: "#57ff48"
  },
};

const theme = themes[selectedCollege];
if (theme) {
  document.getElementById("collegeName").textContent = theme.name;
  document.documentElement.style.setProperty("--divider_top", theme.divider_top);
  document.documentElement.style.setProperty("--divider_bottom", theme.divider_bottom);
}

// ============================================================
// PAGE INIT
// ============================================================
showPageLoading();

document.addEventListener("DOMContentLoaded", async () => {
  populateCourseFilter();
  await checkAuth();
  await loadNewsPosts();
  await renderCalendar();
});

function showPageLoading() {
  if (!container) return;
  container.innerHTML = `
    <div class="news-empty" id="pageLoading">
      <div style="width:40px;height:40px;border:4px solid #ddd;border-top-color:#667eea;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
      <div style="color:#888;font-size:16px;">Loading news...</div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
}

// ============================================================
// POSTS - Fetch from PHP API via db wrapper
// ============================================================
async function loadNewsPosts() {
  const startTime = Date.now();

  try {
    const { data, error } = await db
      .from("posts")
      .select("*")
      .eq("college", selectedCollege)
      .order('id', { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      if (container) {
        container.innerHTML = `
          <div class="news-empty">
            <p>Error loading posts. Please refresh the page.</p>
            <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;">Retry</button>
          </div>
        `;
      }
      return;
    }

    allPosts = data || [];
    filteredPosts = allPosts;
    populateYearFilter();

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 200 - elapsed);

    setTimeout(() => {
      applyAllFilters();
    }, remaining);

  } catch (err) {
    console.error("Exception fetching posts:", err);
    if (container) {
      container.innerHTML = `
        <div class="news-empty">
          <p>Error loading posts. Please refresh the page.</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;">Retry</button>
        </div>
      `;
    }
  }
}

function goCreate() {
  const params = new URLSearchParams(location.search);
  const college = params.get("college");
  window.location.href = `CREATE_POST.html?college=${encodeURIComponent(college)}`;
}

// ============================================================
// CALENDAR - Uses direct API functions (not db wrapper)
// ============================================================
async function loadCalendar() {
  if (!selectedCollege) return [];
  try {
    return await fetchCalendar(selectedCollege);
  } catch (err) {
    console.error("Error loading calendar:", err);
    return [];
  }
}

async function saveCalendarRow(row) {
  if (row.id && typeof row.id === 'number') {
    try {
      await updateCalendarRow(row.id, { date: row.date, label: row.label });
    } catch (err) {
      console.error("Error updating calendar:", err);
    }
  } else {
    try {
      const result = await createCalendarRow({
        college: selectedCollege,
        date: row.date,
        label: row.label
      });
      row.id = result.id;
    } catch (err) {
      console.error("Error inserting calendar:", err);
    }
  }
}

async function removeCalendarRow(id) {
  try {
    await deleteCalendarRow(id);
  } catch (err) {
    console.error("Error deleting calendar row:", err);
  }
}

async function renderCalendar() {
  calendarRowsEl.innerHTML = `
    <div style="text-align:center;padding:40px 20px;color:#888;">
      <div style="width:32px;height:32px;border:3px solid #eee;border-top-color:#667eea;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
      <div style="font-size:14px;">Loading calendar...</div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;

  const rows = await loadCalendar();

  calendarRowsEl.innerHTML = "";

  if (rows.length === 0) {
    calendarRowsEl.innerHTML = `<div style="opacity:.75; padding: 20px; text-align:center; color:#888;">No events scheduled.</div>`;
    return;
  }

  rows.forEach((row) => {
    const div = document.createElement("div");
    div.className = "calendar-row";

    const removeButton = isAdmin ?
      `<button class="remove-calendar" title="Remove" data-remove="${row.id}">X</button>` :
      '';

    const readonlyAttr = !isAdmin ? 'readonly' : '';

    div.innerHTML = `
      <textarea rows="1" placeholder="Date (e.g. Mar 10)" data-field="date" data-id="${row.id}" ${readonlyAttr}>${escapeHtml(row.date)}</textarea>
      <textarea rows="1" placeholder="Event (e.g. Start of classes)" data-field="label" data-id="${row.id}" ${readonlyAttr}>${escapeHtml(row.label)}</textarea>
      ${removeButton}
    `;
    calendarRowsEl.appendChild(div);
  });
}

if (calendarRowsEl) {
  calendarRowsEl.addEventListener("input", async (e) => {
    const id = Number(e.target.dataset.id);
    const field = e.target.dataset.field;
    if (!id || !field) return;
    if (!isAdmin) {
      e.preventDefault();
      return;
    }

    const rows = await loadCalendar();
    const row = rows.find(r => r.id === id);
    if (!row) return;

    row[field] = e.target.value;
    await saveCalendarRow(row);
  });

  calendarRowsEl.addEventListener("click", async (e) => {
    const removeId = Number(e.target.dataset.remove);
    if (!removeId) return;
    if (!isAdmin) {
      e.preventDefault();
      return;
    }

    await removeCalendarRow(removeId);
    await renderCalendar();
  });
}

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    try {
      await createCalendarRow({ college: selectedCollege, date: "", label: "" });
      await renderCalendar();
    } catch (err) {
      console.error("Error adding calendar row:", err);
    }
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================================
// POST MODAL
// ============================================================
function openPost(postId) {
  if (window.innerWidth <= 768) {
    window.location.href = `post.html?id=${postId}`;
  } else {
    showPostModal(postId);
  }
}

async function showPostModal(postId) {
  const modal = document.getElementById("postModal");
  const content = document.getElementById("postModalContent");

  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
  modal.classList.remove("hidden", "closing");
  modal.classList.add("show");

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:14px;">
      <div style="width:42px;height:42px;border:4px solid rgba(0,0,0,0.15);border-top-color:rgba(0,0,0,0.65);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <div style="font-size:16px;color:rgba(0,0,0,0.7);">Loading post...</div>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;

  const startTime = Date.now();

  try {
    const { data: post, error } = await db
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 200 - elapsed);

    if (error || !post) {
      setTimeout(() => {
        content.innerHTML = `
          <div style="text-align:center;padding:40px 20px;">
            <h2 style="margin-bottom:12px;">Error</h2>
            <p>Could not load post. Please try again.</p>
          </div>
        `;
      }, remaining);
      return;
    }

    setTimeout(() => {
      const adminButtons = isAdmin ? `
        <button onclick="editPost(${post.id})">Edit Post</button>
        <button class="delete-btn" onclick="deletePost(${post.id})">Delete Post</button>
      ` : '';

      const bannerHtml = post.banner ?
        `<img src="${post.banner}" class="post-banner" onclick="openImageOverlay('${post.banner}')" title="Click to view full size">` :
        "";

      const courseNames = {
        'comtech': 'Communication & Information Technology',
        'indtech': 'Industrial Technology',
        'education': 'Education',
        'business': 'Business Administration',
        'nursing': 'Nursing',
        'arts': 'Arts & Sciences',
        'engineering': 'Engineering',
        'agri': 'Agriculture & Forestry',
        'hospitality': 'Hospitality Management',
        'criminology': 'Criminology',
        'midwifery': 'Midwifery',
        'fisheries': 'Fisheries',
        'it-voc': 'IT (Vocational)',
        'comp-tech': 'Computer Technician',
        'architecture': 'Architecture'
      };
      const courseDisplay = post.course ? ` | ${courseNames[post.course] || post.course}` : '';

      content.innerHTML = `
        <div class="post-loaded">
          ${bannerHtml}
          <h2>${post.title}</h2>
          <small class="post-date">${post.date}${courseDisplay}</small>
          <div>${post.content}</div>
          ${adminButtons}
        </div>
      `;
    }, remaining);

  } catch (err) {
    console.error("Error loading post:", err);
    content.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <h2 style="margin-bottom:12px;">Error</h2>
        <p>Something went wrong. Please try again.</p>
        <button onclick="closePostModal()" style="margin-top:16px;padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;">Close</button>
      </div>
    `;
  }
}

async function deleteNewsPost(id) {
  if (!isAdmin) {
    showError('Admin access required');
    return;
  }

  customModal("Are you sure you want to delete this post?", true, async (result) => {
    if (!result) return;

    showToast('Deleting post...', 'deleting');

    try {
      const { error } = await db
        .from("posts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting post:", error);
        showError("Error deleting post: " + error.message);
        return;
      }

      showToast('Post deleted successfully!', 'success');
      closePostModal();
      await loadNewsPosts();
      setTimeout(hideToast, 1500);

    } catch (err) {
      console.error("Exception deleting post:", err);
      showError("Error deleting post: " + err.message);
    }
  });
}

function closePostModal() {
  const modal = document.getElementById("postModal");
  modal.classList.add("closing");

  setTimeout(() => {
    modal.classList.remove("show", "closing");
    modal.classList.add("hidden");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
  }, 220);
}

function editPost(id) {
  window.location.href = `CREATE_POST.html?edit=${id}`;
}

// ============================================================
// UNIFIED FILTER FUNCTION
// ============================================================
function applyAllFilters() {
  const selectedYear = yearFilter ? yearFilter.value : "all";
  const selectedMonth = monthFilter ? monthFilter.value : "all";
  const selectedCourse = courseFilter ? courseFilter.value : "all";
  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";

  let finalPosts = allPosts;

  if (selectedYear !== "all") {
    finalPosts = finalPosts.filter(post => String(getPostYear(post)) === selectedYear);
  }

  if (selectedMonth !== "all") {
    finalPosts = finalPosts.filter(post => getPostMonth(post) === selectedMonth);
  }

  if (selectedCourse !== "all") {
    finalPosts = finalPosts.filter(post => {
      const postCourse = String(post.course || "").toLowerCase().trim();
      return postCourse === selectedCourse.toLowerCase();
    });
  }

  if (searchText !== "") {
    finalPosts = finalPosts.filter(post =>
      String(post.title || "").toLowerCase().includes(searchText)
    );
  }

  if (monthFilter) {
    monthFilter.addEventListener("change", () => {
      currentPage = 1;
      applyAllFilters();
    });
  }

  filteredPosts = finalPosts;

  const totalPages = Math.ceil(finalPosts.length / POSTS_PER_PAGE);
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  renderPosts(finalPosts);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
if (yearFilter) {
  yearFilter.addEventListener("change", () => {
    currentPage = 1;
    applyAllFilters();
  });
}

if (courseFilter) {
  courseFilter.addEventListener("change", () => {
    currentPage = 1;
    applyAllFilters();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    applyAllFilters();
  });
}

// ============================================================
// PAGINATION & RENDERING
// ============================================================
const POSTS_PER_PAGE = 10;
let currentPage = 1;

function getPostYear(post) {
  if (post.year) return post.year;
  const date = new Date(post.date);
  return date.getFullYear();
}

function getPostMonth(post) {
  if (post.month) return String(post.month).padStart(2, '0');
  const date = new Date(post.date);
  if (!isNaN(date)) {
    return String(date.getMonth() + 1).padStart(2, '0');
  }
  // Fallback: try parsing YYYY-MM-DD string directly
  if (post.date && String(post.date).includes('-')) {
    const parts = String(post.date).split('-');
    if (parts.length >= 2) return parts[1];
  }
  return null;
}

function populateYearFilter() {
  const select = document.getElementById("yearFilter");
  if (!select) return;

  select.innerHTML = '<option value="all">All</option>';

  const years = [...new Set(
    allPosts.map(post => getPostYear(post)).filter(year => !isNaN(year))
  )].sort((a, b) => b - a);

  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    select.appendChild(option);
  });
}

function renderPosts(postsToRender) {
  if (!container) return;
  container.innerHTML = "";

  if (postsToRender.length === 0) {
    container.innerHTML = `<div class="news-empty"><p>No posts found.</p></div>`;
    renderPagination([]);
    return;
  }

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const paginatedPosts = postsToRender.slice(start, end);

  paginatedPosts.forEach((post, index) => {
    const card = document.createElement("div");
    card.className = "news-card";
    card.style.animationDelay = `${(index + 1) * 0.05}s`;

    if (post.banner) {
      card.innerHTML = `
        <div class="news-card-image" style="background-image:url('${post.banner}')"></div>
        <div class="news-card-body">
          <div class="news-card-title">${escapeHtml(post.title)}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="news-card-image" style="background:#667eea;display:flex;align-items:center;justify-content:center;">
          <span style="color:rgba(255,255,255,0.5);font-size:40px;">&#128240;</span>
        </div>
        <div class="news-card-body">
          <div class="news-card-title">${escapeHtml(post.title)}</div>
        </div>
      `;
    }

    card.onclick = () => openPost(post.id);
    container.appendChild(card);
  });

  renderPagination(postsToRender);
}

function renderPagination(postsToRender) {
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(postsToRender.length / POSTS_PER_PAGE);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "<";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    applyAllFilters();
  };
  paginationContainer.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) {
      pageBtn.classList.add("active");
      pageBtn.disabled = true;
    }
    pageBtn.onclick = () => {
      currentPage = i;
      applyAllFilters();
    };
    paginationContainer.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = ">";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    applyAllFilters();
  };
  paginationContainer.appendChild(nextBtn);
}

// ============================================================
// CUSTOM MODAL
// ============================================================
function customModal(message, showCancel, callback) {
  const modal = document.getElementById("confirmModal");
  const text = document.getElementById("confirmText");
  const yes = document.getElementById("confirmYes");
  const no = document.getElementById("confirmNo");

  text.textContent = message;
  if (showCancel) {
    no.style.display = "inline-block";
  } else {
    no.style.display = "none";
  }

  modal.classList.remove("hidden");

  yes.onclick = () => {
    modal.classList.add("hidden");
    if (callback) callback(true);
  };

  no.onclick = () => {
    modal.classList.add("hidden");
    if (callback) callback(false);
  };
}

// ============================================================
// AUTH UI
// ============================================================
async function handleLogout() {
  showToast('Logging out...', 'loading');
  try {
    await signOut();
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
      hideToast();
      window.location.reload();
    }, 1200);
  } catch (err) {
    showError('Error logging out');
  }
}

function goToLogin() {
  window.location.href = 'index.html';
}

function continuetoMenu() {
  window.location.href = 'menu.html';
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    const modal = document.getElementById('postModal');
    const content = document.getElementById('postModalContent');
    if (modal) {
      modal.classList.remove('show', 'closing');
      modal.classList.add('hidden');
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    if (content) {
      content.innerHTML = '';
    }
  }
});

window.addEventListener('authStateChanged', (e) => {
  const { user, isAdmin } = e.detail;
  updateNewsUI(user, isAdmin);
});

async function initAuth() {
  await checkAuth();
}

function updateNewsUI(user, admin) {
  const createBtn = document.getElementById('createPostBtn');
  const loginBtn = document.getElementById('adminLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const addCalendarBtn = document.getElementById('addCalendarRowBtn');
  const registerBtn = document.getElementById('registerLoginBtn');

  if (user && admin) {
    createBtn?.classList.add('visible');
    logoutBtn?.classList.add('visible');
    addCalendarBtn?.classList.add('visible');
    registerBtn?.classList.add('visible');
    loginBtn?.classList.add('hidden');
  } else {
    createBtn?.classList.remove('visible');
    logoutBtn?.classList.remove('visible');
    addCalendarBtn?.classList.remove('visible');
    registerBtn?.classList.remove('visible');
    loginBtn?.classList.remove('hidden');
  }
}

// ============================================================
// IMAGE OVERLAY
// ============================================================
function openImageOverlay(imageSrc) {
  const overlay = document.getElementById('imageOverlay');
  const fullImage = document.getElementById('fullImage');
  document.body.style.overflow = 'hidden';
  fullImage.src = imageSrc;
  overlay.classList.remove('closing');
  overlay.classList.add('visible');
}

function closeImageOverlay() {
  const overlay = document.getElementById('imageOverlay');
  const fullImage = document.getElementById('fullImage');
  overlay.classList.add('closing');
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.classList.remove('closing');
    fullImage.src = '';
    document.body.style.overflow = '';
  }, 350);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('imageOverlay');
    if (overlay && overlay.classList.contains('visible')) {
      closeImageOverlay();
    }
    const postModal = document.getElementById('postModal');
    if (postModal && postModal.classList.contains('show')) {
      closePostModal();
    }
  }
});

document.getElementById('imageOverlay')?.addEventListener('click', function(e) {
  if (e.target === this) {
    closeImageOverlay();
  }
});

initAuth();