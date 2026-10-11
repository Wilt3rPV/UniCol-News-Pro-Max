// ============================================================
// ABOUT CAMPUS PANEL (slides in from the left)
// ============================================================

// Default descriptions shown when no custom info has been saved yet.
// Admins can overwrite these via the Edit button in the panel.
const defaultCampusInfo = {
  prmsuIba: {
    heading: "PRMSU - Iba Campus",
    description: "The flagship campus of President Ramon Magsaysay State University, located in Iba, Zambales. It houses the university's main administration and offers a wide range of undergraduate and graduate programs across multiple colleges."
  },
  prmsuBotolan: {
    heading: "PRMSU - Botolan Campus",
    description: "A scenic campus in Botolan, Zambales, known for its strong programs in agriculture, forestry, and education, serving students from the northern coastal towns of the province."
  },
  prmsuCaste: {
    heading: "PRMSU - Castillejos Campus",
    description: "Located in Castillejos, Zambales, serving students from the southern part of the province with programs in education, business administration, and information technology."
  },
  macsatIba: {
    heading: "MACSAT - Iba Campus",
    description: "Micro Asia College of Science and Technology in Iba offers technology-focused programs including computer science and business administration."
  },
  ccGapo: {
    heading: "Columban College - Olongapo",
    description: "Columban College's main campus in Olongapo City, offering programs in business and accountancy, computer studies, engineering, architecture, nursing, and arts, sciences & education."
  },
  prmsuMan: {
    heading: "PRMSU - Masinloc Campus",
    description: "PRMSU's Masinloc campus serves the northern Zambales community with programs in communication and information technology, business administration, and education."
  },
  prmsuCruz: {
    heading: "PRMSU - Sta. Cruz Campus",
    description: "PRMSU Sta. Cruz campus offers programs in communication and information technology and education for students in central Zambales."
  },
  ccCruz: {
    heading: "Columban College - Sta. Cruz",
    description: "Columban College's Sta. Cruz campus provides programs in education, business administration, and information systems for students in central Zambales."
  },
  gcGapo: {
    heading: "Gordon College - Olongapo",
    description: "Gordon College in Olongapo City is a community college offering programs in business and accountancy, computer studies, arts, sciences & education, and hospitality and tourism management."
  },
  lyceumBotolan: {
    heading: "Lyceum of Western Luzon - Botolan",
    description: "The Botolan campus of Lyceum of Western Luzon offers programs in business administration, computer studies, education, and hospitality management."
  }
};

let aboutData = null;

function getDefaultInfo(college) {
  const def = defaultCampusInfo[college];
  return {
    college: college,
    heading: def ? def.heading : "About this campus",
    description: def ? def.description : "No description has been added for this campus yet.",
    updated_at: null
  };
}

function formatAboutDate(val) {
  const d = new Date(val);
  if (isNaN(d)) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ============================================================
// OPEN / CLOSE PANEL
// ============================================================
async function openAboutPanel() {
  const panel = document.getElementById('aboutPanel');
  const backdrop = document.getElementById('aboutBackdrop');

  backdrop.classList.add('visible');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  document.getElementById('aboutCampusName').textContent =
    (typeof theme !== 'undefined' && theme) ? theme.name : '';

  renderAboutLoading();

  try {
    const info = await fetchCampusInfo(selectedCollege);
    if (info && (info.description || info.heading)) {
      aboutData = {
        college: selectedCollege,
        heading: info.heading || 'About this campus',
        description: info.description || '',
        updated_at: info.updated_at || null
      };
    } else {
      aboutData = getDefaultInfo(selectedCollege);
    }
  } catch (err) {
    console.error('Error loading campus info:', err);
    aboutData = getDefaultInfo(selectedCollege);
  }

  renderAboutView();
}

function closeAboutPanel() {
  const panel = document.getElementById('aboutPanel');
  const backdrop = document.getElementById('aboutBackdrop');

  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('visible');
  document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const panel = document.getElementById('aboutPanel');
    if (panel && panel.classList.contains('open')) {
      closeAboutPanel();
    }
  }
});

// ============================================================
// RENDERING
// ============================================================
function renderAboutLoading() {
  document.getElementById('aboutBody').innerHTML = `
    <div style="text-align:center;padding:40px 20px;color:#888;">
      <div style="width:32px;height:32px;border:3px solid #eee;border-top-color:#667eea;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
      <div style="font-size:14px;">Loading...</div>
    </div>
  `;
}

function renderAboutView() {
  const body = document.getElementById('aboutBody');

  const adminControls = isAdmin ? `
    <div class="about-actions">
      <button class="about-btn-edit" onclick="enterAboutEdit()">Edit</button>
    </div>
  ` : '';

  body.innerHTML = `
    <h3 class="about-heading">${escapeHtml(aboutData.heading)}</h3>
    <div class="about-description">${escapeHtml(aboutData.description)}</div>
    ${aboutData.updated_at ? `<div class="about-updated">Last updated: ${formatAboutDate(aboutData.updated_at)}</div>` : ''}
    ${adminControls}
  `;
}

// ============================================================
// ADMIN EDIT MODE
// ============================================================
function enterAboutEdit() {
  const body = document.getElementById('aboutBody');

  body.innerHTML = `
    <label class="about-label" for="aboutHeadingInput">Heading</label>
    <input type="text" id="aboutHeadingInput" class="about-input" maxlength="120"
           value="${escapeHtml(aboutData.heading)}" placeholder="e.g. PRMSU - Iba Campus">

    <label class="about-label" for="aboutDescInput">Description</label>
    <textarea id="aboutDescInput" class="about-input about-textarea" maxlength="5000"
              placeholder="Write a short description of this campus...">${escapeHtml(aboutData.description)}</textarea>

    <div class="about-actions">
      <button class="about-btn-save" onclick="saveAbout()">Save</button>
      <button class="about-btn-cancel" onclick="renderAboutView()">Cancel</button>
    </div>
  `;
}

async function saveAbout() {
  const heading = document.getElementById('aboutHeadingInput').value.trim();
  const description = document.getElementById('aboutDescInput').value.trim();

  if (!description) {
    showError('Description cannot be empty');
    return;
  }

  showToast('Saving about section...', 'loading');

  aboutData = {
    college: selectedCollege,
    heading: heading || 'About this campus',
    description: description,
    updated_at: new Date().toISOString()
  };

  try {
    const result = await saveCampusInfo(aboutData);

    if (result && result.fallback) {
      // Backend action missing — saved to localStorage only
      showToast('Saved on this device only (add Apps Script action to sync)', 'success');
    } else {
      showToast('About section saved!', 'success');
    }
  } catch (err) {
    console.error('Error saving campus info:', err);
    showError('Error saving about section');
  }

  renderAboutView();
  setTimeout(hideToast, 2500);
}
