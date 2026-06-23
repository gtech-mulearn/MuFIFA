"use client";

import React, { useState, useEffect, useCallback } from "react";
import { THEME } from "../layout";
import Link from "next/link";


export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  useEffect(() => {
    fetchRewards();
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
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing item
  const handleEdit = (item) => {
    setEditingItem(item);
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
                        {item.tag && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {item.tag}
                          </span>
                        )}
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

              {/* Image URL */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Image URLs (Comma-separated for carousel)
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${THEME.input}`}
                />
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
