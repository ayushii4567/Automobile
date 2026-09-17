# 🚗 AutoCore Motors — Automobile Showroom Management System

A modern, clean, and comprehensive **Automobile Showroom Management System** built with **React 18 + Vite**, **Vanilla CSS**, and **Node.js + Express** with persistent JSON data storage.

---

## 🌟 Key Highlights

- **🇮🇳 Indian Showroom Pricing**: Fully calibrated in Indian Rupees (`₹` / INR) with realistic figures.
- **✨ Clean 2-Record Dataset**: Exactly 2 clean, high-quality records per module to keep client presentations clutter-free.
- **👑 2 Defined Roles**:
  - **👑 Administrator** (`admin` / `admin123`): Unrestricted access to all 14 showroom & back-office panels.
  - **🚗 Sales Executive** (`sales` / `sales123`): Access to the 8 core customer-facing showroom flows.
- **🚫 Zero Graphs / Bar Charts**: Clean KPI cards, status badges, progress bars, and high-readability financial data tables.
- **⚡ Fast Tech Stack**: React 18 + Vite frontend with Node.js / Express backend.

---

## 📋 Comprehensive 14-Module Architecture

### Core Showroom Workflow (Sales Executive & Admin)
1. **🏠 Executive Dashboard**: Live KPIs, monthly sales target progress, showroom timeline, and recent sales invoices.
2. **🚗 Vehicles & Fleet**: Showcase cards, stock availability badges, technical specifications, and ex-showroom pricing.
3. **👥 Customers / CRM**: Client profiles, budgets, preferred vehicles, and verified contact channels.
4. **💬 Enquiries & Leads**: Lead capture, walk-in inquiries, status tracking (`New`, `Hot Lead`, `Follow-up`).
5. **📑 Pro-Forma Quotations**: Itemized on-road vehicle cost breakdown (Ex-showroom, RTO, Insurance, Extended Warranty, Accessories).
6. **💰 Sales & Invoices**: Official Bill of Sale execution, tax computation, and printable sales invoices.
7. **⏱️ Test Drives**: Driving license verification, vehicle selection, and scheduled slot management.
8. **🧮 EMI / Finance Calculator**: Interactive loan slider tool calculating monthly installments, interest, and tenure.

### Back-Office & Showroom Administration (Admin Only)
9. **📦 Spare Parts & Inventory**: Genuine replacement parts, OEM stock levels, cost price, and customer selling price.
10. **🏭 Factory Procurement**: Purchase orders from manufacturer plants, wholesale cost, and delivery tracking.
11. **🔧 Service & Workshop**: Maintenance bay tickets, customer vehicles, technician assignments, and repair billing.
12. **👨‍💼 Staff Directory**: Showroom employees, sales closed, and revenue generated.
13. **📊 Financial Statements**: Monthly performance statements and make/brand revenue contribution tables.
14. **⚙️ Showroom Settings**: Dealership credentials, license registration, contact info, and tax rate configuration.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/ayushii4567/Automobile.git
cd Automobile
```

### 2. Start the Backend Server
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 3. Start the Frontend Application
```bash
cd ../client
npm install
npm run dev
# Application runs on http://localhost:5173
```

---

## 🔐 Default Credentials

| Role | Username | Password | Permitted Modules |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full 14 Modules |
| **Sales Executive** | `sales` | `sales123` | 8 Core Showroom Modules |

---

## 🛠️ Built With

- **Frontend**: React 18, Vite, Lucide React Icons
- **Backend**: Node.js, Express, CORS
- **Storage**: Flat JSON database (`server/data/*.json`)
- **Styling**: Vanilla CSS Design System with Clean Glassmorphism & Responsive Layout
