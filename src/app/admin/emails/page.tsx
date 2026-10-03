"use client";

import { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { api } from "@/lib/interceptor";
import { Mail, Send, CheckCircle, AlertCircle, X, Paperclip, File } from "lucide-react";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/png",
];

const ALLOWED_EXTENSIONS = [".pdf", ".xlsx", ".csv", ".docx", ".jpg", ".jpeg", ".webp", ".png"];

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm animate-fade-in ${ok ? "bg-emerald-600" : "bg-red-600"} text-white`}>
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

interface AttachmentFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export default function AdminEmailsPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        showToast(`Invalid file type: ${file.name}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`, false);
        continue;
      }

      setAttachments((prev) => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
    }

    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSend = async () => {
    if (!to.trim()) { showToast("Recipient email is required", false); return; }
    if (!subject.trim()) { showToast("Subject is required", false); return; }
    if (!content.trim()) { showToast("Content is required", false); return; }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", to);
      formData.append("subject", subject);
      formData.append("content", content);

      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      await api.post("/api/email", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Email sent successfully!");
      setTo("");
      setSubject("");
      setContent("");
      setAttachments([]);
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

            <div>
              <label className="label">Attachments</label>
              <p className="text-xs text-slate-400 mt-1 mb-2">Allowed: {ALLOWED_EXTENSIONS.join(", ")}</p>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Click to select files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept={ALLOWED_EXTENSIONS.join(",")}
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{att.name}</span>
                        <span className="text-xs text-slate-400 shrink-0">{formatFileSize(att.size)}</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-red-100 rounded-full transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setTo(""); setSubject(""); setContent(""); setAttachments([]); }}
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
