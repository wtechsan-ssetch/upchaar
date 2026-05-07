/**
 * adminApi.js
 * ─────────────────────────────────────────────────
 * All Supabase queries used by the Admin portal.
 * Imported by AdminContext and admin page components.
 */
import { supabase } from '@/lib/supabase.js';

// ── Doctors (approved) ───────────────────────────────────────────────────────

/** Fetch all rows from the main doctors table (Approved / Suspended etc.) */
export async function fetchDoctors() {
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('applied_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function updateDoctorStatus(doctorId, status, rejectionReason = '') {
    const updates = {
        status,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
    };
    if (status === 'Approved') updates.approved_at = new Date().toISOString();
    const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ── Pending Doctors (applications awaiting review) ───────────────────────────

/** Fetch all rows from the pending_doctors staging table */
export async function fetchPendingDoctors() {
    const { data, error } = await supabase
        .from('pending_doctors')
        .select('*')
        .order('applied_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * Approve a pending doctor:
 * 1. Copy the row into the main `doctors` table with status = 'Approved'
 * 2. Delete the row from `pending_doctors`
 * 3. Update the profile status to 'active'
 */
export async function approvePendingDoctor(pendingDoc) {
    const now = new Date().toISOString();

    // Build snake_case doctors row explicitly from the normalized (camelCase) pendingDoc
    const doctorRow = {
        profile_id:                pendingDoc.profile_id,
        full_name:                 pendingDoc.fullName   || pendingDoc.full_name,
        email:                     pendingDoc.email,
        phone:                     pendingDoc.phone      || null,
        dob:                       pendingDoc.dob        || null,
        gender:                    pendingDoc.gender     || null,
        specialization:            pendingDoc.specialization || null,
        sub_specialization:        pendingDoc.subSpecialization || pendingDoc.sub_specialization || null,
        degree:                    pendingDoc.degree     || null,
        additional_qualifications: pendingDoc.additionalQualifications || pendingDoc.additional_qualifications || null,
        passing_year:              pendingDoc.passingYear || pendingDoc.passing_year || null,
        institution:               pendingDoc.institution || null,
        license_no:                pendingDoc.licenseNo  || pendingDoc.license_no || null,
        nmc_no:                    pendingDoc.nmcNo      || pendingDoc.nmc_no || null,
        clinic_name:               pendingDoc.clinicName || pendingDoc.clinic_name || null,
        clinic_address:            pendingDoc.clinicAddress || pendingDoc.clinic_address || null,
        city:                      pendingDoc.city       || null,
        state:                     pendingDoc.state      || null,
        languages:                 pendingDoc.languages  || [],
        available_days:            pendingDoc.availableDays || pendingDoc.available_days || [],
        hours_from:                pendingDoc.hoursFrom  || pendingDoc.hours_from || '09:00',
        hours_to:                  pendingDoc.hoursTo    || pendingDoc.hours_to   || '17:00',
        experience:                pendingDoc.experience || 0,
        consultation_fee:          pendingDoc.consultationFee || pendingDoc.consultation_fee || 500,
        metadata:                  pendingDoc.metadata   || {},
        status:      'Approved',
        approved_at: now,
        applied_at:  pendingDoc.appliedAt || pendingDoc.applied_at || now,
        updated_at:  now,
        avatar_url:  pendingDoc.avatar_url || (pendingDoc.metadata && pendingDoc.metadata.avatar_url) || null,
        secret_key:  pendingDoc.secret_key || pendingDoc.secretKey || `UPC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    // 1. Insert into doctors
    const { data: inserted, error: insertError } = await supabase
        .from('doctors')
        .insert([doctorRow])
        .select()
        .single();
    if (insertError) throw new Error(insertError.message);

    // 2. Delete from pending_doctors
    const { error: deleteError } = await supabase
        .from('pending_doctors')
        .delete()
        .eq('id', pendingDoc.id);
    if (deleteError) throw new Error(deleteError.message);

    // 3. Update profile status to active
    if (pendingDoc.profile_id) {
        await supabase
            .from('profiles')
            .update({ status: 'active', updated_at: now })
            .eq('id', pendingDoc.profile_id);
    }

    return inserted;
}

/** Reject a pending doctor (keeps row in pending_doctors with status = 'Rejected') */
export async function rejectPendingDoctor(pendingDocId, rejectionReason = '') {
    const { data, error } = await supabase
        .from('pending_doctors')
        .update({
            status: 'Rejected',
            rejection_reason: rejectionReason,
            updated_at: new Date().toISOString(),
        })
        .eq('id', pendingDocId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ── Patients ─────────────────────────────────────────────────────────────────

export async function fetchPatients() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_type', 'patient')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function updatePatientStatus(patientId, status) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', patientId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

// ── Appointments ─────────────────────────────────────────────────────────────

export async function fetchAppointments() {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

// ── Facilities ───────────────────────────────────────────────────────────────

export async function fetchFacilities() {
    // Admin "Facilities Management" should reflect real provider records.
    // We unify multiple tables into the shape expected by `FacilitiesManagement.jsx`.

    const normalizeServices = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    };

    const mapRow = (row, type) => {
        const rawName = row?.name || row?.full_name || row?.fullName || '';
        const rawLocation = row?.location || row?.address || row?.full_address || '';
        const rawCity = row?.city || row?.town || row?.state_city || '';
        const rawServices = row?.facilities || row?.services || row?.facility_list || row?.specialties || row?.tests || [];

        return {
            id: row?.id,
            type,
            name: rawName,
            location: rawLocation,
            city: rawCity,
            facilities: normalizeServices(rawServices),
            status: row?.status || 'Active',
            added_at: row?.added_at || row?.created_at || row?.applied_at || row?.updated_at || new Date().toISOString(),
            avatar_url: row?.avatar_url || row?.logo || null,
            profile_id: row?.profile_id || row?.profileId || null,
        };
    };

    const safeSelectAll = async (table) => {
        try {
            const { data, error } = await supabase.from(table).select('*');
            if (error) return [];
            return data || [];
        } catch {
            return [];
        }
    };

    // Fetch from provider tables
    const [medicalsRows, clinicsRows] = await Promise.all([
        safeSelectAll('medicals'),
        safeSelectAll('clinics'),
    ]);

    // Hospitals: best-effort. Prefer `hospitals` table, else fall back to `profiles` rows.
    let hospitalsRows = await safeSelectAll('hospitals');
    if (hospitalsRows.length === 0) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('profile_type', 'hospital');
        hospitalsRows = data || [];
    }

    // Diagnostics centres: best-effort. Prefer a dedicated table, else fall back to profiles.
    let diagnosticsRows = await safeSelectAll('diagnostic_centers');
    if (diagnosticsRows.length === 0) diagnosticsRows = await safeSelectAll('diagnostic_centres');
    if (diagnosticsRows.length === 0) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('profile_type', 'diagnostic');
        diagnosticsRows = data || [];
    }

    const unified = [
        ...(medicalsRows || []).map(r => mapRow(r, 'medical')),
        ...(clinicsRows || []).map(r => mapRow(r, 'clinic')),
        ...(hospitalsRows || []).map(r => mapRow(r, 'hospital')),
        ...(diagnosticsRows || []).map(r => mapRow(r, 'diagnostic')),
    ];

    // Sort newest first if added_at is present
    unified.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
    return unified;
}

export async function addFacility(facility) {
    // Best-effort: insert into the real provider table first.
    // If that fails (e.g., missing required fields), fall back to the legacy `facilities` table.
    const tableByType = {
        hospital: 'hospitals',
        diagnostic: 'diagnostic_centers',
        clinic: 'clinics',
        medical: 'medicals',
    };

    const targetTable = tableByType[facility?.type];

    const payloadByType = {
        // Clinics/Medical stores are referenced by `address` in booking flows.
        clinic: {
            name: facility?.name,
            address: facility?.location,
            city: facility?.city,
            facilities: facility?.facilities,
            status: facility?.status || 'Active',
        },
        medical: {
            name: facility?.name,
            address: facility?.location,
            city: facility?.city,
            facilities: facility?.facilities,
            status: facility?.status || 'Active',
        },
        hospital: {
            name: facility?.name,
            address: facility?.location,
            city: facility?.city,
            facilities: facility?.facilities,
            status: facility?.status || 'Active',
        },
        diagnostic: {
            name: facility?.name,
            location: facility?.location,
            city: facility?.city,
            facilities: facility?.facilities,
            status: facility?.status || 'Active',
        },
    };

    if (targetTable) {
        try {
            const payload = payloadByType[facility.type];
            const { data, error } = await supabase
                .from(targetTable)
                .insert([payload])
                .select()
                .single();
            if (!error) return data;
        } catch {
            // fallthrough to legacy table
        }
    }

    const { data, error } = await supabase
        .from('facilities')
        .insert([facility])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function updateFacility(id, updates) {
    const { data, error } = await supabase
        .from('facilities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
}

export async function deleteFacility({ id, type, profile_id } = {}) {
    if (!id || !type) throw new Error('Missing id/type for facility deletion.');

    // Delete from the underlying provider table
    const tableByType = {
        hospital: 'hospitals',
        diagnostic: 'diagnostic_centers',
        clinic: 'clinics',
        medical: 'medicals',
    };

    const tryDelete = async (table) => {
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (!error) return true;
            return false;
        } catch {
            return false;
        }
    };

    // Prefer dedicated tables if present; fall back to profiles for hospital/diagnostic rows.
    if (type === 'diagnostic') {
        if (await tryDelete('diagnostic_centers')) return;
        if (await tryDelete('diagnostic_centres')) return;
    }

    const table = tableByType[type];
    if (table) {
        if (await tryDelete(table)) return;
    }

    // Profiles fallback (if the list came from `profiles` instead of a dedicated table)
    const { error } = await supabase.from('profiles').delete().eq('id', profile_id || id);
    if (error) throw new Error(error.message);
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings() {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw new Error(error.message);
    // Convert rows into a flat object { key: value }
    const result = {};
    for (const row of (data || [])) {
        result[row.key] = row.value;
    }
    return result;
}

export async function saveSetting(key, value, adminId) {
    const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: adminId });
    if (error) throw new Error(error.message);
}

// ── Activity Logs ────────────────────────────────────────────────────────────

export async function fetchLogs(limit = 50) {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function logAction({ adminId, adminName, action, target, details }) {
    await supabase.from('activity_logs').insert([{
        admin_id: adminId,
        admin_name: adminName,
        action,
        target: target || '',
        details: details || '',
    }]);
    // Don't throw on log failure — non-critical
}

// ── Bloggers (controllers with role='blogger') ───────────────────────────────

export async function fetchBloggers() {
    const { data, error } = await supabase
        .from('controllers')
        .select('*')
        .eq('role', 'blogger')
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    // Join with posts count
    const bloggers = data || [];
    const { data: postCounts } = await supabase
        .from('posts')
        .select('author_id')
        .in('author_id', bloggers.map(b => b.id));
    const countMap = {};
    for (const p of (postCounts || [])) {
        countMap[p.author_id] = (countMap[p.author_id] || 0) + 1;
    }
    return bloggers.map(b => ({ ...b, posts: countMap[b.id] || 0 }));
}

// ── Dashboard stats (aggregated) ─────────────────────────────────────────────

export async function fetchDashboardStats() {
    const [
        { count: totalDoctors },
        { count: totalPatients },
        { count: totalAppointments },
        { data: revenue },
    ] = await Promise.all([
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'patient'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('fee').eq('status', 'Completed'),
    ]);
    const totalRevenue = (revenue || []).reduce((sum, a) => sum + (a.fee || 0), 0);
    const platformRevenue = Math.round(totalRevenue * 0.1);
    return { totalDoctors, totalPatients, totalAppointments, totalRevenue, platformRevenue };
}
