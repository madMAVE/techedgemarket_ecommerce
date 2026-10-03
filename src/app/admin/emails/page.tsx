"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { api } from "@/lib/interceptor";
import { Mail, Send, CheckCircle, AlertCircle, X, Paperclip, File, PenSquare, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from "lucide-react";

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

interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEmailsPage() {
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>("");
  const [showSignatureManager, setShowSignatureManager] = useState(false);
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signatureContent, setSignatureContent] = useState("");
  const [signatureActive, setSignatureActive] = useState(false);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    setLoadingSignatures(true);
    try {
      const res: any = await api.get("/api/admin/email-signatures");
      const sigs = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setSignatures(sigs);
      const active = sigs.find((s: EmailSignature) => s.isActive);
      if (active) setSelectedSignatureId(active.id);
    } catch {
      showToast("Failed to load signatures", false);
    } finally {
      setLoadingSignatures(false);
    }
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addEmailTag = (type: "to" | "cc" | "bcc") => {
    const input = type === "to" ? toInput : type === "cc" ? ccInput : bccInput;
    const setter = type === "to" ? setToEmails : type === "cc" ? setCcEmails : setBccEmails;
    const inputSetter = type === "to" ? setToInput : type === "cc" ? setCcInput : setBccInput;

    const emails = input.split(/[,;\s]+/).filter((e) => e.trim());
    const validNew: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      const trimmed = email.trim();
      if (!trimmed) continue;
      if (!isValidEmail(trimmed)) {
        invalid.push(trimmed);
      } else if (type === "to" ? !toEmails.includes(trimmed) : type === "cc" ? !ccEmails.includes(trimmed) : !bccEmails.includes(trimmed)) {
        validNew.push(trimmed);
      }
    }

    if (invalid.length > 0) {
      showToast(`Invalid email(s): ${invalid.join(", ")}`, false);
    }

    if (validNew.length > 0) {
      setter((prev) => [...prev, ...validNew]);
      inputSetter("");
    }
  };

  const removeEmailTag = (type: "to" | "cc" | "bcc", index: number) => {
    const setter = type === "to" ? setToEmails : type === "cc" ? setCcEmails : setBccEmails;
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmailKeyDown = (type: "to" | "cc" | "bcc", e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmailTag(type);
    }
  };

  const EmailTags = ({ emails, type }: { emails: string[]; type: "to" | "cc" | "bcc" }) => (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {emails.map((email, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium border border-primary-200">
          {email}
          <button onClick={() => removeEmailTag(type, i)} className="ml-0.5 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );

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

  const openCreateSignature = () => {
    setEditingSignature(null);
    setSignatureName("");
    setSignatureContent("");
    setSignatureActive(false);
    setShowSignatureManager(true);
  };

  const openEditSignature = (sig: EmailSignature) => {
    setEditingSignature(sig);
    setSignatureName(sig.name);
    setSignatureContent(sig.content);
    setSignatureActive(sig.isActive);
    setShowSignatureManager(true);
  };

  const handleSaveSignature = async () => {
    if (!signatureName.trim()) { showToast("Signature name is required", false); return; }
    if (!signatureContent.trim()) { showToast("Signature content is required", false); return; }

    setSavingSignature(true);
    try {
      if (editingSignature) {
        await api.patch(`/api/admin/email-signatures/${editingSignature.id}`, {
          name: signatureName,
          content: signatureContent,
          isActive: signatureActive,
        });
        showToast("Signature updated successfully!");
      } else {
        await api.post("/api/admin/email-signatures", {
          name: signatureName,
          content: signatureContent,
          isActive: signatureActive,
        });
        showToast("Signature created successfully!");
      }
      setShowSignatureManager(false);
      fetchSignatures();
    } catch (err: any) {
      showToast(err?.message || "Failed to save signature", false);
    } finally {
      setSavingSignature(false);
    }
  };

  const handleDeleteSignature = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signature?")) return;
    try {
      await api.delete(`/api/admin/email-signatures/${id}`);
      showToast("Signature deleted");
      if (selectedSignatureId === id) setSelectedSignatureId("");
      fetchSignatures();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete signature", false);
    }
  };

  const handleToggleActive = async (sig: EmailSignature) => {
    try {
      await api.patch(`/api/admin/email-signatures/${sig.id}`, { isActive: !sig.isActive });
      showToast(sig.isActive ? "Signature deactivated" : "Signature activated");
      fetchSignatures();
    } catch (err: any) {
      showToast(err?.message || "Failed to update signature", false);
    }
  };

  const handleSend = async () => {
    if (toEmails.length === 0) { showToast("At least one recipient is required", false); return; }
    if (!subject.trim()) { showToast("Subject is required", false); return; }
    if (!content.trim()) { showToast("Content is required", false); return; }
    if (!selectedSignatureId) { showToast("Please select an active signature", false); return; }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", toEmails[0]);
      if (ccEmails.length > 0) formData.append("cc", JSON.stringify(ccEmails));
      if (bccEmails.length > 0) formData.append("bcc", JSON.stringify(bccEmails));
      formData.append("subject", subject);
      formData.append("content", content);

      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      await api.post("/api/email", formData);
      showToast("Email sent successfully!");
      setToEmails([]);
      setToInput("");
      setCcEmails([]);
      setCcInput("");
      setBccEmails([]);
      setBccInput("");
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
              <label className="label">Recipients (To) <span className="text-red-500 font-normal normal-case">*</span></label>
              <div className="input mt-1 flex items-center flex-wrap gap-1 px-2 py-1.5 min-h-10 cursor-text" onClick={() => document.getElementById("to-input")?.focus()}>
                <EmailTags emails={toEmails} type="to" />
                <input
                  id="to-input"
                  className="flex-1 min-w-40 outline-none bg-transparent text-sm"
                  type="email"
                  placeholder={toEmails.length === 0 ? "Enter email and press Enter" : "Add more emails"}
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) => handleEmailKeyDown("to", e)}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-xs text-primary-600 hover:text-primary-700 mt-2 flex items-center gap-1 font-medium"
              >
                {showCcBcc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showCcBcc ? "Hide CC/BCC" : "Add CC/BCC"}
              </button>

              {showCcBcc && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="label text-xs text-slate-500">CC</label>
                    <div className="input flex items-center flex-wrap gap-1 px-2 py-1.5 min-h-10 cursor-text" onClick={() => document.getElementById("cc-input")?.focus()}>
                      <EmailTags emails={ccEmails} type="cc" />
                      <input
                        id="cc-input"
                        className="flex-1 min-w-40 outline-none bg-transparent text-sm"
                        type="email"
                        placeholder={ccEmails.length === 0 ? "Enter CC emails" : "Add more"}
                        value={ccInput}
                        onChange={(e) => setCcInput(e.target.value)}
                        onKeyDown={(e) => handleEmailKeyDown("cc", e)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs text-slate-500">BCC</label>
                    <div className="input flex items-center flex-wrap gap-1 px-2 py-1.5 min-h-10 cursor-text" onClick={() => document.getElementById("bcc-input")?.focus()}>
                      <EmailTags emails={bccEmails} type="bcc" />
                      <input
                        id="bcc-input"
                        className="flex-1 min-w-40 outline-none bg-transparent text-sm"
                        type="email"
                        placeholder={bccEmails.length === 0 ? "Enter BCC emails" : "Add more"}
                        value={bccInput}
                        onChange={(e) => setBccInput(e.target.value)}
                        onKeyDown={(e) => handleEmailKeyDown("bcc", e)}
                      />
                    </div>
                  </div>
                </div>
              )}
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
              <label className="label">Signature <span className="text-red-500 font-normal normal-case">*</span></label>
              <div className="flex gap-2 mt-1">
                <select
                  className="input flex-1"
                  value={selectedSignatureId}
                  onChange={(e) => setSelectedSignatureId(e.target.value)}
                >
                  <option value="">-- Select a signature --</option>
                  {signatures.map((sig) => (
                    <option key={sig.id} value={sig.id} disabled={!sig.isActive}>
                      {sig.name} {sig.isActive ? "(Active)" : "(Inactive)"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={openCreateSignature}
                  className="btn-outline px-3 flex items-center gap-1"
                  title="Manage signatures"
                >
                  <PenSquare className="w-4 h-4" />
                </button>
              </div>
              {loadingSignatures && <p className="text-xs text-slate-400 mt-1">Loading signatures...</p>}
              {!loadingSignatures && signatures.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No signatures found. Create one to send emails.</p>
              )}
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
                onClick={() => { setToEmails([]); setToInput(""); setCcEmails([]); setCcInput(""); setBccEmails([]); setBccInput(""); setSubject(""); setContent(""); setAttachments([]); }}
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

      {showSignatureManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PenSquare className="w-5 h-5" />
                {editingSignature ? "Edit Signature" : "Create Signature"}
              </h2>
              <button onClick={() => setShowSignatureManager(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="label">Signature Name <span className="text-red-500">*</span></label>
                <input
                  className="input mt-1"
                  placeholder="e.g., Standard Signature"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Signature Content (HTML) <span className="text-red-500">*</span></label>
                <p className="text-xs text-slate-400 mt-1 mb-2">HTML supported for formatting your signature.</p>
                <textarea
                  className="input mt-1 resize-none font-mono text-sm"
                  rows={6}
                  placeholder="<p>Best regards,<br/>TechEdge Market Team<br/>📞 +91 9876543210<br/>🌐 www.techedgemarket.com</p>"
                  value={signatureContent}
                  onChange={(e) => setSignatureContent(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSignatureActive(!signatureActive)}
                  className="flex items-center gap-2"
                >
                  {signatureActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                  <span className="text-sm">{signatureActive ? "Active" : "Inactive"}</span>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSignatureManager(false)}
                  className="btn-outline flex-1"
                  disabled={savingSignature}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSignature}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingSignature}
                >
                  {savingSignature ? "Saving..." : editingSignature ? "Update" : "Create"}
                </button>
              </div>
            </div>

            <div className="border-t p-4">
              <h3 className="text-sm font-semibold mb-3">Existing Signatures</h3>
              {signatures.length === 0 ? (
                <p className="text-sm text-slate-500">No signatures yet.</p>
              ) : (
                <div className="space-y-2">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{sig.name}</span>
                          {sig.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Active</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate" dangerouslySetInnerHTML={{ __html: sig.content }} />
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleToggleActive(sig)}
                          className="p-1 hover:bg-slate-200 rounded"
                          title={sig.isActive ? "Deactivate" : "Activate"}
                        >
                          {sig.isActive ? (
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditSignature(sig)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteSignature(sig.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
