"use client";

import React, { useState, useEffect } from "react";
import { THEME } from "../layout";

export default function AdminEmailPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const [bulkJob, setBulkJob] = useState(null);

  // Poll bulk status regularly
  useEffect(() => {
    const checkBulkStatus = async () => {
      try {
        const res = await fetch("/api/v1/admin/email/bulk-status");
        const data = await res.json();
        if (data.success && data.job) {
          setBulkJob(data.job);
        }
      } catch (err) {
        console.error("Error checking bulk status:", err);
      }
    };

    checkBulkStatus();

    const interval = setInterval(checkBulkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search for users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/v1/admin/users?limit=5&search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success && data.users) {
          setSearchResults(data.users);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setStatus({ type: "error", text: "Please search and select a recipient first." });
      return;
    }
    if (!subject.trim() || !title.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Please fill in all email fields (Subject, Title, Message)." });
      return;
    }

    setSending(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await fetch("/api/v1/admin/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          subject: subject.trim(),
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (selectedUser.user_id === "@all") {
          setStatus({
            type: "success",
            text: `Bulk email campaign successfully initiated for ${data.total || "all"} users in the background!`,
          });
        } else {
          setStatus({
            type: "success",
            text: `Email successfully sent to ${selectedUser.name}!`,
          });
        }
        setSubject("");
        setTitle("");
        setMessage("");
      } else {
        setStatus({
          type: "error",
          text: data.error?.message || "Failed to send email.",
        });
      }
    } catch {
      setStatus({ type: "error", text: "Network error occurred." });
    } finally {
      setSending(false);
    }
  };

  const isBulkSending = bulkJob && bulkJob.status === "sending";
  const percentComplete = isBulkSending && bulkJob.total > 0
    ? Math.min(100, Math.round((bulkJob.sent / bulkJob.total) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
          Send Custom Email
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search for a registered user or select all users to send them custom styled email templates.
        </p>
      </div>

      {/* Bulk Campaign Active Progress Bar */}
      {isBulkSending && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="text-xs font-bold text-sky-800">
                Bulk Campaign In Progress...
              </span>
            </div>
            <span className="text-[10px] font-bold text-sky-600 font-mono">
              {percentComplete}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            <span>
              Sent: <span className="text-slate-800 font-mono">{bulkJob.sent}</span> / {bulkJob.total}
            </span>
            {bulkJob.failed > 0 && (
              <span className="text-rose-500">
                Failed: <span className="font-mono">{bulkJob.failed}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`${THEME.panel} rounded-2xl p-6 flex flex-col gap-6`}>
        {/* Recipient Search Section */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Search Recipient
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or @username..."
                className={`w-full rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
                disabled={isBulkSending}
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSelectUser({ id: "all", user_id: "@all", name: "All Registered Users", email: "All Registered Users" })}
              disabled={isBulkSending}
              className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select @all
            </button>
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-[68px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-slate-500">
                    @{user.user_id} &bull; {user.email}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Recipient Display */}
          {selectedUser && (
            <div className="flex items-center justify-between bg-sky-50/50 border border-sky-100 rounded-xl p-3 mt-1 animate-in fade-in duration-200">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-sky-800">Selected Recipient</span>
                <span className="text-xs font-semibold text-slate-800">{selectedUser.name}</span>
                <span className="text-[10px] text-slate-500">
                  {selectedUser.user_id === "@all" ? "@all" : `@${selectedUser.user_id} • ${selectedUser.email}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={isBulkSending}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-rose-50 disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <hr className={`border-t ${THEME.line}`} />

        {/* Email Fields Form */}
        <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Welcome to μFIFA'26! / Urgent Profile Completion Required"
              className={`w-full rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
              disabled={isBulkSending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Email Title/Heading
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Arena Credentials Confirmed / Action Required: Profile Details Incomplete"
              className={`w-full rounded-xl px-4 py-2.5 text-xs transition-colors focus:outline-none ${THEME.input}`}
              disabled={isBulkSending}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Message Body
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message details here. Line breaks will be preserved in the email..."
              rows={6}
              className={`w-full rounded-xl px-4 py-3 text-xs transition-colors focus:outline-none ${THEME.input} resize-y`}
              disabled={isBulkSending}
              required
            />
          </div>

          {status.text && (
            <div
              className={`border text-xs py-3 px-4 rounded-xl mt-2 animate-in fade-in duration-200 ${
                status.type === "success"
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#059669]"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-600"
              }`}
            >
              {status.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || isBulkSending || !selectedUser}
            className="w-full mt-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 font-bold uppercase tracking-wider py-3 text-xs shadow-md shadow-sky-600/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Initiating Send...
              </>
            ) : selectedUser?.user_id === "@all" ? (
              "Send Bulk Email Campaign"
            ) : (
              "Send Email"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
