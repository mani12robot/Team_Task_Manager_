// ============================================================
// js/app.js — Team Task Manager Frontend Logic
// ============================================================

// ─── State ────────────────────────────────────────────────
let currentUser  = null;
let allProjects  = [];
let allUsers     = [];
let projectModal = null;
let taskModal    = null;
let statusModal  = null;
let toastEl      = null;

// ─── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Bootstrap modals
  projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
  taskModal    = new bootstrap.Modal(document.getElementById('taskModal'));
  statusModal  = new bootstrap.Modal(document.getElementById('statusModal'));
  toastEl      = new bootstrap.Toast(document.getElementById('appToast'), { delay: 3000 });

  // Nav links
  document.querySelectorAll('.nav-link-btn').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });

  if (Auth.isLoggedIn()) {
    bootstrapApp();
  } else {
    showAuth();
  }
});

// ─── Auth Flows ───────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup'));
  });
  document.getElementById('loginForm').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('authAlert').classList.add('d-none');
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) return showAuthAlert('Please fill in all fields.', 'error');

  setLoading('loginForm', true);
  try {
    const data = await AuthAPI.login(email, password);
    Auth.setSession(data.token, data.user);
    bootstrapApp();
  } catch (err) {
    showAuthAlert(err.message, 'error');
  } finally {
    setLoading('loginForm', false);
  }
}

async function handleSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const role     = document.getElementById('signupRole').value;
  if (!name || !email || !password) return showAuthAlert('Please fill in all fields.', 'error');
  if (password.length < 6) return showAuthAlert('Password must be at least 6 characters.', 'error');

  setLoading('signupForm', true);
  try {
    const data = await AuthAPI.signup(name, email, password, role);
    Auth.setSession(data.token, data.user);
    bootstrapApp();
  } catch (err) {
    showAuthAlert(err.message, 'error');
  } finally {
    setLoading('signupForm', false);
  }
}

function logout() {
  Auth.clear();
  currentUser = null;
  allProjects = [];
  showAuth();
}

// ─── App Bootstrap ────────────────────────────────────────
async function bootstrapApp() {
  currentUser = Auth.getUser();
  showApp();
  applyRoleUI();
  loadNavUser();
  await Promise.all([loadProjects(), loadUsers()]);
  navigateTo('dashboard');
}

function showAuth() {
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
  document.getElementById('mainNav').style.display = 'none';
}

function showApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
  document.getElementById('mainNav').style.display = 'flex';
}

function applyRoleUI() {
  // Show/hide admin-only UI elements
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = currentUser?.role === 'admin' ? '' : 'none';
  });
}

function loadNavUser() {
  const user = currentUser;
  if (!user) return;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('navUserName').textContent = user.name;
  const roleBadge = document.getElementById('navRole');
  roleBadge.textContent = user.role;
  roleBadge.className = 'role-badge ' + user.role;
}

// ─── Navigation ───────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link-btn').forEach(l => l.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  // Load data for each page
  if (page === 'dashboard') loadDashboard();
  if (page === 'projects')  renderProjects();
  if (page === 'tasks')     loadTasks();
}

// ─── Data Loaders ─────────────────────────────────────────
async function loadProjects() {
  try {
    const data = await ProjectsAPI.getAll();
    allProjects = data.projects;
    populateProjectFilter();
  } catch (err) {
    console.error('Failed to load projects:', err);
  }
}

async function loadUsers() {
  if (currentUser?.role !== 'admin') return;
  try {
    const data = await UsersAPI.getAll();
    allUsers = data.users;
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

// ─── Dashboard ────────────────────────────────────────────
async function loadDashboard() {
  const greeting = document.getElementById('dashGreeting');
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  greeting.textContent = `Good ${timeOfDay}, ${currentUser?.name?.split(' ')[0]}`;

  // Load stats
  try {
    const { stats } = await TasksAPI.getStats();
    document.getElementById('statTotal').textContent     = stats.total;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statPending').textContent   = stats.pending + stats.inProgress;
    document.getElementById('statOverdue').textContent   = stats.overdue;
  } catch (err) { console.error('Stats error:', err); }

  // Load recent tasks (latest 5)
  try {
    const { tasks } = await TasksAPI.getAll();
    const el = document.getElementById('dashTasks');
    if (!tasks.length) {
      el.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><p>No tasks yet.</p></div>`;
      return;
    }
    el.innerHTML = tasks.slice(0, 5).map(renderTaskRow).join('');
  } catch (err) { console.error('Dash tasks error:', err); }
}

// ─── Projects ─────────────────────────────────────────────
function renderProjects() {
  const el = document.getElementById('projectsList');
  if (!allProjects.length) {
    el.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-folder-plus"></i><p>No projects yet. ${currentUser?.role === 'admin' ? 'Create one to get started.' : 'You have not been added to any project.'}</p></div></div>`;
    return;
  }
  el.innerHTML = allProjects.map(p => `
    <div class="col-md-6 col-lg-4">
      <div class="project-card">
        <div class="project-name">${esc(p.name)}</div>
        <div class="project-desc">${esc(p.description) || '<span style="color:var(--text-muted)">No description</span>'}</div>
        <div class="project-members">
          ${(p.members || []).slice(0, 4).map(m => `<div class="member-avatar" title="${esc(m.name)}">${initials(m.name)}</div>`).join('')}
          ${p.members?.length > 4 ? `<div class="member-avatar" style="background:var(--border-2)">+${p.members.length - 4}</div>` : ''}
        </div>
        <div class="project-meta mt-2">
          <span class="project-status status-${p.status}">${p.status}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${p.members?.length || 0} members</span>
        </div>
        ${currentUser?.role === 'admin' ? `
        <div class="project-actions">
          <button class="btn btn-sm btn-outline-primary flex-fill" onclick="openProjectModal('${p._id}')"><i class="bi bi-pencil"></i> Edit</button>
          <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deleteProject('${p._id}')"><i class="bi bi-trash"></i> Delete</button>
        </div>` : ''}
      </div>
    </div>
  `).join('');
}

async function openProjectModal(id = null) {
  document.getElementById('projectId').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('projectModalTitle').textContent = id ? 'Edit Project' : 'New Project';

  // Render member checkboxes
  const checkboxesEl = document.getElementById('memberCheckboxes');
  checkboxesEl.innerHTML = allUsers.map(u => `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" id="mem-${u._id}" value="${u._id}" />
      <label class="form-check-label" for="mem-${u._id}">${esc(u.name)} <span style="color:var(--text-muted);font-size:0.75rem">(${u.role})</span></label>
    </div>
  `).join('');

  if (id) {
    // Populate form with existing project
    const project = allProjects.find(p => p._id === id);
    if (project) {
      document.getElementById('projectId').value = id;
      document.getElementById('projectName').value = project.name;
      document.getElementById('projectDesc').value = project.description || '';
      // Check current members
      (project.members || []).forEach(m => {
        const cb = document.getElementById(`mem-${m._id}`);
        if (cb) cb.checked = true;
      });
    }
  }
  projectModal.show();
}

async function saveProject() {
  const id   = document.getElementById('projectId').value;
  const name = document.getElementById('projectName').value.trim();
  const desc = document.getElementById('projectDesc').value.trim();
  const members = [...document.querySelectorAll('#memberCheckboxes input:checked')].map(cb => cb.value);

  if (!name) return showToast('Project name is required.', 'error');

  try {
    if (id) {
      const { project } = await ProjectsAPI.update(id, { name, description: desc, members });
      allProjects = allProjects.map(p => p._id === id ? project : p);
    } else {
      const { project } = await ProjectsAPI.create({ name, description: desc, members });
      allProjects.unshift(project);
    }
    projectModal.hide();
    renderProjects();
    populateProjectFilter();
    showToast(`Project ${id ? 'updated' : 'created'} successfully.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
  try {
    await ProjectsAPI.delete(id);
    allProjects = allProjects.filter(p => p._id !== id);
    renderProjects();
    showToast('Project deleted.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Tasks ────────────────────────────────────────────────
async function loadTasks() {
  const status  = document.getElementById('filterStatus')?.value;
  const project = document.getElementById('filterProject')?.value;
  const params  = {};
  if (status)  params.status  = status;
  if (project) params.project = project;

  const el = document.getElementById('tasksList');
  el.innerHTML = '<div class="loading-state"><span class="spinner-border text-primary"></span></div>';

  try {
    const { tasks } = await TasksAPI.getAll(params);
    if (!tasks.length) {
      el.innerHTML = `<div class="content-card"><div class="empty-state"><i class="bi bi-check2-all"></i><p>No tasks found.</p></div></div>`;
      return;
    }
    el.innerHTML = `<div class="content-card">${tasks.map(renderTaskRow).join('')}</div>`;
  } catch (err) {
    el.innerHTML = `<div class="content-card"><div class="empty-state"><p>Failed to load tasks.</p></div></div>`;
  }
}

function renderTaskRow(task) {
  const overdue  = task.isOverdue;
  const isAdmin  = currentUser?.role === 'admin';
  const dueStr   = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
  const statusActions = isAdmin
    ? `<button class="btn btn-sm btn-outline-primary" onclick="openTaskModal('${task._id}')"><i class="bi bi-pencil"></i></button>
       <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')"><i class="bi bi-trash"></i></button>`
    : `<button class="btn btn-sm btn-outline-primary" onclick="openStatusModal('${task._id}','${task.status}')"><i class="bi bi-arrow-repeat"></i> Status</button>`;

  return `
    <div class="task-item">
      <div class="task-check ${task.status === 'completed' ? 'completed' : ''}"></div>
      <div class="task-info">
        <div class="task-title-text ${task.status === 'completed' ? 'completed' : ''}">${esc(task.title)}</div>
        <div class="task-meta-row">
          ${task.project ? `<span class="task-project-tag">${esc(task.project.name)}</span>` : ''}
          ${task.assignedTo ? `<span class="task-assignee"><i class="bi bi-person"></i> ${esc(task.assignedTo.name)}</span>` : ''}
          <span class="task-date ${overdue ? 'overdue' : ''}"><i class="bi bi-calendar3"></i> ${dueStr}${overdue ? ' · Overdue' : ''}</span>
        </div>
      </div>
      <div class="task-right">
        <div class="priority-dot priority-${task.priority}" title="${task.priority} priority"></div>
        <span class="badge-status badge-${task.status}">${task.status.replace('-', ' ')}</span>
        ${statusActions}
      </div>
    </div>`;
}

async function openTaskModal(id = null) {
  document.getElementById('taskId').value = '';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';
  document.getElementById('taskDueDate').value = '';
  document.getElementById('taskPriority').value = 'medium';
  document.getElementById('taskModalTitle').textContent = id ? 'Edit Task' : 'New Task';

  // Populate projects dropdown
  const projectSel = document.getElementById('taskProject');
  projectSel.innerHTML = allProjects.map(p => `<option value="${p._id}">${esc(p.name)}</option>`).join('');

  // Load members for first project
  await loadProjectMembers();

  if (id) {
    try {
      const { task } = await TasksAPI.getOne(id);
      document.getElementById('taskId').value = id;
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskDesc').value = task.description || '';
      document.getElementById('taskPriority').value = task.priority;
      document.getElementById('taskDueDate').value = task.dueDate?.split('T')[0] || '';
      projectSel.value = task.project?._id;
      await loadProjectMembers();
      document.getElementById('taskAssignee').value = task.assignedTo?._id;
    } catch (err) { showToast('Could not load task.', 'error'); return; }
  }

  taskModal.show();
}

async function loadProjectMembers() {
  const projectId = document.getElementById('taskProject').value;
  const project   = allProjects.find(p => p._id === projectId);
  const assignSel = document.getElementById('taskAssignee');
  const members   = project?.members || [];

  if (!members.length) {
    assignSel.innerHTML = '<option value="">No members in project</option>';
    return;
  }
  assignSel.innerHTML = members.map(m => `<option value="${m._id}">${esc(m.name)}</option>`).join('');
}

async function saveTask() {
  const id        = document.getElementById('taskId').value;
  const title     = document.getElementById('taskTitle').value.trim();
  const desc      = document.getElementById('taskDesc').value.trim();
  const project   = document.getElementById('taskProject').value;
  const assignedTo= document.getElementById('taskAssignee').value;
  const priority  = document.getElementById('taskPriority').value;
  const dueDate   = document.getElementById('taskDueDate').value;

  if (!title || !project || !assignedTo || !dueDate) return showToast('Please fill all required fields.', 'error');

  try {
    if (id) {
      await TasksAPI.update(id, { title, description: desc, project, assignedTo, priority, dueDate });
    } else {
      await TasksAPI.create({ title, description: desc, project, assignedTo, priority, dueDate });
    }
    taskModal.hide();
    loadTasks();
    loadDashboard();
    showToast(`Task ${id ? 'updated' : 'created'} successfully.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await TasksAPI.delete(id);
    loadTasks();
    loadDashboard();
    showToast('Task deleted.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openStatusModal(taskId, currentStatus) {
  document.getElementById('statusTaskId').value = taskId;
  document.getElementById('statusSelect').value = currentStatus;
  statusModal.show();
}

async function updateTaskStatus() {
  const id     = document.getElementById('statusTaskId').value;
  const status = document.getElementById('statusSelect').value;
  try {
    await TasksAPI.update(id, { status });
    statusModal.hide();
    loadTasks();
    loadDashboard();
    showToast('Status updated.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Filters ──────────────────────────────────────────────
function populateProjectFilter() {
  const sel = document.getElementById('filterProject');
  if (!sel) return;
  sel.innerHTML = '<option value="">All Projects</option>' +
    allProjects.map(p => `<option value="${p._id}">${esc(p.name)}</option>`).join('');
}

// ─── Helpers ──────────────────────────────────────────────
function showAuthAlert(msg, type = 'error') {
  const el = document.getElementById('authAlert');
  el.textContent = msg;
  el.className = `auth-alert ${type}`;
}

function showToast(msg, type = 'success') {
  const toastDiv = document.getElementById('appToast');
  toastDiv.className = `toast align-items-center border-0 ${type}`;
  document.getElementById('toastMsg').textContent = msg;
  toastEl.show();
}

function setLoading(formId, loading) {
  const form = document.getElementById(formId);
  const btn  = form.querySelector('.btn');
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  text.classList.toggle('d-none', loading);
  loader.classList.toggle('d-none', !loading);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
