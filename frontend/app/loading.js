import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0F]">
      <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin" />
    </div>
  );
}
