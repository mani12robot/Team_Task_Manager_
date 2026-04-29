# 🗂️ Team Task Manager

A full-stack web application for managing team projects and tasks, with role-based access control (Admin / Member).

---

## 🏗️ Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | HTML, CSS, Bootstrap 5, Vanilla JS |
| Backend    | Node.js + Express.js          |
| Database   | MongoDB + Mongoose            |
| Auth       | JWT + bcrypt                  |
| Deployment | Railway-ready                 |

---

## 📁 Folder Structure

```
team-task-manager/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # Login, signup, current user
│   │   ├── usersController.js      # List users (admin only)
│   │   ├── projectsController.js   # Project CRUD
│   │   └── tasksController.js      # Task CRUD + stats
│   ├── middleware/
│   │   └── auth.js                 # JWT verification + role guard
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password, role)
│   │   ├── Project.js              # Project schema (name, members, status)
│   │   └── Task.js                 # Task schema (title, assignee, due date, status)
│   ├── routes/
│   │   ├── auth.js                 # POST /api/auth/signup|login, GET /me
│   │   ├── users.js                # GET /api/users (admin only)
│   │   ├── projects.js             # /api/projects CRUD
│   │   └── tasks.js                # /api/tasks CRUD + stats
│   ├── server.js                   # Main Express entry point
│   ├── .env.example                # Environment variable template
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css               # Custom styles (dark theme)
│   ├── js/
│   │   ├── api.js                  # Fetch wrapper + API methods
│   │   └── app.js                  # UI logic: auth, projects, tasks, dashboard
│   └── index.html                  # Single-page application shell
├── package.json                    # Root (for Railway)
├── Procfile                        # Railway process file
└── README.md
```

---

## ⚙️ Local Setup Guide

### Step 1 — Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

---

### Step 2 — Clone / Download the project

```bash
cd team-task-manager
```

---

### Step 3 — Install backend dependencies

```bash
cd backend
npm install
```

---

### Step 4 — Create the `.env` file

In the `backend/` folder, copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=pick_a_long_random_secret_string_here
JWT_EXPIRE=7d
PORT=5000
FRONTEND_URL=http://localhost:5000
```

> 💡 For MongoDB Atlas, your URI looks like:
> `mongodb+srv://username:password@cluster.mongodb.net/team-task-manager`

---

### Step 5 — Run the server

```bash
# From the backend/ folder:
npm run dev        # Development mode (auto-restart with nodemon)
# OR
npm start          # Production mode
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

---

### Step 6 — Open the app

Open your browser and go to:

```
http://localhost:5000
```

The frontend is served from the `frontend/` folder automatically by Express.

---

## 🔑 First Time Setup

1. Go to `http://localhost:5000`
2. Click **Sign Up**
3. Create an **Admin** account (select "Admin" in the role dropdown)
4. Create a few **Member** accounts
5. Log in as Admin:
   - Create a **Project** and add members
   - Create **Tasks**, assign them to members, set due dates
6. Log in as a Member:
   - See only your assigned tasks
   - Update task status (Pending → In Progress → Completed)

---

## 🌐 REST API Reference

### Auth
| Method | Endpoint          | Access | Description          |
|--------|-------------------|--------|----------------------|
| POST   | /api/auth/signup  | Public | Register new user    |
| POST   | /api/auth/login   | Public | Login, returns JWT   |
| GET    | /api/auth/me      | Auth   | Get current user     |

### Users
| Method | Endpoint      | Access | Description       |
|--------|---------------|--------|-------------------|
| GET    | /api/users    | Admin  | List all users    |
| GET    | /api/users/:id| Admin  | Get single user   |

### Projects
| Method | Endpoint          | Access       | Description        |
|--------|-------------------|--------------|--------------------|
| GET    | /api/projects     | Auth         | List projects      |
| POST   | /api/projects     | Admin        | Create project     |
| GET    | /api/projects/:id | Auth         | Get project        |
| PUT    | /api/projects/:id | Admin        | Update project     |
| DELETE | /api/projects/:id | Admin        | Delete project     |

### Tasks
| Method | Endpoint        | Access       | Description                  |
|--------|-----------------|--------------|------------------------------|
| GET    | /api/tasks      | Auth         | List tasks (role-filtered)   |
| POST   | /api/tasks      | Admin        | Create task                  |
| GET    | /api/tasks/stats| Auth         | Dashboard stats              |
| GET    | /api/tasks/:id  | Auth         | Get single task              |
| PUT    | /api/tasks/:id  | Auth*        | Update task (member: status only) |
| DELETE | /api/tasks/:id  | Admin        | Delete task                  |

---

## 🚀 Deploy on Railway

1. Push this project to a GitHub repository

2. Go to [railway.app](https://railway.app) and create a **New Project**

3. Click **Deploy from GitHub repo** and select your repo

4. Add a **MongoDB** plugin (or use Atlas and set the URI manually)

5. Set these environment variables in Railway's dashboard:
   ```
   MONGODB_URI    = <your MongoDB URI>
   JWT_SECRET     = <your secret key>
   JWT_EXPIRE     = 7d
   PORT           = 5000
   FRONTEND_URL   = https://your-app.railway.app
   ```

6. Railway will auto-detect `package.json` and run `npm start`

7. Your app is live! 🎉

---

## 🔒 Role Permissions Summary

| Feature                    | Admin | Member |
|----------------------------|-------|--------|
| Sign up / Login            | ✅    | ✅     |
| View dashboard stats       | ✅    | ✅ (own tasks) |
| Create/Edit/Delete Project | ✅    | ❌     |
| View Projects              | ✅    | ✅ (member of) |
| Create/Edit/Delete Tasks   | ✅    | ❌     |
| View Tasks                 | ✅    | ✅ (assigned) |
| Update own task status     | ✅    | ✅     |
| List all users             | ✅    | ❌     |

---

## 🧩 Database Models

### User
```js
{ name, email, password (hashed), role: 'admin'|'member' }
```

### Project
```js
{ name, description, createdBy (User), members [User], status }
```

### Task
```js
{ title, description, project (Project), assignedTo (User),
  createdBy (User), status, priority, dueDate }
```
