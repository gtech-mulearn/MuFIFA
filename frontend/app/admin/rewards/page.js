"use client";

import React, { useState, useEffect, useCallback } from "react";
import { THEME } from "../layout";
import Link from "next/link";


export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const [levelConfigs, setLevelConfigs] = useState([]);
  const [updatingLevelIndex, setUpdatingLevelIndex] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null means adding new
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
    min_level: 1,
    min_points: 0,
    quantity: 0,
    is_released: true,
    sponsor_name: "Zycoz",
    sponsor_url: "https://www.zycoz.com/",
    buy_url: "",
    image_url: "",
    available_to_all: false,
  });

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/rewards");
      const data = await res.json();
      if (data.success) {
        setRewards(data.data || []);
      } else {
        setError(data.error?.message || "Failed to load rewards.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred while loading rewards.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLevelConfigs = async () => {
    try {
      const res = await fetch("/api/v1/admin/rewards/config");
      const data = await res.json();
      if (res.ok && data.success) {
        setLevelConfigs(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch level configs:", err);
    }
  };

  const handleUpdateLimit = async (level, limit) => {
    setUpdatingLevelIndex(level);
    try {
      const res = await fetch("/api/v1/admin/rewards/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, choice_limit: parseInt(limit, 10) || 1 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerSuccess(`Level ${level} choice limit updated to ${limit}!`);
        fetchLevelConfigs();
      } else {
        setError(data.error || "Failed to update choice limit.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update choice limit.");
    } finally {
      setUpdatingLevelIndex(null);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchLevelConfigs();
  }, [fetchRewards]);

  // Flash a success message
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
  };

  // Open modal for adding new item
  const handleAddNew = () => {
    setEditingItem(null);
    setImageError("");
    setUploadingImage(false);
    setFormData({
      title: "",
      description: "",
      tag: "",
      min_level: 1,
      min_points: 0,
      quantity: 10,
      is_released: true,
      sponsor_name: "Zycoz",
      sponsor_url: "https://www.zycoz.com/",
      buy_url: "",
      image_url: "",
      available_to_all: false,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleEdit = (item) => {
    setEditingItem(item);
    setImageError("");
    setUploadingImage(false);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      tag: item.tag || "",
      min_level: item.min_level ?? 1,
      min_points: item.min_points ?? 0,
      quantity: item.quantity ?? 0,
      is_released: !!item.is_released,
      sponsor_name: item.sponsor_name || "Zycoz",
      sponsor_url: item.sponsor_url || "https://www.zycoz.com/",
      buy_url: item.buy_url || "",
      image_url: item.image_url || "",
      available_to_all: !!item.available_to_all,
    });
    setIsModalOpen(true);
  };

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle reward image upload to Supabase storage
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setImageError("");

    const dataObj = new FormData();
    dataObj.append("image", files[0]);

    try {
      const res = await fetch("/api/v1/admin/rewards/upload-image", {
        method: "POST",
        body: dataObj,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormData((prev) => {
          const currentUrls = prev.image_url
            ? prev.image_url.split(",").map((u) => u.trim()).filter(Boolean)
            : [];
          currentUrls.push(data.image_url);
          return {
            ...prev,
            image_url: currentUrls.join(", "),
          };
        });
      } else {
        setImageError(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setImageError("Network error. Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove individual image from the list
  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => {
      const currentUrls = prev.image_url
        ? prev.image_url.split(",").map((u) => u.trim()).filter(Boolean)
        : [];
      const updatedUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        image_url: updatedUrls.join(", "),
      };
    });
  };

  // Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      const url = editingItem
        ? `/api/v1/admin/rewards?id=${editingItem.id}`
        : "/api/v1/admin/rewards";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          min_level: parseInt(formData.min_level, 10) || 1,
          min_points: parseInt(formData.min_points, 10) || 0,
          quantity: parseInt(formData.quantity, 10) || 0,
        }),
      });

      const result = await res.json();
      if (result.success) {
        triggerSuccess(
          editingItem
            ? "Merchandise updated successfully!"
            : "Merchandise created successfully!"
        );
        setIsModalOpen(false);
        fetchRewards();
      } else {
        setError(result.error?.message || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during submission.");
    }
  };

  // Delete merchandise
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/rewards?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(`"${title}" deleted successfully.`);
        fetchRewards();
      } else {
        setError(data.error?.message || "Failed to delete reward.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while deleting.");
    }
  };

  // Toggle release status quickly
  const handleToggleReleased = async (item) => {
    try {
      const res = await fetch(`/api/v1/admin/rewards?id=${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_released: !item.is_released,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerSuccess(
          `"${item.title}" is now ${!item.is_released ? "Released (Active)" : "Disabled"}.`
        );
        fetchRewards();
      } else {
        setError(data.error?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while toggling status.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-[0.18em] text-slate-900 uppercase">
            Merchandise Rewards Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, release, and manage arcade reward items for players.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rewards/claims"
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            View Claims
          </Link>
          <button
            onClick={handleAddNew}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Reward Item
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-900 font-bold hover:opacity-80">×</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs py-2.5 px-4 rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-950 font-bold hover:opacity-80">×</button>
        </div>
      )}
      {/* Level Choice Limits Panel */}
      <div className={`${THEME.panel} rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-slate-100`}>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Level Choice Limits Config
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Configure the maximum number of choice rewards a player can claim per progression level. (Defaults to 1)
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center mt-1">
          {levelConfigs.length === 0 ? (
            <span className="text-[10px] text-slate-400">Loading configurations...</span>
          ) : (
            levelConfigs.map((cfg) => (
              <div key={cfg.level} className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-700">Lvl {cfg.level}:</span>
                <input
                  type="number"
                  min={1}
                  disabled={updatingLevelIndex === cfg.level}
                  defaultValue={cfg.choice_limit}
                  onBlur={(e) => {
                    if (parseInt(e.target.value, 10) !== cfg.choice_limit) {
                      handleUpdateLimit(cfg.level, e.target.value);
                    }
                  }}
                  className="w-12 text-center text-xs font-semibold bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Choice Limit</span>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Rewards Grid/Table Panel */}
      <div className={`${THEME.panel} rounded-2xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-sky-400/70 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
            <span className="text-xs">No merchandise items configured yet.</span>
            <button
              onClick={handleAddNew}
              className="text-[10px] font-bold uppercase tracking-wider text-sky-600 border border-sky-200 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
            >
              Add First Reward
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-500 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider w-16">Preview</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Reward / Tag</th>
                  <th className="text-center px-5 py-3 font-bold uppercase tracking-wider">Requirements</th>
                  <th className="text-right px-5 py-3 font-bold uppercase tracking-wider">Inventory</th>
                  <th className="text-right px-5 py-3 font-bold uppercase tracking-wider">Claimed</th>
                  <th className="text-left px-5 py-3 font-bold uppercase tracking-wider">Sponsor</th>
                  <th className="text-center px-5 py-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 font-bold uppercase tracking-wider w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rewards.map((item) => {
                  const outOfStock = item.quantity <= 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Preview */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {item.image_url ? (
                          <img
                            src={item.image_url.split(",")[0].trim()}
                            alt={item.title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'/%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                          </div>
                        )}
                      </td>

                      {/* Title & Tag */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="flex gap-1.5 flex-wrap items-center mt-1">
                          {item.tag && (
                            <span className="inline-block text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {item.tag}
                            </span>
                          )}
                          {item.available_to_all ? (
                            <span className="inline-block text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Global / Free
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Level {item.min_level} Choice
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Requirements */}
                      <td className="px-5 py-3.5 text-center font-mono">
                        <div className="text-[10px] text-slate-600">Level: <span className="font-bold text-slate-800">{item.min_level}</span></div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{item.min_points} μPts</div>
                      </td>

                      {/* Inventory */}
                      <td className="px-5 py-3.5 text-right font-mono font-semibold">
                        <span className={outOfStock ? "text-rose-600 font-bold" : "text-slate-800"}>
                          {item.quantity}
                        </span>
                        {outOfStock && (
                          <div className="text-[8px] font-bold uppercase tracking-wider text-rose-500 mt-0.5">
                            Out of Stock
                          </div>
                        )}
                      </td>

                      {/* Claimed */}
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-600">
                        {item.claimed_count || 0}
                      </td>

                      {/* Sponsor */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-700">{item.sponsor_name || "Zycoz"}</span>
                        {item.buy_url && (
                          <div className="text-[9px] mt-0.5">
                            <a
                              href={item.buy_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 underline"
                            >
                              Sponsor buy link
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleReleased(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer border shadow-sm transition-colors ${
                            item.is_released
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {item.is_released ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Active
                            </>
                          ) : (
                            "Disabled"
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white border border-slate-200/90 shadow-[0_24px_60px_rgba(15,23,42,0.15)] rounded-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 mb-4">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                {editingItem ? `Edit Reward: ${editingItem.title}` : "Create Arcade Reward"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-900 transition-all cursor-pointer bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Google Arcade Premium Jacket"
                  required
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                />
              </div>

              {/* Tag / Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tag / Category
                </label>
                <input
                  type="text"
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                  placeholder="e.g. Apparel, Accessories, Electronics"
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Details about this merchandise item..."
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                />
              </div>

              {/* Requirements & Quantity grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Min Level
                  </label>
                  <input
                    type="number"
                    name="min_level"
                    min={1}
                    value={formData.min_level}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Min μPoints
                  </label>
                  <input
                    type="number"
                    name="min_points"
                    min={0}
                    value={formData.min_points}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Quantity (Stock)
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                  />
                </div>
              </div>

              {/* Image Upload & URLs */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Reward Images
                </label>

                {/* Previews / Gallery */}
                <div className="flex flex-wrap gap-2 items-center">
                  {(formData.image_url || "")
                    .split(",")
                    .map((u) => u.trim())
                    .filter(Boolean)
                    .map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-sm group"
                      >
                        <img
                          src={url}
                          alt={`preview-${idx}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow transition-colors cursor-pointer border border-white"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                  {/* Upload button card */}
                  <label
                    className={`w-16 h-16 rounded-xl border border-dashed border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/20 flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
                      uploadingImage ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-5 h-5 text-slate-400 hover:text-sky-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    )}
                  </label>
                </div>

                {imageError && (
                  <span className="text-[10px] font-bold text-rose-500">{imageError}</span>
                )}

                {/* Direct text input for fallback/fine-tuning */}
                <div className="mt-1">
                  <span className="text-[9px] text-slate-400 italic block mb-1">
                    Or edit direct image URLs (comma-separated):
                  </span>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                  />
                </div>
              </div>

              {/* Sponsor & URLs */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Sponsor Name
                    </label>
                    <input
                      type="text"
                      name="sponsor_name"
                      value={formData.sponsor_name}
                      onChange={handleInputChange}
                      placeholder="Zycoz"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Sponsor Site URL
                    </label>
                    <input
                      type="url"
                      name="sponsor_url"
                      value={formData.sponsor_url}
                      onChange={handleInputChange}
                      placeholder="https://www.zycoz.com/"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Direct Sponsor Buy URL (For non-eligible users)
                  </label>
                  <input
                    type="url"
                    name="buy_url"
                    value={formData.buy_url}
                    onChange={handleInputChange}
                    placeholder="https://www.zycoz.com/products/jacket"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="is_released"
                    checked={formData.is_released}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Release immediately (Make active)
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="available_to_all"
                    checked={formData.available_to_all}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Available to Everyone (Global / Bypasses Choice Limit)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/90">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {editingItem ? "Save Changes" : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
