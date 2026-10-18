// ============================================
// UNI-COL NEWS - GOOGLE SHEETS API CLIENT
// ============================================

// PASTE YOUR REDEPLOYED APPS SCRIPT WEB APP URL HERE
const API_URL = 'https://script.google.com/macros/s/AKfycby1WM-iBzqsLnKiXSqQkUuhxn_TrsxYkh9UAGMhAxkAmkicl4XSMyAXMTBK6m-39rKV/exec';

//CONFIG OF THE FUCKING TAGS
const tagConfig = {
  event:        { label: 'Event',        color: '#e74c3c' },
  announcement: { label: 'Announcement', color: '#3498db' },
  news:         { label: 'News',         color: '#2ecc71' },
  academic:     { label: 'Academic',     color: '#9b59b6' },
  sports:       { label: 'Sports',       color: '#f39c12' },
  misc:         { label: 'Misc',         color: '#7f8c8d' }
};

// =========================
// AUTH (Google Sheets backed)
// =========================
let currentUser = null;
let isAdmin = false;

async function checkAuth() {
  const adminData = localStorage.getItem('unicol_admin');
  if (adminData) {
    const parsed = JSON.parse(adminData);
    currentUser = { email: parsed.email };
    isAdmin = true;
  } else {
    currentUser = null;
    isAdmin = false;
  }
  updateUIForAuth();
  return currentUser;
}

async function signIn(email, password) {
  const result = await apiPost({ action: 'adminLogin', email, password });

  if (result.error) {
    throw new Error(result.error.message || 'Invalid credentials');
  }

  currentUser = result.data.user;
  isAdmin = result.data.isAdmin;
  localStorage.setItem('unicol_admin', JSON.stringify({ email: currentUser.email }));
  updateUIForAuth();
  return { user: currentUser };
}

async function signUp(email, password) {
  const result = await apiPost({ action: 'adminRegister', email, password });

  if (result.error) {
    throw new Error(result.error.message || 'Registration failed');
  }

  return result.data;
}

async function signOut() {
  localStorage.removeItem('unicol_admin');
  currentUser = null;
  isAdmin = false;
  updateUIForAuth();
}

function updateUIForAuth() {
  window.dispatchEvent(new CustomEvent('authStateChanged', {
    detail: { user: currentUser, isAdmin }
  }));
}

// =========================
// API HELPERS (with debug logging)
// =========================
async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_URL}?${qs}`;
  console.log('[API GET]', url);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    console.log('[API GET response]', json);
    return json;
  } catch (err) {
    console.error('[API GET error]', err);
    return { data: null, error: err.message };
  }
}

async function apiPost(body) {
  console.log('[API POST]', API_URL, body);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    console.log('[API POST response]', json);
    return json;
  } catch (err) {
    console.error('[API POST error]', err);
    return { data: null, error: err.message };
  }
}

// =========================
// DB BUILDER
// =========================
const db = {
  from: (table) => createBuilder(table),
  rpc: async () => ({ data: null, error: { message: 'RPC not supported' } })
};

function createBuilder(table) {
  let filters = {};
  let orderCol = null;
  let orderAsc = true;
  let isSingle = false;
  let insertRows = null;
  let updateData = null;
  let deleteMode = false;

  const builder = {
    select: () => builder,
    eq: (field, value) => { filters[field] = value; return builder; },
    order: (col, opts) => { orderCol = col; orderAsc = opts?.ascending !== false; return builder; },
    single: () => { isSingle = true; return builder; },

    insert: (rows) => { insertRows = rows; return builder; },
    update: (data) => { updateData = data; return builder; },
    delete: () => { deleteMode = true; return builder; },

    then: (onResolve, onReject) => {
      return runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode })
        .then(onResolve, onReject);
    }
  };

  return builder;
}

async function runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode }) {
  console.log('[DB Query]', { table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode });

  try {
    if (table === 'posts') {
      if (insertRows && insertRows.length > 0) {
        return await apiPost({ action: 'createPost', post: insertRows[0] });
      }

      if (updateData) {
        if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
        return await apiPost({ action: 'updatePost', id: filters.id, updates: updateData });
      }

      if (deleteMode) {
        if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
        return await apiPost({ action: 'deletePost', id: filters.id });
      }

      const params = { action: 'getPosts' };
      if (filters.college) params.college = filters.college;
      if (filters.year)    params.year = String(filters.year);
      if (filters.course)  params.course = filters.course;
      if (filters.search)  params.search = filters.search;
      if (filters.id) {
        params.id = filters.id;
        params.single = 'true';
      }
      if (orderCol) {
        params.order = orderCol;
        params.asc = String(orderAsc);
      }

      return await apiGet(params);
    }

    if (table === 'calendar') {
      if (insertRows && insertRows.length > 0) {
        return await apiPost({ action: 'createCalendar', row: insertRows[0] });
      }

      if (updateData) {
        if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
        return await apiPost({ action: 'updateCalendar', id: filters.id, updates: updateData });
      }

      if (deleteMode) {
        if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
        return await apiPost({ action: 'deleteCalendar', id: filters.id });
      }

      const params = { action: 'getCalendar' };
      if (filters.college) params.college = filters.college;

      return await apiGet(params);
    }

    return { data: null, error: { message: 'Unknown table: ' + table } };

  } catch (err) {
    console.error('[DB Query error]', err);
    return { data: null, error: { message: err.message } };
  }
}

// =========================
// DIRECT CALENDAR API
// =========================
async function fetchCalendar(college) {
  const result = await apiGet({ action: 'getCalendar', college });
  return result.data || [];
}

async function createCalendarRow(row) {
  const result = await apiPost({ action: 'createCalendar', row });
  return result.data ? result.data[0] : row;
}

async function updateCalendarRow(id, updates) {
  const result = await apiPost({ action: 'updateCalendar', id, updates });
  return result.data ? result.data[0] : updates;
}

async function deleteCalendarRow(id) {
  await apiPost({ action: 'deleteCalendar', id });
}


// // ============================================
// // UNI-COL NEWS - GOOGLE SHEETS API CLIENT
// // ============================================

// // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// const API_URL = 'https://script.google.com/macros/s/AKfycbyl4cDhBqtSTgWEHWPkmrKXhhXH0r6_ay8s2SjYyBFAMGb_bo8SWqjV9cj5znoUHhHp/exec';

// // =========================
// // AUTH
// // =========================
// let currentUser = null;
// let isAdmin = false;

// async function checkAuth() {
//   const adminData = localStorage.getItem('unicol_admin');
//   if (adminData) {
//     const parsed = JSON.parse(adminData);
//     currentUser = { email: parsed.email };
//     isAdmin = true;
//   } else {
//     currentUser = null;
//     isAdmin = false;
//   }
//   updateUIForAuth();
//   return currentUser;
// }

// async function signIn(email, password) {
//   if (email === 'admin' && password === 'admin123') {
//     currentUser = { email };
//     isAdmin = true;
//     localStorage.setItem('unicol_admin', JSON.stringify({ email }));
//     updateUIForAuth();
//     return { user: currentUser };
//   }
//   throw new Error('Invalid credentials');
// }

// async function signUp(email, password) {
//   throw new Error('Registration disabled in demo mode');
// }

// async function signOut() {
//   localStorage.removeItem('unicol_admin');
//   currentUser = null;
//   isAdmin = false;
//   updateUIForAuth();
// }

// function updateUIForAuth() {
//   window.dispatchEvent(new CustomEvent('authStateChanged', {
//     detail: { user: currentUser, isAdmin }
//   }));
// }

// // =========================
// // API HELPERS (with debug logging)
// // =========================
// async function apiGet(params) {
//   const qs = new URLSearchParams(params).toString();
//   const url = `${API_URL}?${qs}`;
//   console.log('[API GET]', url);

//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//     const json = await res.json();
//     console.log('[API GET response]', json);
//     return json;
//   } catch (err) {
//     console.error('[API GET error]', err);
//     return { data: null, error: err.message };
//   }
// }

// async function apiPost(body) {
//   console.log('[API POST]', API_URL, body);

//   try {
//     // NO headers — browser sends as text/plain, avoiding CORS preflight
//     const res = await fetch(API_URL, {
//       method: 'POST',
//       body: JSON.stringify(body)
//     });

//     if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//     const json = await res.json();
//     console.log('[API POST response]', json);
//     return json;
//   } catch (err) {
//     console.error('[API POST error]', err);
//     return { data: null, error: err.message };
//   }
// }

// // =========================
// // DB BUILDER
// // =========================
// const db = {
//   from: (table) => createBuilder(table),
//   rpc: async () => ({ data: null, error: { message: 'RPC not supported' } })
// };

// function createBuilder(table) {
//   let filters = {};
//   let orderCol = null;
//   let orderAsc = true;
//   let isSingle = false;
//   let insertRows = null;
//   let updateData = null;
//   let deleteMode = false;

//   const builder = {
//     select: () => builder,
//     eq: (field, value) => { filters[field] = value; return builder; },
//     order: (col, opts) => { orderCol = col; orderAsc = opts?.ascending !== false; return builder; },
//     single: () => { isSingle = true; return builder; },

//     insert: (rows) => { insertRows = rows; return builder; },
//     update: (data) => { updateData = data; return builder; },
//     delete: () => { deleteMode = true; return builder; },

//     then: (onResolve, onReject) => {
//       return runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode })
//         .then(onResolve, onReject);
//     }
//   };

//   return builder;
// }

// async function runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode }) {
//   console.log('[DB Query]', { table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode });

//   try {
//     if (table === 'posts') {
//       if (insertRows && insertRows.length > 0) {
//         return await apiPost({ action: 'createPost', post: insertRows[0] });
//       }

//       if (updateData) {
//         if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
//         return await apiPost({ action: 'updatePost', id: filters.id, updates: updateData });
//       }

//       if (deleteMode) {
//         if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
//         return await apiPost({ action: 'deletePost', id: filters.id });
//       }

//       const params = { action: 'getPosts' };
//       if (filters.college) params.college = filters.college;
//       if (filters.year)    params.year = String(filters.year);
//       if (filters.course)  params.course = filters.course;
//       if (filters.search)  params.search = filters.search;
//       if (filters.id) {
//         params.id = filters.id;
//         params.single = 'true';
//       }
//       if (orderCol) {
//         params.order = orderCol;
//         params.asc = String(orderAsc);
//       }

//       return await apiGet(params);
//     }

//     if (table === 'calendar') {
//       if (insertRows && insertRows.length > 0) {
//         return await apiPost({ action: 'createCalendar', row: insertRows[0] });
//       }

//       if (updateData) {
//         if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
//         return await apiPost({ action: 'updateCalendar', id: filters.id, updates: updateData });
//       }

//       if (deleteMode) {
//         if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
//         return await apiPost({ action: 'deleteCalendar', id: filters.id });
//       }

//       const params = { action: 'getCalendar' };
//       if (filters.college) params.college = filters.college;

//       return await apiGet(params);
//     }

//     return { data: null, error: { message: 'Unknown table: ' + table } };

//   } catch (err) {
//     console.error('[DB Query error]', err);
//     return { data: null, error: { message: err.message } };
//   }
// }

// // =========================
// // DIRECT CALENDAR API
// // =========================
// async function fetchCalendar(college) {
//   const result = await apiGet({ action: 'getCalendar', college });
//   return result.data || [];
// }

// async function createCalendarRow(row) {
//   const result = await apiPost({ action: 'createCalendar', row });
//   return result.data ? result.data[0] : row;
// }

// async function updateCalendarRow(id, updates) {
//   const result = await apiPost({ action: 'updateCalendar', id, updates });
//   return result.data ? result.data[0] : updates;
// }

// async function deleteCalendarRow(id) {
//   await apiPost({ action: 'deleteCalendar', id });
// }

// // ============================================
// // UNI-COL NEWS - GOOGLE SHEETS API CLIENT
// // ============================================

// // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
// const API_URL = 'https://script.google.com/macros/s/AKfycbwuwTMcXpyw97tNu-vLKsjYuvCf60o_Yl024gvXvyRfNUdIj0ApqaE4sMzIB8xSu2QD/exec';

// // =========================
// // AUTH (Local-only)
// // =========================
// let currentUser = null;
// let isAdmin = false;

// async function checkAuth() {
//   const adminData = localStorage.getItem('unicol_admin');
//   if (adminData) {
//     const parsed = JSON.parse(adminData);
//     currentUser = { email: parsed.email };
//     isAdmin = true;
//   } else {
//     currentUser = null;
//     isAdmin = false;
//   }
//   updateUIForAuth();
//   return currentUser;
// }

// async function signIn(email, password) {
//   if (email === 'admin' && password === 'admin123') {
//     currentUser = { email };
//     isAdmin = true;
//     localStorage.setItem('unicol_admin', JSON.stringify({ email }));
//     updateUIForAuth();
//     return { user: currentUser };
//   }
//   throw new Error('Invalid credentials');
// }

// async function signUp(email, password) {
//   throw new Error('Registration disabled in demo mode');
// }

// async function signOut() {
//   localStorage.removeItem('unicol_admin');
//   currentUser = null;
//   isAdmin = false;
//   updateUIForAuth();
// }

// function updateUIForAuth() {
//   window.dispatchEvent(new CustomEvent('authStateChanged', {
//     detail: { user: currentUser, isAdmin }
//   }));
// }

// // =========================
// // API HELPERS
// // =========================
// async function apiGet(params) {
//   const qs = new URLSearchParams(params).toString();
//   const res = await fetch(`${API_URL}?${qs}`);
//   return res.json();
// }

// async function apiPost(body) {
//   const res = await fetch(API_URL, {
//     method: 'POST',
//     body: JSON.stringify(body),
//     headers: { 'Content-Type': 'application/json' }
//   });
//   return res.json();
// }

// // =========================
// // DB BUILDER (Supabase-style API)
// // =========================
// const db = {
//   from: (table) => createBuilder(table),
//   rpc: async () => ({ data: null, error: { message: 'RPC not supported' } })
// };

// function createBuilder(table) {
//   let filters = {};
//   let orderCol = null;
//   let orderAsc = true;
//   let isSingle = false;
//   let insertRows = null;
//   let updateData = null;
//   let deleteMode = false;

//   const builder = {
//     select: () => builder,
//     eq: (field, value) => { filters[field] = value; return builder; },
//     order: (col, opts) => { orderCol = col; orderAsc = opts?.ascending !== false; return builder; },
//     single: () => { isSingle = true; return builder; },

//     insert: (rows) => { insertRows = rows; return builder; },
//     update: (data) => { updateData = data; return builder; },
//     delete: () => { deleteMode = true; return builder; },

//     then: (onResolve, onReject) => {
//       return runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode })
//         .then(onResolve, onReject);
//     }
//   };

//   return builder;
// }

// async function runQuery({ table, filters, orderCol, orderAsc, isSingle, insertRows, updateData, deleteMode }) {
//   try {
//     // -----------------
//     // POSTS TABLE
//     // -----------------
//     if (table === 'posts') {
//       // CREATE
//       if (insertRows && insertRows.length > 0) {
//         return await apiPost({ action: 'createPost', post: insertRows[0] });
//       }

//       // UPDATE
//       if (updateData) {
//         if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
//         return await apiPost({ action: 'updatePost', id: filters.id, updates: updateData });
//       }

//       // DELETE
//       if (deleteMode) {
//         if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
//         return await apiPost({ action: 'deletePost', id: filters.id });
//       }

//       // READ
//       const params = { action: 'getPosts' };
//       if (filters.college) params.college = filters.college;
//       if (filters.year)    params.year = String(filters.year);
//       if (filters.course)  params.course = filters.course;
//       if (filters.search)  params.search = filters.search;
//       if (filters.id) {
//         params.id = filters.id;
//         params.single = 'true';
//       }
//       if (orderCol) {
//         params.order = orderCol;
//         params.asc = String(orderAsc);
//       }

//       const result = await apiGet(params);
//       return result;
//     }

//     // -----------------
//     // CALENDAR TABLE
//     // -----------------
//     if (table === 'calendar') {
//       if (insertRows && insertRows.length > 0) {
//         return await apiPost({ action: 'createCalendar', row: insertRows[0] });
//       }

//       if (updateData) {
//         if (!filters.id) return { data: null, error: { message: 'Update requires .eq("id", value)' } };
//         return await apiPost({ action: 'updateCalendar', id: filters.id, updates: updateData });
//       }

//       if (deleteMode) {
//         if (!filters.id) return { data: null, error: { message: 'Delete requires .eq("id", value)' } };
//         return await apiPost({ action: 'deleteCalendar', id: filters.id });
//       }

//       const params = { action: 'getCalendar' };
//       if (filters.college) params.college = filters.college;

//       const result = await apiGet(params);
//       return result;
//     }

//     return { data: null, error: { message: 'Unknown table: ' + table } };

//   } catch (err) {
//     return { data: null, error: { message: err.message } };
//   }
// }

// // =========================
// // DIRECT CALENDAR API (used by news.js)
// // =========================
// async function fetchCalendar(college) {
//   const result = await apiGet({ action: 'getCalendar', college });
//   return result.data || [];
// }

// async function createCalendarRow(row) {
//   const result = await apiPost({ action: 'createCalendar', row });
//   return result.data ? result.data[0] : row;
// }

// async function updateCalendarRow(id, updates) {
//   const result = await apiPost({ action: 'updateCalendar', id, updates });
//   return result.data ? result.data[0] : updates;
// }

// async function deleteCalendarRow(id) {
//   await apiPost({ action: 'deleteCalendar', id });
// }




// // ==================== GOOGLE SHEETS AS DATABASE ====================

// const POSTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR2YPHcoG1EMcYbq8Bvp_KIa_AIgwL9_3iHWf2PZvPBpheAH_LXqOe4qIHfJwhKlYFFP6-1YPOD0_y7/pub?gid=0&single=true&output=csv';
// const CALENDAR_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR2YPHcoG1EMcYbq8Bvp_KIa_AIgwL9_3iHWf2PZvPBpheAH_LXqOe4qIHfJwhKlYFFP6-1YPOD0_y7/pub?gid=1240289917&single=true&output=csv';

// // Simple CSV parser
// function parseCSV(csvText) {
//   const lines = csvText.trim().split('\n');
//   if (lines.length < 2) return [];
  
//   const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
//   const result = [];
  
//   for (let i = 1; i < lines.length; i++) {
//     // Handle quoted fields with commas inside
//     const values = [];
//     let current = '';
//     let inQuotes = false;
    
//     for (let char of lines[i]) {
//       if (char === '"') {
//         inQuotes = !inQuotes;
//       } else if (char === ',' && !inQuotes) {
//         values.push(current.trim());
//         current = '';
//       } else {
//         current += char;
//       }
//     }
//     values.push(current.trim());
    
//     const obj = {};
//     headers.forEach((h, idx) => {
//       let val = values[idx] || '';
//       // Remove surrounding quotes
//       val = val.replace(/^"|"$/g, '');
//       // Convert numbers
//       if (h === 'id' || h === 'year') val = parseInt(val) || val;
//       obj[h] = val;
//     });
//     result.push(obj);
//   }
//   return result;
// }

// // Fetch posts from Google Sheet
// async function fetchPostsFromSheet(college, year, course, search) {
//   const res = await fetch(POSTS_SHEET_URL);
//   const csv = await res.text();
//   let posts = parseCSV(csv);
  
//   // Apply filters
//   if (college) posts = posts.filter(p => p.college === college);
//   if (year) posts = posts.filter(p => String(p.year) === String(year));
//   if (course) posts = posts.filter(p => p.course === course);
//   if (search) {
//     const s = search.toLowerCase();
//     posts = posts.filter(p => String(p.title).toLowerCase().includes(s));
//   }
  
//   return { data: posts, error: null };
// }

// // Fetch single post
// async function fetchPostFromSheet(id) {
//   const res = await fetch(POSTS_SHEET_URL);
//   const csv = await res.text();
//   const posts = parseCSV(csv);
//   const post = posts.find(p => p.id === Number(id));
//   return { data: post || null, error: post ? null : { message: 'Not found' } };
// }

// // Fetch calendar
// async function fetchCalendarFromSheet(college) {
//   const res = await fetch(CALENDAR_SHEET_URL);
//   const csv = await res.text();
//   let rows = parseCSV(csv);
//   if (college) rows = rows.filter(r => r.college === college);
//   return rows;
// }

// // ==================== AUTH (Local-only for admin) ====================

// let currentUser = null;
// let isAdmin = false;

// async function checkAuth() {
//   // Check localStorage for a simple admin flag
//   const adminData = localStorage.getItem('unicol_admin');
//   if (adminData) {
//     const parsed = JSON.parse(adminData);
//     currentUser = { email: parsed.email };
//     isAdmin = true;
//   } else {
//     currentUser = null;
//     isAdmin = false;
//   }
//   updateUIForAuth();
//   return currentUser;
// }

// async function signIn(email, password) {
//   // Simple hardcoded admin for demo
//   if (email === 'admin' && password === 'admin123') {
//     currentUser = { email };
//     isAdmin = true;
//     localStorage.setItem('unicol_admin', JSON.stringify({ email }));
//     updateUIForAuth();
//     return { user: currentUser };
//   }
//   throw new Error('Invalid credentials');
// }

// async function signUp(email, password) {
//   throw new Error('Registration disabled in demo mode');
// }

// async function signOut() {
//   localStorage.removeItem('unicol_admin');
//   currentUser = null;
//   isAdmin = false;
//   updateUIForAuth();
// }

// function updateUIForAuth() {
//   window.dispatchEvent(new CustomEvent('authStateChanged', { 
//     detail: { user: currentUser, isAdmin } 
//   }));
// }

// // ==================== DB WRAPPER (matches your existing code) ====================

// const db = {
//   from: (table) => {
//     let _filters = {};
//     let _orderCol = null;
//     let _orderAsc = true;

//     const builder = {
//       select: (cols) => builder,
      
//       eq: (field, value) => {
//         _filters[field] = value;
//         return builder;
//       },
      
//       order: (col, opts) => {
//         _orderCol = col;
//         _orderAsc = opts ? opts.ascending !== false : true;
//         return builder;
//       },
      
//       single: async () => {
//         if (table === 'posts' && _filters.id) {
//           return await fetchPostFromSheet(_filters.id);
//         }
//         return { data: null, error: { message: 'Single query requires id' } };
//       },
      
//       then: (resolve, reject) => {
//         return executeBuilder().then(resolve, reject);
//       }
//     };

//     async function executeBuilder() {
//       try {
//         let data = null;
        
//         if (table === 'posts') {
//           const result = await fetchPostsFromSheet(
//             _filters.college,
//             _filters.year,
//             _filters.course,
//             _filters.search
//           );
//           data = result.data;
//         } else if (table === 'calendar') {
//           data = await fetchCalendarFromSheet(_filters.college);
//         } else {
//           return { data: null, error: { message: 'Unknown table' } };
//         }

//         if (data && _orderCol) {
//           data.sort((a, b) => {
//             const aVal = a[_orderCol];
//             const bVal = b[_orderCol];
//             if (typeof aVal === 'number' && typeof bVal === 'number') {
//               return _orderAsc ? aVal - bVal : bVal - aVal;
//             }
//             const aStr = String(aVal || '');
//             const bStr = String(bVal || '');
//             return _orderAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
//           });
//         }

//         return { data, error: null };
//       } catch (err) {
//         return { data: null, error: { message: err.message } };
//       }
//     }

//     return builder;
//   },

//   insert: (rows) => ({
//     select: async () => {
//       // In Google Sheets mode, you can't insert from the website
//       // You edit the sheet directly
//       return { data: [{ id: Date.now() }], error: null };
//     }
//   }),

//   update: (updates) => ({
//     eq: (field, value) => ({
//       select: async () => ({ data: null, error: null })
//     })
//   }),

//   delete: () => ({
//     eq: async (field, value) => ({ error: null })
//   }),

//   rpc: () => Promise.resolve({ error: { message: 'RPC not supported' } })
// };