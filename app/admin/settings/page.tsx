"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, BarChart3, Users, Calendar, QrCode,
  LogOut, Menu, X, Bell, Save, Shield,
  Building2, Eye, EyeOff,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Employees", href: "/admin/employees" },
  { icon: Calendar, label: "Attendance", href: "/admin/attendance" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const pathname = usePathname(); const router = useRouter();
  const { user, logout } = useAuthStore();
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "A";
  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); logout(); router.push("/login"); };
  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-white border-r border-[#E5E2DB] transition-all duration-300 flex flex-col", open ? "w-[220px]" : "w-[64px]")}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#F0EDE6] h-[60px]">
        {open ? (<><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center"><QrCode className="w-4 h-4 text-white" strokeWidth={2} /></div><span className="text-[15px] text-[#1C1C1A]" style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600 }}>AttendQR</span></div><button onClick={() => setOpen(false)} className="text-[#9A9890] hover:text-[#1C1C1A]"><X className="w-4 h-4" /></button></>) : (<div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center mx-auto"><QrCode className="w-4 h-4 text-white" strokeWidth={2} /></div>)}
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {open && <p className="px-3 mb-2 text-[10px] font-bold text-[#B0AEA9] uppercase tracking-[0.1em]">Menu</p>}
        {NAV_ITEMS.map((item) => { const isActive = pathname === item.href; return (<button key={item.href} onClick={() => router.push(item.href)} className={cn("relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150", open ? "justify-start" : "justify-center", isActive ? "bg-[#FBF5E6] text-[#9A7A1A]" : "text-[#6B6965] hover:bg-[#F5F3EE] hover:text-[#1C1C1A]")} title={!open ? item.label : undefined}><item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#C49426]" : "")} strokeWidth={isActive ? 2.5 : 2} />{open && item.label}</button>); })}
      </nav>
      <div className="px-2 py-3 border-t border-[#F0EDE6] space-y-0.5">
        <button onClick={handleLogout} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#9A9890] hover:bg-red-50 hover:text-red-600 transition-all", open ? "justify-start" : "justify-center")}><LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />{open && "Sign Out"}</button>
        {open && (<div className="mt-2 pt-2 border-t border-[#F0EDE6] flex items-center gap-2.5 px-1"><div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0"><span className="text-[11px] font-bold text-[#C49426]">{initials}</span></div><div className="min-w-0"><p className="text-[12px] font-semibold text-[#1C1C1A] truncate">{user?.name}</p><p className="text-[11px] text-[#9A9890] truncate">{user?.email}</p></div></div>)}
      </div>
    </aside>
  );
}

function Section({ title, icon: Icon, desc, children }: { title: string; icon: any; desc: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E5E2DB] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#FBF5E6] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#C49426]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[#1C1C1A]">{title}</h2>
          <p className="text-[11px] text-[#9A9890]">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3 items-start">
      <label className="text-[12px] font-semibold text-[#5A5855] uppercase tracking-[0.06em] pt-2.5">{label}</label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: any) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)] transition-all" />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={onChange} className={cn("relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer", checked ? "bg-[#C49426]" : "bg-[#E5E2DB]")}>
        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200", checked ? "left-5" : "left-1")} />
      </div>
      <span className="text-[13px] text-[#3A3835]">{label}</span>
    </label>
  );
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    orgName: "51Talk",
    orgEmail: "hr@51talk.com",
    timezone: "Asia/Manila",
    qrInterval: "30",
    notifyTimeIn: true,
    notifyTimeOut: true,
    notifyAbsent: true,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (key: string, val: any) => setSettings((p) => ({ ...p, [key]: val }));

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>
      <div className="min-h-screen bg-[#F5F3EE]">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-[220px]" : "ml-[64px]")}>
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[60px] bg-white border-b border-[#E5E2DB]">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] transition-colors"><Menu className="w-4 h-4" /></button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1A]">Settings</h1>
                <p className="text-[11px] text-[#9A9890]">Manage your system preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors"><Bell className="w-3.5 h-3.5" /></button>
              <button onClick={handleSave} className={cn("inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl shadow-[0_2px_10px_rgba(196,148,38,0.30)] transition-all",
                saved ? "bg-green-600 text-white" : "text-white bg-[#C49426] hover:bg-[#B48820]")}>
                <Save className="w-3.5 h-3.5" strokeWidth={2.5} />
                {saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </header>

          <div className="p-6 max-w-[760px] space-y-4">
            {/* Organization */}
            <Section title="Organization" icon={Building2} desc="Basic organization information">
              <Field label="Name">
                <Input value={settings.orgName} onChange={(e: any) => set("orgName", e.target.value)} placeholder="Company name" />
              </Field>
              <Field label="Contact Email">
                <Input value={settings.orgEmail} onChange={(e: any) => set("orgEmail", e.target.value)} placeholder="hr@company.com" type="email" />
              </Field>
              <Field label="Timezone">
                <select value={settings.timezone} onChange={(e) => set("timezone", e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer">
                  <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
              </Field>
            </Section>

            {/* QR Settings */}
            <Section title="QR Code" icon={QrCode} desc="Configure QR code behavior">
              <Field label="Refresh Interval">
                <div className="flex items-center gap-3">
                  <Input value={settings.qrInterval} onChange={(e: any) => set("qrInterval", e.target.value)} placeholder="30" type="number" />
                  <span className="text-[13px] text-[#9A9890] whitespace-nowrap">seconds</span>
                </div>
              </Field>
            </Section>

            {/* Notifications */}
            <Section title="Notifications" icon={Bell} desc="Control what alerts you receive">
              <Toggle checked={settings.notifyTimeIn} onChange={() => set("notifyTimeIn", !settings.notifyTimeIn)} label="Notify on employee time-in" />
              <Toggle checked={settings.notifyTimeOut} onChange={() => set("notifyTimeOut", !settings.notifyTimeOut)} label="Notify on employee time-out" />
              <Toggle checked={settings.notifyAbsent} onChange={() => set("notifyAbsent", !settings.notifyAbsent)} label="Daily absent employee report" />
            </Section>

            {/* Security */}
            <Section title="Security" icon={Shield} desc="Change your admin password">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={settings.currentPassword} onChange={(e) => set("currentPassword", e.target.value)} placeholder="Enter current password"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)] transition-all" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6965] hover:text-[#1C1C1A] transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <Input value={settings.newPassword} onChange={(e: any) => set("newPassword", e.target.value)} placeholder="Min. 8 characters" type="password" />
              </Field>
              <Field label="Confirm Password">
                <Input value={settings.confirmPassword} onChange={(e: any) => set("confirmPassword", e.target.value)} placeholder="Repeat new password" type="password" />
              </Field>
            </Section>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-4 border-b border-red-50 bg-red-50/50">
                <h2 className="text-[14px] font-semibold text-red-700">Danger Zone</h2>
                <p className="text-[11px] text-red-400 mt-0.5">Irreversible actions — proceed with caution</p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#1C1C1A]">Clear all attendance records</p>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Permanently delete all attendance data for this month</p>
                </div>
                <button className="px-4 py-2 text-[13px] font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                  Clear Records
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
