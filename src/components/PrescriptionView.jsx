import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase.js";
import "./PrescriptionView.css";


const UpcharLogo = () => (
  <div className="upchar-logo">
    <img src="/upcharhealth.svg" alt="Upchar Health" style={{ width: '180px', height: 'auto', objectFit: 'contain' }} />
  </div>
);

const ClockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <line x1="18" y1="10" x2="18" y2="18" stroke="#444" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="18" x2="24" y2="22" stroke="#444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <path d="M12 14c0-1.1.9-2 2-2h1l2 4-1.5 1.5c1 2 3 4 5 5L22 21l4 2v1c0 1.1-.9 2-2 2C14.3 26 12 19 12 14z" fill="#444" />
  </svg>
);

const LocationIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <path d="M18 10a6 6 0 0 1 6 6c0 4-6 11-6 11S12 20 12 16a6 6 0 0 1 6-6z" fill="#444" />
    <circle cx="18" cy="16" r="2" fill="white" />
  </svg>
);

const EmailIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="32" height="32" rx="4" stroke="#E63946" strokeWidth="2" fill="none" />
    <path d="M6 10l12 10L30 10" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="10" width="24" height="18" rx="1" stroke="#E63946" strokeWidth="1.5" fill="none" />
  </svg>
);

export default function PrescriptionView({ appointmentId }) {
  const { id: routeId } = useParams();
  const id = appointmentId || routeId;
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [patient, setPatient] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const { data: apt, error: aptErr } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", id)
          .single();

        if (aptErr) throw aptErr;
        setAppointment(apt);

        if (apt.doctor_id) {
          const { data: doc } = await supabase
            .from("doctors")
            .select("*")
            .eq("id", apt.doctor_id)
            .single();
          setDoctor(doc);
        }

        if (apt.patient_id) {
          const { data: pat } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", apt.patient_id)
            .single();
          setPatient(pat);
        }

        if (apt.doctor_id) {
          const { data: staffData } = await supabase
            .from('staff_links')
            .select('organization_id, organization_type')
            .eq('doctor_id', apt.doctor_id);

          let orgs = [];
          if (staffData && staffData.length > 0) {
            const orgPromises = staffData.map(async (link) => {
              const table = link.organization_type === 'medical' ? 'medicals' : 'clinics';
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(link.organization_id));
              
              let { data: orgData } = await supabase
                .from(table)
                .select('*')
                .eq(isUUID ? 'profile_id' : 'id', link.organization_id)
                .maybeSingle();

              if (!orgData && isUUID) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('id, full_name, name, city, state, phone')
                  .eq('id', link.organization_id)
                  .maybeSingle();
                if (profileData) {
                  orgData = {
                    id: profileData.id,
                    name: profileData.full_name || profileData.name || 'Unnamed Facility',
                    address: [profileData.city, profileData.state].filter(Boolean).join(', ') || '',
                    phone: profileData.phone || ''
                  };
                }
              }
              if (orgData) {
                const { data: ttData } = await supabase
                  .from('doctor_timetables')
                  .select('*')
                  .eq('doctor_id', apt.doctor_id)
                  .eq('org_id', link.organization_id)
                  .eq('is_active', true);
                  
                return {
                  ...orgData,
                  timetables: ttData || []
                };
              }
              return null;
            });
            orgs = (await Promise.all(orgPromises)).filter(Boolean);
          }
          setOrganizations(orgs);
        }
      } catch (err) {
        console.error("Error fetching prescription:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading prescription...</div>;
  }

  if (!appointment) {
    return <div className="p-8 text-center text-red-500">Prescription not found.</div>;
  }

  // Parse doctor name to highlight first part
  let rawName = doctor?.full_name || appointment.doctor_name || "";
  rawName = rawName.replace(/^Dr\.?\s+/i, ""); // Strip 'Dr.' or 'Dr ' from the beginning
  const docNameParts = rawName.split(" ");
  const firstName = docNameParts[0] || "Doctor";
  const lastName = docNameParts.slice(1).join(" ") || "";

  return (
    <div className="prescription-wrapper">
      <div className="prescription-page">
        {/* Corner Accents */}
        <div className="corner-accent top-right">
          <div className="accent-stripe red" />
          <div className="accent-stripe dark" />
        </div>
        <div className="corner-accent bottom-right">
          <div className="accent-stripe dark" />
          <div className="accent-stripe red" />
        </div>
        <div className="corner-accent bottom-left">
          <div className="accent-stripe teal" />
          <div className="accent-stripe dark" />
        </div>

        {/* Header */}
        <header className="rx-header">
          <div className="doctor-info">
            <h1 className="doctor-name">
              Dr. <span className="name-red">{firstName}</span> {lastName}
            </h1>
            <p className="doctor-degree">{doctor?.degrees || doctor?.qualifications || ""}</p>
            <p className="doctor-specialty">{doctor?.specialization || appointment.specialization || "Doctor"}</p>
            <p className="doctor-title">{doctor?.experience ? `${doctor.experience} Years Experience` : ""}</p>
            <p className="doctor-college">{doctor?.college || ""}</p>
          </div>
          <UpcharLogo />
        </header>

        {/* Divider with red bullet */}
        <div className="header-divider">
          <div className="divider-line" />
          <div className="divider-bullet" />
        </div>

        {/* Patient Fields */}
        <div className="patient-fields">
          <div className="field-group name-field">
            <label>Name:</label>
            <div className="field-line flex items-end pb-1 text-sm font-semibold pl-2">
              {patient?.full_name || appointment.patient_name || appointment.patient}
            </div>
          </div>
          <div className="field-group short-field">
            <label>Phone:</label>
            <div className="field-dots flex items-end pb-1 text-sm font-semibold pl-2 w-auto min-w-[100px]">
              {patient?.phone || appointment.patient_phone || "-"}
            </div>
          </div>
          <div className="field-group short-field">
            <label>Date:</label>
            <div className="field-line short flex items-end pb-1 text-sm font-semibold pl-2">
              {appointment.date ? new Date(appointment.date).toLocaleDateString() : "-"}
            </div>
          </div>
        </div>

        {/* Clinical History Section */}
        <div className="clinical-section">
          <div className="clinical-left pr-4 border-r-2 border-red-500/10 min-h-full">
            <h2 className="clinical-title mb-4">Clinic / Medicals</h2>
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium mb-6">
              {organizations && organizations.length > 0 ? (
                <div className="space-y-6">
                  {organizations.map((org, i) => (
                    <div key={i} className="pb-4 border-b border-red-500/10 last:border-0">
                      <p className="font-bold text-slate-900 text-base">{org.name}</p>
                      <p className="text-slate-600 mt-1">{org.address}</p>
                      {org.phone && <p className="text-slate-600 mt-1">Phone: {org.phone}</p>}
                      
                      {org.timetables && org.timetables.length > 0 && (
                        <div className="mt-3">
                          <p className="font-bold text-slate-800 text-[10px] uppercase mb-1.5 opacity-70">Timings</p>
                          {org.timetables.map((tt, idx) => (
                             <div key={idx} className="flex justify-between items-center text-xs text-slate-600 mb-0.5">
                               <span className="font-semibold">{tt.day}</span>
                               <span>{tt.time_from} - {tt.time_to}</span>
                             </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">No clinics linked to this doctor.</span>
              )}
            </div>

          </div>
          <div className="clinical-right relative z-10 w-full pl-6 pt-2 flex flex-col">
             <div className="mb-8">
               <h2 className="clinical-title mb-4">Rx / Medicines:</h2>
               <div className="whitespace-pre-wrap text-sm text-gray-800 leading-loose">
                 {(appointment.medicines && appointment.medicines.length > 0)
                    ? appointment.medicines.join("\n") 
                    : "No medicines prescribed."}
               </div>
             </div>
             
             <div className="mt-4 pt-6 border-t border-red-500/10">
               <h2 className="clinical-title mb-4">Clinical Notes</h2>
               <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium">
                 {appointment.diagnosis || appointment.issue || "No clinical notes provided."}
               </div>
             </div>
          </div>
          
          {/* Watermark */}
          <div className="watermark" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.1 }}>
            <img src="/upcharhealth.svg" alt="Watermark" style={{ width: '350px', height: 'auto', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Footer Info */}
        <footer className="rx-footer">
          {doctor?.clinic_timing && (
            <div className="footer-item">
              <span className="footer-icon"><ClockIcon /></span>
              <div className="footer-content">
                <span className="footer-label">Timing:</span>
                <span className="footer-main"> {doctor.clinic_timing}</span>
              </div>
            </div>
          )}

          {doctor?.phone && (
            <div className="footer-item">
              <span className="footer-icon"><PhoneIcon /></span>
              <div className="footer-content">
                <span className="footer-label">For Appointments:</span>
                <span className="footer-main"> Call</span>
                <br />
                <span className="teal-text phone-text">{doctor.phone}</span>
              </div>
            </div>
          )}

          {doctor?.clinic_address && (
            <div className="footer-item">
              <span className="footer-icon"><LocationIcon /></span>
              <div className="footer-content">
                <span className="footer-label">Address:</span>
                <span className="footer-main"> {doctor.clinic_address}</span>
              </div>
            </div>
          )}

          {doctor?.email && (
            <div className="footer-item email-item">
              <span className="footer-icon"><EmailIcon /></span>
              <div className="footer-content">
                <span className="footer-label">Email:</span>
                <span className="footer-email"> {doctor.email}</span>
              </div>
            </div>
          )}
        </footer>

        {/* Bottom corner accent bar */}
        <div className="bottom-bar">
          <div className="bar-teal" />
          <div className="bar-dark" />
          <div className="bar-red" />
        </div>
      </div>
    </div>
  );
}
