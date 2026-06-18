import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/db/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && process.env.NODE_ENV !== 'production';
    const { client, user } = await createClientFromRequest(req);
    let activeUser = user;
    if (!activeUser && isDemoMode) {
      activeUser = { id: 'mock-user-id', email: 'demo-founder@startupos.ai' } as any;
    }

    if (!activeUser) {
      return new NextResponse('<h1>Unauthorized</h1>', { status: 401, headers: { 'Content-Type': 'text/html' } });
    }

    let invoice: any = null;
    let customerName = 'Demo Founder';
    let customerEmail = 'demo-founder@startupos.ai';

    if (isDemoMode) {
      invoice = {
        id: id,
        invoice_number: `INV-2026-${id.substring(0, 4).toUpperCase()}`,
        plan_type: 'pro',
        amount: 2499.00,
        currency: 'INR',
        tax_amount: 449.82,
        status: 'paid',
        created_at: new Date().toISOString()
      };
    } else {
      // Fetch invoice from database
      const { data: inv, error } = await supabaseAdmin
        .from('invoices')
        .select('*, billing_transactions(payment_id, provider)')
        .eq('id', id)
        .maybeSingle();

      if (error || !inv) {
        return new NextResponse('<h1>Invoice not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
      }

      // Authorize owner
      if (inv.user_id !== activeUser.id) {
        // Also check if admin
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', activeUser.id)
          .maybeSingle();
        if (profile?.role !== 'admin') {
          return new NextResponse('<h1>Unauthorized access to invoice</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
        }
      }

      invoice = inv;

      // Fetch user profile info
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', inv.user_id)
        .maybeSingle();
      if (profile) {
        customerName = profile.full_name || 'Valued Founder';
        customerEmail = profile.email || '';
      }
    }

    const subtotal = invoice.amount;
    const tax = invoice.tax_amount;
    const total = subtotal + tax;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number} - StartupOS AI</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      background-color: #f8fafc;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      padding: 48px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      margin: 0;
      font-size: 28px;
      color: #0f172a;
      font-weight: 800;
    }
    .meta-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 40px;
      margin-bottom: 32px;
    }
    .meta-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin: 0 0 8px 0;
    }
    .meta-section p {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 9999px;
      margin-top: 4px;
    }
    .badge-paid {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .badge-unpaid {
      background-color: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      background-color: #f8fafc;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .text-right {
      text-align: right;
    }
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 320px;
      margin: 0;
    }
    .totals-table td {
      padding: 8px 16px;
      border: 0;
    }
    .totals-table tr.grand-total {
      border-top: 2px solid #e2e8f0;
      font-weight: 700;
      font-size: 16px;
      color: #0f172a;
    }
    .footer {
      border-top: 1px dashed #e2e8f0;
      padding-top: 24px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .actions {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 10px 20px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background-color: #4f46e5;
      color: white;
      border: none;
    }
    .btn-primary:hover {
      background-color: #4338ca;
    }
    
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button onclick="window.print()" class="btn btn-primary">Print / Save PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div class="logo-section">
        <div class="logo-icon">S</div>
        <div class="logo-text">StartupOS <span style="color:#4f46e5">AI</span></div>
      </div>
      <div class="invoice-title">
        <h1>RECEIPT</h1>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Invoice: ${invoice.invoice_number}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-section">
        <h3>Billed To</h3>
        <p style="font-weight: 700; color: #0f172a;">${customerName}</p>
        <p style="color: #64748b;">${customerEmail}</p>
      </div>
      <div class="meta-section" style="text-align: right;">
        <h3>Invoice Details</h3>
        <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</p>
        <p><strong>Status:</strong> <span class="badge ${invoice.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}">${invoice.status}</span></p>
        ${invoice.billing_transactions?.payment_id ? `<p><strong>Payment ID:</strong> <span style="font-family: monospace; font-size:12px;">${invoice.billing_transactions.payment_id}</span></p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>StartupOS AI — ${invoice.plan_type.toUpperCase()} Subscription Plan</strong>
            <div style="font-size: 11px; color:#64748b; margin-top:4px;">Monthly recurring access to SaaS co-founder strategy models</div>
          </td>
          <td class="text-right">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td class="text-right">1</td>
          <td class="text-right">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-wrapper">
      <table class="totals-table">
        <tbody>
          <tr>
            <td style="color:#64748b;">Subtotal</td>
            <td class="text-right">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">GST (18% inclusive)</td>
            <td class="text-right">₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr class="grand-total">
            <td>Total Paid</td>
            <td class="text-right">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p style="font-weight: 600; margin: 0 0 8px 0; color: #0f172a;">Thank you for building with StartupOS AI!</p>
      <p style="margin: 0; color: #94a3b8; font-size:11px;">This is an authoritative system-generated invoice receipt. Payment gateway: ${invoice.billing_transactions?.provider || 'razorpay'}.</p>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (err: any) {
    console.error('[invoice] Exception:', err);
    return new NextResponse('<h1>Internal Server Error</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
