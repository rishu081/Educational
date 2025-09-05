// ====== Fixed credentials ======
const CREDS = {
  teacher: { username: 'teacher123', password: 'pass123' },
  student: { username: 'student123', password: 'pass123' },
  owner:   { username: 'owner123',   password: 'pass123' }
};

// ====== Utility: storage ======
const load = (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ====== Seed demo data (runs once) ======
function seedData(){
  if(localStorage.getItem('subjects')) return;
  const subjects = [
    {
      id: 'sub-math',
      name: 'Mathematics',
      teachers: ['Dr. Rao'],
      modules: [
        {
          id: 'mod-algebra',
          teacher: 'Dr. Rao',
          title: 'Algebra Basics',
          video: 'https://www.youtube.com/embed/QVKj3LADCnA',
          description: 'Introduction to variables, expressions, and simple equations. Perfect for beginners.',
          pdfName: 'algebra.pdf',
          pdfUrl: 'assets/algebra.pdf',
          comments: [{ by: 'student123', text: 'Very clear explanation!' }]
        }
      ]
    },
    {
      id: 'sub-physics',
      name: 'Physics',
      teachers: ['Prof. Mehta'],
      modules: [
        {
          id: 'mod-motion',
          teacher: 'Prof. Mehta',
          title: 'Motion & Forces',
          video: 'https://www.youtube.com/embed/8F3dQZ1sT0o',
          description: 'Understand velocity, acceleration, and Newton’s laws with real-world examples.',
          pdfName: 'motion.pdf',
          pdfUrl: 'assets/motion.pdf',
          comments: [{ by: 'student123', text: 'Loved the visuals!' }]
        }
      ]
    },
    {
      id: 'sub-chem',
      name: 'Chemistry',
      teachers: ['Dr. Sen'],
      modules: [
        {
          id: 'mod-atomic',
          teacher: 'Dr. Sen',
          title: 'Atomic Structure',
          video: 'https://www.youtube.com/embed/GFIvH5DNK0Q',
          description: 'Protons, neutrons, electrons, and how they make up atoms.',
          pdfName: 'atoms.pdf',
          pdfUrl: 'assets/atoms.pdf',
          comments: []
        }
      ]
    }
  ];
  save('subjects', subjects);
}
seedData();

// ====== Login handling ======
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      const err = document.getElementById('loginError');
      const role = Object.keys(CREDS).find(r => CREDS[r].username === u && CREDS[r].password === p);
      if(!role){ err.style.display = 'block'; return }
      localStorage.setItem('user', JSON.stringify({ name: u, role }));
      window.location.href = 'dashboard.html';
    });
  }

  if(window.location.pathname.endsWith('dashboard.html')){
    const user = JSON.parse(localStorage.getItem('user')||'null');
    if(!user){ window.location.href = 'index.html'; return }
    document.getElementById('logoutBtn').onclick = () => { localStorage.removeItem('user'); window.location.href='index.html' }
    document.getElementById('userInfo').textContent = `Signed in as ${user.name} — Role: ${user.role}`;
    renderDashboard(user);
  }
});

function renderDashboard(user){
  const subjects = load('subjects', []);
  const root = document.getElementById('dashboardContent');
  if(user.role==='teacher') return renderTeacher(root, user, subjects);
  if(user.role==='student') return renderStudent(root, user, subjects);
  if(user.role==='owner')   return renderOwner(root, subjects);
}

// ====== TEACHER ======
function renderTeacher(root, user, subjects){
  root.innerHTML = `
    <div class="row">
      <div class="card">
        <h2>Create Subject</h2>
        <input id="newSubjectName" placeholder="Subject name (e.g., Computer Science)"/>
        <button id="addSubjectBtn">Add Subject</button>
      </div>
      <div class="card">
        <h2>Add Module</h2>
        <label>Subject</label>
        <select id="subjectSelect"></select>
        <label>Module Title</label>
        <input id="modTitle" placeholder="e.g., Introduction to Algorithms"/>
        <label>Video Link (YouTube URL)</label>
        <input id="modVideo" placeholder="https://www.youtube.com/watch?v=..."/>
        <label>Description</label>
        <textarea id="modDesc" rows="4" placeholder="Short summary of this module..."></textarea>
        <label>PDF (notes / worksheet)</label>
        <input id="modPdf" type="file" accept="application/pdf"/>
        <button id="addModuleBtn">Add Module</button>
        <p class="small">Modules you add will be attributed to you (<b>${user.name}</b>). Students can filter by teacher.</p>
      </div>
    </div>
    <div class="card">
      <h2>Your Subjects</h2>
      <div id="teacherSubjects"></div>
    </div>
  `;

  // populate subjects dropdown
  const subjSel = root.querySelector('#subjectSelect');
  function refreshDropdown(){
    const data = load('subjects', []);
    subjSel.innerHTML = '<option value="">-- choose --</option>' + data.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  }
  refreshDropdown();

  root.querySelector('#addSubjectBtn').onclick = () => {
    const name = root.querySelector('#newSubjectName').value.trim();
    if(!name) return alert('Enter subject name');
    const data = load('subjects', []);
    data.push({ id: 'sub-'+Date.now(), name, teachers: [], modules: [] });
    save('subjects', data);
    root.querySelector('#newSubjectName').value='';
    refreshDropdown();
    refreshTeacherSubjects();
  };

  root.querySelector('#addModuleBtn').onclick = () => {
    const subjectId = subjSel.value;
    if(!subjectId) return alert('Choose a subject');
    const title = root.querySelector('#modTitle').value.trim();
    const videoInput = root.querySelector('#modVideo').value.trim();
    const desc = root.querySelector('#modDesc').value.trim();
    const file = root.querySelector('#modPdf').files[0];
    if(!title || !videoInput || !desc || !file) return alert('Fill all fields');
    const embed = toYouTubeEmbed(videoInput);
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const data = load('subjects', []);
      const sub = data.find(s=>s.id===subjectId);
      if(!sub) return;
      if(!sub.teachers.includes(user.name)) sub.teachers.push(user.name);
      sub.modules.push({
        id: 'mod-'+Date.now(), teacher: user.name, title,
        video: embed || videoInput, description: desc,
        pdfName: file.name, pdfUrl: ev.target.result, comments: []
      });
      save('subjects', data);
      ['#modTitle','#modVideo','#modDesc'].forEach(sel=> root.querySelector(sel).value='');
      root.querySelector('#modPdf').value='';
      refreshTeacherSubjects();
      alert('Module added!');
    };
    reader.readAsDataURL(file);
  };

  function refreshTeacherSubjects(){
    const wrap = root.querySelector('#teacherSubjects');
    const data = load('subjects', []);
    wrap.innerHTML = '';
    data.forEach(s=>{
      const div = document.createElement('div');
      div.className = 'card';
      const mine = s.modules.filter(m=>m.teacher===user.name);
      div.innerHTML = `<h3>${s.name}</h3>
        <div class="small">${mine.length} module(s) by you</div>
        <ul class="list">${
          mine.map(m=>`<li><b>${m.title}</b> • <span class="badge">PDF: ${m.pdfName||'None'}</span></li>`).join('') || '<li class="small">No modules yet</li>'
        }</ul>`;
      wrap.appendChild(div);
    });
  }
  refreshTeacherSubjects();
}

// ====== STUDENT ======
function renderStudent(root, user, subjects){
  root.innerHTML = `
    <div class="card">
      <h2>Find Resources</h2>
      <div class="row">
        <div>
          <label>Subject</label>
          <select id="stuSubj"></select>
        </div>
        <div>
          <label>Choose Teacher</label>
          <select id="stuTeacher"></select>
        </div>
        <div>
          <label>Search</label>
          <input id="stuSearch" placeholder="Search modules by title or description"/>
        </div>
      </div>
    </div>
    <div id="results"></div>
  `;

  const subjSel = root.querySelector('#stuSubj');
  const teachSel = root.querySelector('#stuTeacher');
  const searchInp = root.querySelector('#stuSearch');
  const results = root.querySelector('#results');

  function refreshSubjects(){
    const data = load('subjects', []);
    subjSel.innerHTML = '<option value="">-- choose --</option>' + data.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    teachSel.innerHTML = '<option value="all">All teachers</option>';
    results.innerHTML = '<div class="card small">Choose a subject to begin.</div>';
  }
  refreshSubjects();

  subjSel.onchange = () => {
    const data = load('subjects', []);
    const s = data.find(x=>x.id===subjSel.value);
    const teachers = s ? s.teachers : [];
    teachSel.innerHTML = '<option value="all">All teachers</option>' + teachers.map(t=>`<option value="${t}">${t}</option>`).join('');
    renderList();
  };
  teachSel.onchange = renderList;
  searchInp.oninput = renderList;

  function renderList(){
    const data = load('subjects', []);
    const s = data.find(x=>x.id===subjSel.value);
    if(!s){ results.innerHTML=''; return }
    const teacherFilter = teachSel.value;
    const q = (searchInp.value||'').toLowerCase();
    const list = s.modules
      .filter(m => teacherFilter==='all' ? true : m.teacher===teacherFilter)
      .filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));

    results.innerHTML = list.map(m=>`
      <div class="card">
        <div class="badge">Teacher: ${m.teacher}</div>
        <h3 style="margin:8px 0">${m.title}</h3>
        <p class="small">${m.description}</p>
        ${m.video ? `<iframe class="embed" src="${m.video}" allowfullscreen></iframe>` : ''}
        <div style="margin:8px 0">${m.pdfUrl ? `<a class="badge" href="${m.pdfUrl}" download="${m.pdfName}">Download PDF</a>` : '<span class="small">No PDF</span>'}</div>
        <div style="margin-top:8px">
          <h4>Comments</h4>
          <ul class="list" id="c-${m.id}">${m.comments.map(c=>`<li><b>${c.by}</b>: ${c.text}</li>`).join('') || '<li class="small">No comments yet</li>'}</ul>
          <div style="display:flex; gap:8px; align-items:center">
            <input id="input-${m.id}" placeholder="Add a comment..."/>
            <button onclick="addComment('${s.id}','${m.id}','${user.name}')">Submit</button>
          </div>
        </div>
      </div>
    `).join('') || '<div class="card small">No modules match your filters.</div>';
  }
}

function addComment(subjectId, moduleId, by){
  const subjects = load('subjects', []);
  const sub = subjects.find(s=>s.id===subjectId);
  if(!sub) return;
  const mod = sub.modules.find(m=>m.id===moduleId);
  const inp = document.getElementById('input-'+moduleId);
  const txt = inp.value.trim();
  if(!txt) return;
  mod.comments.push({ by, text: txt });
  save('subjects', subjects);
  inp.value='';
  const ul = document.getElementById('c-'+moduleId);
  ul.innerHTML = mod.comments.map(c=>`<li><b>${c.by}</b>: ${c.text}</li>`).join('');
}

// ====== OWNER ======
function renderOwner(root, subjects){
  root.innerHTML = '<div class="card"><h2>Platform Activity (Read‑only)</h2><p class="small">All subjects, modules, teachers, and comments.</p></div>';
  const data = load('subjects', []);
  data.forEach(s=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${s.name} <span class="badge">${s.teachers.length} teacher(s)</span></h3>`;
    const ul = document.createElement('ul');
    ul.className = 'list';
    s.modules.forEach(m=>{
      const li = document.createElement('li');
      li.innerHTML = `<div class="badge">Teacher: ${m.teacher}</div>
        <div><b>${m.title}</b></div>
        <div class="small">${m.description}</div>
        <div class="small">Video: ${m.video}</div>
        <div class="small">PDF: ${m.pdfName||'None'}</div>
        <div style="margin-top:6px"><b>Comments</b>
          <ul class="list">${m.comments.map(c=>`<li><b>${c.by}</b>: ${c.text}</li>`).join('') || '<li class="small">No comments</li>'}</ul>
        </div>`;
      ul.appendChild(li);
    });
    div.appendChild(ul);
    root.appendChild(div);
  });
}

// ====== Helpers ======
function toYouTubeEmbed(url){
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : '';
}
