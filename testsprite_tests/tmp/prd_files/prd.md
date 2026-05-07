# Upchar Health - Product Requirements Document (PRD)

## 1. Product Mission & Purpose

**Mission**: To revolutionize healthcare accessibility in India by providing a single, seamless digital ecosystem that connects patients with qualified doctors, clinics, and medical providers.

**Purpose**: Upchar Health serves as a centralized health-tech platform that simplifies medical consultations, appointment management, and healthcare provider onboarding, ensuring transparency and efficiency for all stakeholders.

---

## 2. Target User Roles

The platform is built to cater to five distinct user segments:

- **Patients**: The primary beneficiaries who seek medical care, book appointments, and store health data.
- **Doctors**: Independent medical professionals who manage consultations and patient records.
- **Medical Stores**: Pharmacies and labs that register to provide products and services to patients.
- **Clinics**: Facilities that manage multiple branches and teams of doctors.
- **Administrators**: Operations team responsible for verifying credentials and ensuring platform integrity.

---

## 3. Core Features & Functional Requirements

### 3.1. Unified Landing Page

- **First Impression**: Premium, glassmorphic design using a teal and emerald color palette.
- **Navigation**: Smooth scrolling to services, blog, and appointment booking sections.
- **Role Entry Points**: Distinct calls-to-action (CTAs) for patients ("Book Appointment") and doctors ("Join as a Doctor").

### 3.2. Doctor Onboarding & Verification

- **Multi-Step Application**: A 4-step professional onboarding wizard:
  1. **Personal Info**: Name, contact details, and secure profile creation.
  2. **Credentials**: Medical license numbers (NMC/MCI), specialization, and degree verification.
  3. **Practice Details**: Clinic locations, availability hours, and consultation fees.
  4. **Document Upload**: Secure upload of government IDs and medical certifications.
- **Verification Logic**: Applications are saved as "Pending" until an administrator reviews and approves the credentials.

### 3.3. Advanced Dashboard System

- **Real-Time Analytics**: Visual representation of performance using donut charts and stats grids.
- **Skeleton Loading**: Standardized performance perceived by using `boneyard-js` skeletons during data fetching (replaces legacy spinners).
- **Role-Specific Tools**:
  - _Medical_: Track partner stores and pending registrations.
  - _Clinic_: Manage branch-specific nodes and scheduling.
  - _Patient_: Quick actions for profile updates and upcoming appointment tracking.

### 3.4. Health Insights (Blog)

- **Educational Content**: A full blogging system with category filtering (e.g., Wellness, Research, Healthy Living).
- **Searchability**: Real-time search by title, topic, or author to provide instant health education.

---

## 4. Design & User Experience (UX)

- **Aesthetics**: Premium, modern feel with rounded components, vibrant gradients, and subtle micro-animations (Framer Motion).
- **Responsiveness**: Mobile-first design with toggleable sidebars and simplified mobile navigation.
- **Clarity**: Explicit usage of status indicators (e.g., Pending, Active, Done) to manage user expectations.

---

## 5. Technical Stack

- **Frontend**: React (v18+), Vite, Tailwind CSS, Shadcn UI.
- **Backend & Auth**: Supabase (PostgreSQL, Edge Functions, Storage, and GoTrue Auth).
- **Animations**: Framer Motion.
- **Performance**: `boneyard-js` for skeleton layout optimization.
- **State Management**: React Context API for role-based sessions.

---

## 6. Frontend Testing Priorities

1. **Critical Path**: Ensure the Doctor Onboarding modal is bug-free and handles document uploads correctly.
2. **Dashboard Integrity**: Verify that data loading states (Skeletons) trigger correctly and dashboards render responsive stats.
3. **Session Management**: Test login/logout flows across different roles to ensure proper redirection.
4. **Navigation**: Ensure the sticky header and internal links function correctly without layout shifts.
