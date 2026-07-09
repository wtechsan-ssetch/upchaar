import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

/**
 * razorpay-payout Edge Function
 * ─────────────────────────────────────────────────
 * Initiates a RazorpayX Payout to a doctor's bank account.
 *
 * Flow:
 *   1. Create / retrieve Razorpay Contact for the doctor
 *   2. Create Fund Account (bank account) under that contact
 *   3. Create Payout from the RazorpayX account balance
 *   4. Return payout_id and utr (Unique Transaction Reference)
 *
 * Required Supabase Secrets:
 *   RAZORPAY_KEY_ID      — from Razorpay dashboard
 *   RAZORPAY_KEY_SECRET  — from Razorpay dashboard
 *   RAZORPAY_ACCOUNT_NUMBER — RazorpayX account number (e.g. 4564563485764089)
 *
 * Body (JSON):
 *   {
 *     doctorName: string,
 *     doctorEmail: string,
 *     doctorPhone: string,
 *     bankName: string,
 *     accountNumber: string,
 *     ifscCode: string,
 *     accountHolderName: string,
 *     amountPaise: number,   // amount in paise (₹1 = 100 paise)
 *     requestId: string,     // fee_release_requests.id for reference
 *   }
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      doctorName,
      doctorEmail,
      doctorPhone,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      amountPaise,
      requestId,
    } = await req.json()

    // Validate inputs
    if (!accountNumber || !ifscCode || !accountHolderName || !amountPaise || amountPaise < 100) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields or amount too small (min ₹1)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const accountNo = Deno.env.get('RAZORPAY_ACCOUNT_NUMBER')

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Razorpay credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const auth = btoa(`${keyId}:${keySecret}`)
    const razorHeaders = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }

    // ── Step 1: Create Contact ────────────────────────────────────────────────
    const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: razorHeaders,
      body: JSON.stringify({
        name: doctorName || accountHolderName,
        email: doctorEmail || undefined,
        contact: doctorPhone ? doctorPhone.replace(/\D/g, '').slice(-10) : undefined,
        type: 'vendor',
        reference_id: `doctor-${requestId?.slice(0, 8) || Date.now()}`,
        notes: {
          purpose: 'Doctor fee release – Upchar Health',
          bank_name: bankName,
        },
      }),
    })

    const contactData = await contactRes.json()
    if (!contactRes.ok) {
      console.error('Contact creation failed:', contactData)
      return new Response(
        JSON.stringify({ error: 'Failed to create Razorpay contact', details: contactData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    const contactId = contactData.id

    // ── Step 2: Create Fund Account ───────────────────────────────────────────
    const fundRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: razorHeaders,
      body: JSON.stringify({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
          name: accountHolderName,
          ifsc: ifscCode.toUpperCase(),
          account_number: accountNumber,
        },
      }),
    })

    const fundData = await fundRes.json()
    if (!fundRes.ok) {
      console.error('Fund account creation failed:', fundData)
      return new Response(
        JSON.stringify({ error: 'Failed to create fund account', details: fundData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    const fundAccountId = fundData.id

    // ── Step 3: Create Payout ─────────────────────────────────────────────────
    const payoutBody: Record<string, unknown> = {
      account_number: accountNo || '4564563485764089', // RazorpayX source account
      fund_account_id: fundAccountId,
      amount: amountPaise,
      currency: 'INR',
      mode: 'IMPS', // IMPS/NEFT/RTGS/UPI
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `upchar-${requestId?.slice(0, 8) || Date.now()}`,
      narration: 'Upchar Health Fee Release',
      notes: {
        request_id: requestId || '',
        doctor_name: doctorName || accountHolderName,
      },
    }

    const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: razorHeaders,
      body: JSON.stringify(payoutBody),
    })

    const payoutData = await payoutRes.json()

    if (!payoutRes.ok) {
      console.error('Payout creation failed:', payoutData)
      // Return structured error so admin can handle manually
      return new Response(
        JSON.stringify({
          error: 'Failed to create Razorpay payout',
          details: payoutData,
          contact_id: contactId,
          fund_account_id: fundAccountId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // ── Success ───────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        payout_id: payoutData.id,
        utr: payoutData.utr || null,
        status: payoutData.status,
        contact_id: contactId,
        fund_account_id: fundAccountId,
        amount: payoutData.amount,
        mode: payoutData.mode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Payout edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
