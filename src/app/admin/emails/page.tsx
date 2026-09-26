"use client";

import { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { api } from "@/lib/interceptor";
import { Mail, Send, CheckCircle, AlertCircle, X } from "lucide-react";

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm animate-fade-in ${ok ? "bg-emerald-600" : "bg-red-600"} text-white`}>
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

export default function AdminEmailsPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    if (!to.trim()) { showToast("Recipient email is required", false); return; }
    if (!subject.trim()) { showToast("Subject is required", false); return; }
    if (!content.trim()) { showToast("Content is required", false); return; }

    setSending(true);
    try {
      await api.post("/api/email", { to, subject, content });
      showToast("Email sent successfully!");
      setTo("");
      setSubject("");
      setContent("");
    } catch (err: any) {
      showToast(err?.message || "Failed to send email", false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="page-title flex items-center gap-3"><Mail className="w-7 h-7 text-primary-600" />Send Email</h1>
              <p className="page-sub">Compose and send emails from TechEdge Market (techedgehelpdesk@gmail.com)</p>
            </div>
          </div>

          <div className="card p-6 space-y-6">
            <div>
              <label className="label">Recipient Email <span className="text-red-500 font-normal normal-case">*</span></label>
              <input
                className="input mt-1"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Subject <span className="text-red-500 font-normal normal-case">*</span></label>
              <input
                className="input mt-1"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Content <span className="text-red-500 font-normal normal-case">*</span></label>
              <p className="text-xs text-slate-400 mt-1 mb-2">HTML is supported. Write your message below.</p>
              <textarea
                className="input mt-1 resize-none font-mono text-sm"
                rows={12}
                placeholder="Hello,\n\nThis is a test email from TechEdge Market.\n\nBest regards,\nTechEdge Team"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setTo(""); setSubject(""); setContent(""); }}
                className="btn-outline flex-1 flex items-center justify-center gap-2"
                disabled={sending}
              >
                <X className="w-4 h-4" />Clear
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
