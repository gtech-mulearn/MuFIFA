"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdmin, THEME } from "../layout";

export default function AdminNewsPage() {
  const admin = useAdmin();
  const isViewer = admin?.role === "viewer";

  // News States
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "general",
    image_url: "",
    action_url: "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch news updates
  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/news");
      const json = await res.json();
      if (res.ok && json.success) {
        setNewsList(json.data || []);
      } else {
        setError(json.error || "Failed to fetch news updates.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch news updates due to network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Open Add modal
  const openAddModal = () => {
    if (isViewer) return;
    setForm({
      title: "",
      content: "",
      type: "general",
      image_url: "",
      action_url: "",
    });
    setIsEditMode(false);
    setSelectedId(null);
    setUploadError("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Open Edit modal
  const openEditModal = (item) => {
    if (isViewer) return;
    setForm({
      title: item.title || "",
      content: item.content || "",
      type: item.type || "general",
      image_url: item.image_url || "",
      action_url: item.action_url || "",
    });
    setIsEditMode(true);
    setSelectedId(item.id);
    setUploadError("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/v1/admin/news/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setForm((prev) => ({ ...prev, image_url: data.image_url }));
      } else {
        setUploadError(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      setUploadError("Image upload failed due to network error.");
    } finally {
      setUploading(false);
    }
  };

  // Handle form submit (Create or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewer) return;

    setError("");
    setSuccess("");

    const method = isEditMode ? "PUT" : "POST";
    const bodyData = isEditMode ? { ...form, id: selectedId } : form;

    try {
      const res = await fetch("/api/v1/admin/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(isEditMode ? "News updated successfully!" : "News created successfully!");
        setIsModalOpen(false);
        fetchNews();
      } else {
        setError(data.error || "Failed to save news update.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save news due to network error.");
    }
  };

  // Confirm delete triggers
  const triggerDelete = (id) => {
    if (isViewer) return;
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (isViewer || !deleteId) return;

    setError("");
    try {
      const res = await fetch(`/api/v1/admin/news?id=${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("News deleted successfully!");
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchNews();
      } else {
        setError(data.error || "Failed to delete news update.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete news due to network error.");
    }
  };

  return (
    <div className={`p-6 min-h-screen ${THEME.page}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">News & Updates</h1>
            <p className="text-sm text-slate-500 mt-1">Manage tasks announcements, releases, alerts, and video releases.</p>
          </div>
          {!isViewer && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
            >
              Add Update
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        {/* Content Panel */}
        <div className={`rounded-2xl ${THEME.panel} overflow-hidden`}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Latest Updates Feed ({newsList.length})</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : newsList.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              No news updates found. Click "Add Update" to post your first notification.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Image Preview</th>
                    <th className="px-6 py-4">Link URL</th>
                    <th className="px-6 py-4">Published Date</th>
                    {!isViewer && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {newsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                            item.type === "task"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : item.type === "video"
                              ? "bg-violet-50 text-violet-700 ring-violet-600/20"
                              : item.type === "info"
                              ? "bg-sky-50 text-sky-700 ring-sky-600/20"
                              : "bg-slate-50 text-slate-600 ring-slate-500/10"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.title}</td>
                      <td className="px-6 py-4">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 truncate max-w-xs text-slate-500">
                        {item.action_url ? (
                          <a
                            href={item.action_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:underline"
                          >
                            {item.action_url}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      {!isViewer && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-sky-600 hover:text-sky-800 font-semibold mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => triggerDelete(item.id)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Update Announcement" : "Create New Announcement"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Type Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Announcement Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-sky-500"
                >
                  <option value="general">General Updates</option>
                  <option value="task">Latest Task Release</option>
                  <option value="info">Important Info / Warning</option>
                  <option value="video">New Video Release</option>
                </select>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Video submission task is now live!"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Content Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Content Description</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Describe details of this news update..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              {/* Image Picker & Image URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Image File (Upload)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="text-xs text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 file:cursor-pointer hover:file:bg-sky-100"
                  />
                  {uploading && (
                    <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {uploadError && <span className="text-xs text-red-500 font-medium">{uploadError}</span>}

                <label className="text-[10px] uppercase font-bold text-slate-400 mt-2">Image URL (Auto-filled on upload)</label>
                <input
                  type="text"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://supabase.co/storage/v1/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Action Link URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Link / URL (Optional)</label>
                <input
                  type="text"
                  name="action_url"
                  value={form.action_url}
                  onChange={handleChange}
                  placeholder="e.g. /tasks, https://youtube.com/watch?..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow"
                >
                  {isEditMode ? "Save Changes" : "Create Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DOUBLE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Update</h3>
              <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this announcement? This action is permanent.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
