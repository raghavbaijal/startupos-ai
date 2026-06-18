'use client';

import { useState } from 'react';
import { 
  Shield, CreditCard, Layers, Users, Zap, Coins, 
  CheckCircle2, AlertCircle, RefreshCw, Clock, ArrowRight,
  XCircle, CheckCircle, HelpCircle, FileText, Download, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BillingDashboardProps {
  subscription: any;
  workspacesCount: number;
  documentsCount: number;
  documentsSize: number;
  aiGenerationsCount: number;
  teamMembersCount: number;
  analytics: {
    totalSpend: number;
    monthlySpend: number;
    avgCostPerRun: number;
    mostExpensiveWorkflow: string;
    tokenConsumption: number;
  };
  transactions: any[];
  invoices: any[];
}

export default function BillingDashboardView({
  subscription,
  workspacesCount,
  documentsCount,
  documentsSize,
  aiGenerationsCount,
  teamMembersCount,
  analytics,
  transactions,
  invoices
}: BillingDashboardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const activePlan = subscription.plan_type || 'free';
  const status = subscription.status || 'inactive';
  const renewalDate = subscription.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString([], { dateStyle: 'medium' })
    : 'N/A';

  const plansList = [
    { type: 'free', name: 'Free Plan', price: '₹0', period: '/mo', limitDesc: '1 workspace, 10 generations, 1 file' },
    { type: 'pro', name: 'Pro Plan', price: '₹2,499', period: '/mo', limitDesc: 'Unlimited workspaces, 500 generations, RAG memory' },
    { type: 'team', name: 'Team Plan', price: '₹7,499', period: '/mo', limitDesc: 'Everything in Pro + advanced team collaboration' }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (targetPlan: 'pro' | 'team') => {
    setIsLoading(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load payment gateway script. Please check your internet connection.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: targetPlan })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        alert(resData.error || 'Failed to initialize checkout.');
        setIsLoading(false);
        return;
      }

      if (resData.recruiterMode) {
        // Recruiter Auto-Verify Bypass
        const verifyResponse = await fetch('/api/billing/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_subscription_id: resData.subscription_id,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
            razorpay_signature: 'mock_signature'
          })
        });

        const verifyData = await verifyResponse.json();
        if (verifyResponse.ok && verifyData.success) {
          alert('Recruiter Demo Mode: Simulated subscription checkout verified successfully! Account plan updated.');
          router.refresh();
        } else {
          alert(verifyData.error || 'Failed to verify simulated payment.');
        }
        setIsLoading(false);
        return;
      }

      // Live Razorpay Subscription Checkout
      const options = {
        key: resData.key_id,
        amount: resData.amount,
        currency: resData.currency,
        name: 'StartupOS AI',
        description: `${targetPlan.toUpperCase()} Subscription Plan`,
        subscription_id: resData.subscription_id,
        handler: async function (response: any) {
          setIsLoading(true);
          try {
            const verifyRes = await fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_subscription_id: resData.subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              alert(`Upgrade successful! Welcome to StartupOS AI ${targetPlan.toUpperCase()}.`);
              router.refresh();
            } else {
              alert(verifyData.error || 'Signature verification failed. Please try again.');
            }
          } catch (err) {
            console.error('Verify error:', err);
            alert('Error verifying signature.');
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          }
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('[handleUpgrade] Exception:', err);
      alert(err.message || 'Billing upgrade failed.');
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? Your access will downgrade to the Free Plan at the end of the current period.')) return;
    setIsLoading(true);
    try {
      // Direct checkout API does not handle cancels, we create a secure server call
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert('Subscription cancellation request processed. Your plan will downgrade to Free at the end of the billing period.');
        router.refresh();
      } else {
        alert(resData.error || 'Failed to process cancellation request. Please contact support.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error cancelling subscription.');
    } finally {
      setIsLoading(false);
    }
  };

  // Limit definitions based on active plan
  const aiLimit = activePlan === 'free' ? 10 : activePlan === 'pro' ? 500 : 999999;
  const workspacesLimit = activePlan === 'free' ? 1 : 999999;
  const docsLimit = activePlan === 'free' ? 1 : 999999;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Current Subscription Command Center Header */}
      <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-250 rounded-full text-[10px] text-slate-600 font-bold uppercase tracking-wider shadow-inner">
            <CreditCard className="w-3.5 h-3.5" /> Billing OS
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Billing Command Center</h2>
          <p className="text-slate-500 text-xs max-w-lg">
            Track active SaaS generations metrics, audit invoice histories, and configure payment subscription settings securely.
          </p>
        </div>

        {/* Current status display cards */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Current plan tier</span>
            <span className="text-base font-extrabold text-slate-800 capitalize block mt-1">{activePlan} Plan</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Next billing date</span>
            <span className="text-base font-extrabold text-slate-800 block mt-1">{renewalDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {activePlan !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                disabled={isLoading}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 font-semibold rounded-xl text-xs shadow-sm active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansList.map((p) => {
          const isCurrent = activePlan === p.type;
          return (
            <div 
              key={p.type}
              className={`border p-6 rounded-2xl flex flex-col justify-between transition-all relative bg-white ${
                isCurrent ? 'border-slate-800 ring-2 ring-slate-800/5 shadow-md' : 'border-slate-200'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-extrabold uppercase rounded tracking-widest shadow-sm">
                  Active Tier
                </span>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-850">{p.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.limitDesc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold tracking-tight">{p.price}</span>
                    <span className="text-[10px] text-slate-500">{p.period}</span>
                  </div>
                </div>
              </div>

              {!isCurrent && p.type !== 'free' && (
                <button
                  onClick={() => handleUpgrade(p.type as any)}
                  disabled={isLoading}
                  className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Upgrade to {p.name}
                </button>
              )}

              {!isCurrent && p.type === 'free' && (
                <div className="mt-6 text-center text-[10px] text-slate-400 italic">
                  Downgrades are processed contextually upon plan cancellation requests.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage Section & progress meters */}
      <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-805">Active Usage Metrics</h3>
          <p className="text-slate-500 text-xs mt-0.5">Summary tracking of your current workspace and generations limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            {/* AI Generations */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-750 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-slate-400" /> AI Generations Used</span>
                <span className="font-bold text-slate-900">
                  {aiGenerationsCount} / {aiLimit === 999999 ? 'Unlimited' : aiLimit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full bg-indigo-600 rounded-full transition-all`} 
                  style={{ width: `${Math.min(100, (aiGenerationsCount / aiLimit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Workspaces limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-750 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Workspaces Count</span>
                <span className="font-bold text-slate-900">
                  {workspacesCount} / {workspacesLimit === 999999 ? 'Unlimited' : workspacesLimit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full bg-emerald-600 rounded-full transition-all`} 
                  style={{ width: `${Math.min(100, (workspacesCount / workspacesLimit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Documents limit */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-750 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> Documents Uploaded</span>
                <span className="font-bold text-slate-900">
                  {documentsCount} / {docsLimit === 999999 ? 'Unlimited' : docsLimit}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full bg-amber-500 rounded-full transition-all`} 
                  style={{ width: `${Math.min(100, (documentsCount / docsLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Simple metadata metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Team Seats occupied</span>
              <span className="text-2xl font-bold mt-2 block text-slate-800">{teamMembersCount} Seats</span>
              <span className="text-[9px] text-slate-500 mt-1 block">
                {activePlan === 'team' ? 'Unlimited Seats' : '1 seat limit on Free/Pro'}
              </span>
            </div>
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Storage Used</span>
              <span className="text-2xl font-bold mt-2 block text-slate-800">
                {(documentsSize / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="text-[9px] text-slate-500 mt-1 block">Maximum 10MB per file</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Intelligence Cards */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-805">Cost Intelligence Analytics</h3>
          <p className="text-slate-500 text-xs mt-0.5">Historical token spend audit summary pulled directly from active generation logs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Token Cost</span>
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold block">${analytics.totalSpend.toFixed(5)}</span>
              <span className="text-[9px] text-slate-500">Accumulated run spend</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Monthly Spend</span>
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-605">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold block">${analytics.monthlySpend.toFixed(5)}</span>
              <span className="text-[9px] text-slate-550">Current month total</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Average Run Cost</span>
              <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-605">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold block">${analytics.avgCostPerRun.toFixed(5)}</span>
              <span className="text-[9px] text-slate-500">Per co-founder prompt</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Heavy Workflow</span>
              <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-605">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold block truncate capitalize">
                {analytics.mostExpensiveWorkflow || 'None'}
              </span>
              <span className="text-[9px] text-slate-550">Highest token consumption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Billing History Table */}
      <div className="glass-panel border border-slate-200 p-8 rounded-3xl bg-white space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-805">Billing Invoice & Transaction History</h3>
          <p className="text-slate-500 text-xs mt-0.5">Authoritative invoice receipts generated securely on payment verification.</p>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Date</th>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Plan description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic bg-white">
                    No payment invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0 text-xs text-slate-650 hover:bg-slate-50/20">
                    <td className="p-4 font-semibold text-slate-800">
                      {new Date(inv.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">{inv.invoice_number}</td>
                    <td className="p-4 font-semibold capitalize">{inv.plan_type} Plan</td>
                    <td className="p-4 font-bold text-slate-800">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold uppercase rounded text-[8px] border border-emerald-100">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a 
                        href={`/api/billing/invoice/${inv.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-650 hover:text-indigo-800 font-bold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> View / Print
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Config Trust Badges */}
      <div className="p-6 border border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm">
            <Lock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-805">Production Billing Environment Secure</p>
            <p className="text-[10px] text-slate-550">Subscriptions processed using certified 256-bit encryption. All pricing is inclusive of 18% GST.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
          <span>Powered by Razorpay</span>
          <div className="h-4 w-px bg-slate-300"></div>
          <a href="#" className="hover:text-slate-700 transition-colors">Refund Policy</a>
          <div className="h-4 w-px bg-slate-300"></div>
          <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
