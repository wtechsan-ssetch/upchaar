
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** upchaar
- **Date:** 2026-04-08
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Patient login routes to patient dashboard and renders analytics
- **Test Code:** [TC001_Patient_login_routes_to_patient_dashboard_and_renders_analytics.py](./TC001_Patient_login_routes_to_patient_dashboard_and_renders_analytics.py)
- **Test Error:** TEST FAILURE

Logging in did not route to the patient dashboard after submitting valid credentials.

Observations:
- The login form remained visible after submission and the dashboard never rendered.
- The Sign In button showed an in-progress state ('Signing in…') but no navigation occurred.
- The page sometimes rendered blank and interactive elements disappeared, preventing further verification.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/ff31f706-d47b-4b50-b9db-85d9b94e5c56
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Doctor login routes to doctor dashboard and provides access to schedule/consultations
- **Test Code:** [TC002_Doctor_login_routes_to_doctor_dashboard_and_provides_access_to_scheduleconsultations.py](./TC002_Doctor_login_routes_to_doctor_dashboard_and_provides_access_to_scheduleconsultations.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because the application UI did not render and there are no interactive elements to operate on.

Observations:
- The /login tab shows a blank viewport with 0 interactive elements.
- Two sign-in attempts were submitted but the UI did not navigate to the doctor dashboard or show any dashboard analytics.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/7bcf24b3-b87c-4504-83db-3175017e94d5
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Clinic admin login routes to clinic dashboard and shows branch metrics
- **Test Code:** [TC003_Clinic_admin_login_routes_to_clinic_dashboard_and_shows_branch_metrics.py](./TC003_Clinic_admin_login_routes_to_clinic_dashboard_and_shows_branch_metrics.py)
- **Test Error:** TEST BLOCKED

The sign-in flow could not complete because the app shows a timeout/error message preventing login and routing to the dashboard.

Observations:
- A red banner is displayed: 'Sign in is taking too long. Please check your connection and try again.'
- The login form (email and password fields and Sign In button) is present and populated but submission does not proceed to a dashboard.
- No clinic dashboard or analytics content loaded after attempting to sign in.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/a1201cea-83f2-4cb9-9987-5cb7e73711ef
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Medical store admin login routes to medical dashboard and shows inventory/registrations summary
- **Test Code:** [TC004_Medical_store_admin_login_routes_to_medical_dashboard_and_shows_inventoryregistrations_summary.py](./TC004_Medical_store_admin_login_routes_to_medical_dashboard_and_shows_inventoryregistrations_summary.py)
- **Test Error:** TEST BLOCKED

The feature could not be reached — the app cannot complete sign-in because network/API calls are failing.

Observations:
- The login page displays a red 'Failed to fetch' error above the form.
- After submitting valid credentials the app stays on the login page and does not route to the dashboard.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/6e76284c-68af-480a-8de0-43401e37d36c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Submit doctor onboarding application and see Pending status
- **Test Code:** [TC005_Submit_doctor_onboarding_application_and_see_Pending_status.py](./TC005_Submit_doctor_onboarding_application_and_see_Pending_status.py)
- **Test Error:** TEST BLOCKED

The test cannot proceed because the web application is not rendering its SPA UI. Interactive controls are unavailable, so the onboarding flow cannot be exercised.

Observations:
- The page shows a loading spinner and 0 interactive elements.
- The onboarding modal and its controls are not accessible in the current page state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/f89d5f8d-d32b-4dc1-8e4f-720de8f7f387
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Search blogs with keyword and category and read an article
- **Test Code:** [TC006_Search_blogs_with_keyword_and_category_and_read_an_article.py](./TC006_Search_blogs_with_keyword_and_category_and_read_an_article.py)
- **Test Error:** TEST FAILURE

No article could be opened from the filtered results — the search + category filter returned zero results.

Observations:
- The page displays "No articles found" for the search term "doctors".
- The search input contains the value "doctors" and the 'Health' category pill is active.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/83546d8b-7141-4e78-ac29-14daf830d3cb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Filter blogs by category only and read an article
- **Test Code:** [TC007_Filter_blogs_by_category_only_and_read_an_article.py](./TC007_Filter_blogs_by_category_only_and_read_an_article.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/8d6df5cd-8aef-4985-97f4-cf08690d40cd
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Doctor onboarding required-field validation blocks submission
- **Test Code:** [TC008_Doctor_onboarding_required_field_validation_blocks_submission.py](./TC008_Doctor_onboarding_required_field_validation_blocks_submission.py)
- **Test Error:** TEST BLOCKED

The onboarding validation could not be run because the application page is not interactive / the SPA did not load, so I could not complete the check.

Observations:
- The page shows an empty/blank SPA with 0 interactive elements.
- Multiple attempts to open and interact with the 'Join as a Doctor' modal and to clear the Full Name field failed due to stale or non-interactable elements.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/6d47b8ae-f67a-490e-a39f-5e8a8f163260/1e452f58-8335-4a2f-9811-03a6a8d6f20c
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **12.50** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---