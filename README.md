# 🎫 Support Ticketing System (STS)

A **MERN stack** based **Support Ticketing System (CRM)** that allows customers to create support tickets and admins/support agents to manage, assign, and resolve them efficiently.

Live Demo 👉 [Support Ticketing System](https://support-ticketing-system-crm.vercel.app/)

---

## 🚀 Features

### 👤 Authentication & Roles

* JWT-based authentication.
* Role-based access: **Admin, Support, Customer**.
* Secure login/logout with cookies.

### 📊 Dashboard (Admin Panel)

* Overview of ticket statistics:

  * ✅ Total Tickets
  * 🟢 Open / In Progress / Unassigned
* Visual charts for:

  * Ticket Status Distribution
  * Tickets by Support Agent

### 👥 User Management

* **Supports**: Admin can add/delete support agents.
* **Customers**: Creates a ticket from customer panel.

### 🎟️ Ticket Management

* Customers can:

  * Create new tickets.
  * View ticket status & details.
* Admin can:

  * Assign tickets to agents.
  * Update ticket status.
  * Delete tickets.

### 💬 Real-Time Chat

* Integrated **Socket.IO** chat system inside each ticket.
* Customers & support agents can communicate in real-time.

### 🎨 UI & UX

* Built with **React + TailwindCSS**.
* Charts powered by **Recharts**.
* Modern icons via **Lucide React**.
* Toast notifications for better feedback.

---

## 🛠️ Tech Stack

**Frontend:**

* React 19 + Vite
* React Router DOM
* TailwindCSS
* Recharts
* Lucide React Icons
* React Hot Toast
* Axios
* Socket.IO Client

**Backend:**

* Node.js + Express
* MongoDB + Mongoose
* JWT Authentication
* Socket.IO
* Bcrypt for password hashing
* CORS & Cookie Parser

---

## 🚀 Deployment

* **Frontend**: Vercel
* **Backend**: Render 

---

## 📸 Screenshots

### Dashboard

![Dashboard](./screenshots/dashboard.png)

### Supports Management

![Supports](./screenshots/supports.png)

### Customers

![Customers](./screenshots/customers.png)

### Tickets

![Tickets](./screenshots/tickets.png)

### Chat

![Chat](./screenshots/chat.png)

---

---

👉 Would you like me to **include the screenshots you shared inside the repo and reference them** in the README (like `./screenshots/dashboard.png`), or just leave the README text-only for now?
