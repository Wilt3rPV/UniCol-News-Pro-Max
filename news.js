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

let activeTagFilters = [];   

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
  renderTagFilters();
  await checkAuth();
  await loadNewsPosts();
  await renderCalendar();
});

function showPageLoading() {
  if (!container) return;
  const skeletonCard = `
    <div class="news-card-skeleton" aria-hidden="true">
      <div class="skel skel-img"></div>
      <div class="skel-body">
        <div class="skel" style="width:85%"></div>
        <div class="skel" style="width:60%"></div>
      </div>
    </div>`;
  container.innerHTML = skeletonCard.repeat(6);
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

// --- Calendar view state ---
let calendarRows = [];
let calendarFocusLast = false;
const calendarSaveTimers = {};
const CALENDAR_MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

// ------------------------------------------------------------
// DATE CLEANUP - dates imported from Google Sheets can arrive with a time
// (e.g. "2026-03-10T16:00:00.000Z"). These helpers drop the time part.
// ------------------------------------------------------------
const ISO_WITH_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const TRAILING_TIME = /[,\s]+\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*([AP]M)?(\s*(Z|[+-]\d{2}:?\d{2}))?$/i;

// Returns the date without any time. ISO timestamps become YYYY-MM-DD (in the viewer's local time,
// so a sheet date stored as local midnight doesn't slip back a day); other text just loses a trailing time.
function stripTime(value) {
  const raw = String(value == null ? '' : value).trim();
  if (ISO_WITH_TIME.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d)) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  }
  return raw.replace(TRAILING_TIME, '');
}

// Calendar tiles read best as "Mar 10"
function calendarDateText(value) {
  const raw = String(value == null ? '' : value).trim();
  if (ISO_WITH_TIME.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d)) {
      return CALENDAR_MONTHS[d.getMonth()].charAt(0).toUpperCase() + CALENDAR_MONTHS[d.getMonth()].slice(1) + ' ' + d.getDate();
    }
  }
  const plain = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plain) {
    const mo = CALENDAR_MONTHS[Number(plain[2]) - 1];
    if (mo) return mo.charAt(0).toUpperCase() + mo.slice(1) + ' ' + Number(plain[3]);
  }
  return stripTime(raw);
}

// Turns free text like "Mar 10", "March 10-12" or "10 March" into tile parts.
// Returns null for anything else (e.g. "Second semester").
function parseCalendarDate(text) {
  const raw = String(text || '').trim();
  let m = raw.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?!\d)/);
  let month, day;
  if (m) {
    month = m[1]; day = m[2];
  } else {
    m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})/);
    if (!m) return null;
    day = m[1]; month = m[2];
  }
  const idx = CALENDAR_MONTHS.indexOf(month.slice(0, 3).toLowerCase());
  if (idx === -1) return null;
  const rest = raw.slice(m[0].length).trim();
  return {
    month: CALENDAR_MONTHS[idx].toUpperCase(),
    day: String(Number(day)),
    extra: rest ? raw : ''   // ranges / years: keep the full text as a second line
  };
}

function calendarTileHtml(parsed, rawDate) {
  if (parsed) {
    return `<div class="cal-date"><span class="cal-month">${parsed.month}</span><span class="cal-day">${parsed.day}</span></div>`;
  }
  const t = String(rawDate || '').trim();
  return `<div class="cal-date cal-date-text"><span>${t ? escapeHtml(t) : 'TBA'}</span></div>`;
}

function calendarAutoGrow(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

async function renderCalendar() {
  const countEl = document.getElementById('calendarCount');

  calendarRowsEl.innerHTML =
    '<div class="cal-skeleton"></div><div class="cal-skeleton"></div><div class="cal-skeleton"></div>';

  calendarRows = await loadCalendar();
  calendarRows.forEach(r => { r.date = calendarDateText(r.date); });   // no time in calendar dates
  calendarRowsEl.innerHTML = '';

  if (countEl) {
    countEl.hidden = calendarRows.length === 0;
    countEl.textContent = calendarRows.length + (calendarRows.length === 1 ? ' event' : ' events');
  }

  if (calendarRows.length === 0) {
    calendarRowsEl.innerHTML = `
      <div class="cal-empty">
        <strong>No events scheduled yet</strong>
        ${isAdmin ? 'Use "Add event" below to create the first one.' : 'Check back later for upcoming dates.'}
      </div>`;
    return;
  }

  calendarRows.forEach((row) => {
    const item = document.createElement('div');

    if (isAdmin) {
      item.className = 'cal-item cal-item-edit';
      item.innerHTML = `
        <input type="text" class="cal-input cal-input-date" data-field="date" data-id="${row.id}"
               placeholder="Mar 10" maxlength="40" aria-label="Date" value="${escapeHtml(row.date)}">
        <textarea rows="1" class="cal-input cal-input-label" data-field="label" data-id="${row.id}"
               placeholder="Event (e.g. Start of classes)" aria-label="Event">${escapeHtml(row.label)}</textarea>
        <button type="button" class="cal-remove" data-remove="${row.id}" title="Remove event" aria-label="Remove event">&times;</button>
      `;
    } else {
      const parsed = parseCalendarDate(row.date);
      const label = String(row.label || '').trim();
      item.className = 'cal-item';
      item.innerHTML = `
        ${calendarTileHtml(parsed, row.date)}
        <div class="cal-body">
          <div class="cal-label${label ? '' : ' is-empty'}">${label ? escapeHtml(label) : 'Untitled event'}</div>
          ${parsed && parsed.extra ? `<div class="cal-extra">${escapeHtml(parsed.extra)}</div>` : ''}
        </div>
      `;
    }
    calendarRowsEl.appendChild(item);
  });

  if (isAdmin) {
    calendarRowsEl.querySelectorAll('textarea').forEach(calendarAutoGrow);
    if (calendarFocusLast) {
      const dates = calendarRowsEl.querySelectorAll('.cal-input-date');
      const last = dates[dates.length - 1];
      if (last) {
        last.focus();
        last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
  calendarFocusLast = false;
}

if (calendarRowsEl) {
  // Edits are kept in memory and saved shortly after the admin stops typing
  calendarRowsEl.addEventListener('input', (e) => {
    const id = Number(e.target.dataset.id);
    const field = e.target.dataset.field;
    if (!id || !field) return;
    if (!isAdmin) {
      e.preventDefault();
      return;
    }

    if (e.target.tagName === 'TEXTAREA') calendarAutoGrow(e.target);

    const row = calendarRows.find(r => r.id === id);
    if (!row) return;
    row[field] = e.target.value;

    clearTimeout(calendarSaveTimers[id]);
    calendarSaveTimers[id] = setTimeout(() => saveCalendarRow(row), 500);
  });

  calendarRowsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const removeId = Number(btn.dataset.remove);
    if (!removeId) return;
    if (!isAdmin) {
      e.preventDefault();
      return;
    }

    clearTimeout(calendarSaveTimers[removeId]);
    await removeCalendarRow(removeId);
    await renderCalendar();
  });
}

if (addBtn) {
  addBtn.addEventListener('click', async () => {
    try {
      await createCalendarRow({ college: selectedCollege, date: '', label: '' });
      calendarFocusLast = true;
      await renderCalendar();
    } catch (err) {
      console.error('Error adding calendar row:', err);
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

let postModalToken = 0;

async function showPostModal(postId) {
  const modal = document.getElementById("postModal");
  const content = document.getElementById("postModalContent");

  const token = ++postModalToken;   // invalidate any previous open's pending renders

  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
  modal.classList.remove("hidden", "closing");
  modal.classList.add("show");

  content.innerHTML = `
    <div class="post-skeleton" aria-hidden="true">
      <div class="skel skel-banner"></div>
      <div class="skel skel-title"></div>
      <div class="skel skel-date"></div>
      <div class="skel skel-line w100"></div>
      <div class="skel skel-line w90"></div>
      <div class="skel skel-line w100"></div>
      <div class="skel skel-line w75"></div>
      <div class="skel skel-line w55"></div>
    </div>
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

    if (token !== postModalToken) return;   // modal was closed/reopened — abandon stale result

    if (error || !post) {
      setTimeout(() => {
        if (token !== postModalToken) return;   // guard inside the timeout too
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
      if (token !== postModalToken) return;   // stale render — don't overwrite newer content

      const adminButtons = isAdmin ? `
        <button class="modal-action-btn" onclick="editPost(${post.id})">Edit Post</button>
        <button class="modal-action-btn delete-btn" onclick="deletePost(${post.id})">Delete Post</button>
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
          <small class="post-date">${stripTime(post.date)}${courseDisplay}</small>
          <div>${post.content}</div>
          ${adminButtons}
        </div>
      `;
    }, remaining);

  } catch (err) {
    console.error("Error loading post:", err);
    if (token !== postModalToken) return;
    content.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <h2 style="margin-bottom:12px;">Error</h2>
        <p>Something went wrong. Please try again.</p>
        <button onclick="closePostModal()" style="margin-top:16px;padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;">Close</button>
      </div>
    `;
  }
}

function closePostModal() {
  postModalToken++;   // invalidate any pending render for the open being closed

  const modal = document.getElementById("postModal");
  modal.classList.add("closing");

  setTimeout(() => {
    modal.classList.remove("show", "closing");
    modal.classList.add("hidden");
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
  }, 200);
}

// async function showPostModal(postId) {
//   const modal = document.getElementById("postModal");
//   const content = document.getElementById("postModalContent");

//   document.documentElement.classList.add("modal-open");
//   document.body.classList.add("modal-open");
//   modal.classList.remove("hidden", "closing");
//   modal.classList.add("show");

//   content.innerHTML = `
//     <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:14px;">
//       <div style="width:42px;height:42px;border:4px solid rgba(0,0,0,0.15);border-top-color:rgba(0,0,0,0.65);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
//       <div style="font-size:16px;color:rgba(0,0,0,0.7);">Loading post...</div>
//     </div>
//     <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
//   `;

//   const startTime = Date.now();

//   try {
//     const { data: post, error } = await db
//       .from("posts")
//       .select("*")
//       .eq("id", postId)
//       .single();

//     const elapsed = Date.now() - startTime;
//     const remaining = Math.max(0, 200 - elapsed);

//     if (error || !post) {
//       setTimeout(() => {
//         content.innerHTML = `
//           <div style="text-align:center;padding:40px 20px;">
//             <h2 style="margin-bottom:12px;">Error</h2>
//             <p>Could not load post. Please try again.</p>
//           </div>
//         `;
//       }, remaining);
//       return;
//     }

//     setTimeout(() => {
//       const adminButtons = isAdmin ? `
//         <button class="modal-action-btn" onclick="editPost(${post.id})">Edit Post</button>
//         <button class="modal-action-btn delete-btn" onclick="deletePost(${post.id})">Delete Post</button>
//       ` : '';

//       const bannerHtml = post.banner ?
//         `<img src="${post.banner}" class="post-banner" onclick="openImageOverlay('${post.banner}')" title="Click to view full size">` :
//         "";

//       const courseNames = {
//         'comtech': 'Communication & Information Technology',
//         'indtech': 'Industrial Technology',
//         'education': 'Education',
//         'business': 'Business Administration',
//         'nursing': 'Nursing',
//         'arts': 'Arts & Sciences',
//         'engineering': 'Engineering',
//         'agri': 'Agriculture & Forestry',
//         'hospitality': 'Hospitality Management',
//         'criminology': 'Criminology',
//         'midwifery': 'Midwifery',
//         'fisheries': 'Fisheries',
//         'it-voc': 'IT (Vocational)',
//         'comp-tech': 'Computer Technician',
//         'architecture': 'Architecture'
//       };
//       const courseDisplay = post.course ? ` | ${courseNames[post.course] || post.course}` : '';

//       content.innerHTML = `
//         <div class="post-loaded">
//           ${bannerHtml}
//           <h2>${post.title}</h2>
//           <small class="post-date">${post.date}${courseDisplay}</small>
//           <div>${post.content}</div>
//           ${adminButtons}
//         </div>
//       `;
//     }, remaining);

//   } catch (err) {
//     console.error("Error loading post:", err);
//     content.innerHTML = `
//       <div style="text-align:center;padding:40px 20px;">
//         <h2 style="margin-bottom:12px;">Error</h2>
//         <p>Something went wrong. Please try again.</p>
//         <button onclick="closePostModal()" style="margin-top:16px;padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;">Close</button>
//       </div>
//     `;
//   }
// }

async function deletePost(id) {
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

// function closePostModal() {
//   const modal = document.getElementById("postModal");
//   modal.classList.add("closing");

//   setTimeout(() => {
//     modal.classList.remove("show", "closing");
//     modal.classList.add("hidden");
//     document.documentElement.classList.remove("modal-open");
//     document.body.classList.remove("modal-open");
//   }, 200);
// }

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

  if (activeTagFilters.length > 0) {
    finalPosts = finalPosts.filter(post => {
      const postTags = String(post.tag || '').split(',').filter(Boolean);
      // OR logic: post must have AT LEAST ONE of the selected tags
      return postTags.some(t => activeTagFilters.includes(t));
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

    const postTags = String(post.tag || '').split(',').filter(Boolean);
    const tagBadges = postTags.length > 0
      ? `<div class="news-card-tags">${postTags
          .filter(t => tagConfig[t])
          .map(t => `<span class="news-card-tag" style="background:${tagConfig[t].color}">${tagConfig[t].label}</span>`)
          .join('')}</div>`
    : '';

    if (post.banner) {
      card.innerHTML = `
        <div class="news-card-image" style="background-image:url('${post.banner}')">
          ${tagBadges}
        </div>
        <div class="news-card-body">
          <div class="news-card-title">${escapeHtml(post.title)}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="news-card-image" style="background:#667eea;display:flex;align-items:center;justify-content:center;">
          ${tagBadges}
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
  window.location.href = 'login.html';
}

function continuetoMenu() {
  window.location.href = 'index.html';
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
  const addCalendarBtn = document.getElementById('addCalendarRowBtn');
  const loginBtn = document.getElementById('adminLoginBtn');
  const accountMenu = document.getElementById('accountMenu');

  if (user && admin) {
    addCalendarBtn?.classList.add('visible');
    loginBtn?.classList.add('hidden');
    if (accountMenu) {
      accountMenu.classList.add('visible');
      const email = user.email || '';
      const emailEl = document.getElementById('accountEmail');
      emailEl.textContent = email;
      emailEl.title = email;
      document.getElementById('accountPosition').textContent = user.position || 'Admin';
      document.getElementById('accountAvatar').textContent = (email.charAt(0) || 'A').toUpperCase();
    }
  } else {
    addCalendarBtn?.classList.remove('visible');
    loginBtn?.classList.remove('hidden');
    accountMenu?.classList.remove('visible');
    closeAccountMenu();
  }
}

// ============================================================
// ACCOUNT MENU (dropdown in the header)
// ============================================================
function toggleAccountMenu(e) {
  e?.stopPropagation();
  const menu = document.getElementById('accountMenu');
  if (!menu) return;
  const open = !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  document.getElementById('accountTrigger')?.setAttribute('aria-expanded', String(open));
}

function closeAccountMenu() {
  const menu = document.getElementById('accountMenu');
  if (!menu) return;
  menu.classList.remove('open');
  document.getElementById('accountTrigger')?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('accountMenu');
  if (menu && !menu.contains(e.target)) closeAccountMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAccountMenu();
});

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

function renderTagFilters() {
  const row = document.getElementById('tagFilterRow');
  if (!row) return;

  const label = row.querySelector('span');
  row.innerHTML = '';
  if (label) row.appendChild(label);

  // "All" chip — clears everything when active
  const allChip = document.createElement('button');
  allChip.className = 'tag-chip tag-chip-all' + (activeTagFilters.length === 0 ? ' active' : '');
  allChip.textContent = 'All';
  allChip.onclick = () => {
    activeTagFilters = [];
    currentPage = 1;
    renderTagFilters();
    applyAllFilters();
  };
  row.appendChild(allChip);

  // Individual tag chips — toggle on click
  Object.entries(tagConfig).forEach(([key, cfg]) => {
    const isActive = activeTagFilters.includes(key);
    const chip = document.createElement('button');
    chip.className = 'tag-chip' + (isActive ? ' active' : '');
    chip.textContent = cfg.label;
    chip.style.borderColor = cfg.color;
    chip.style.color = isActive ? '#fff' : cfg.color;
    if (isActive) chip.style.background = cfg.color;
    chip.onclick = () => {
      if (isActive) {
        activeTagFilters = activeTagFilters.filter(t => t !== key);
      } else {
        activeTagFilters.push(key);
      }
      currentPage = 1;
      renderTagFilters();
      applyAllFilters();
    };
    row.appendChild(chip);
  });
}