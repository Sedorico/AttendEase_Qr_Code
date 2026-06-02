"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Download, UserPlus, Menu, X, Bell,
  CheckCircle2, XCircle, MoreHorizontal, Mail,
  Building2, Briefcase, Calendar, Shield,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DEPARTMENTS = [
  "Data Analyst", "IT", "HR", "ESL Teacher",
  "Operation", "Customer Support", "Marketing", "WebDev",
];

const ROLE_BADGE: Record<string, { label: string; classes: string }> = {
  admin:    { label: "Admin",    classes: "bg-purple-50 text-purple-700 border-purple-100" },
  manager:  { label: "Manager",  classes: "bg-[#FBF5E6] text-[#9A7A1A] border-[#E5DCC0]" },
  employee: { label: "Employee", classes: "bg-[#F5F3EE] text-[#9A9890] border-[#E5E2DB]" },
};

export default function EmployeesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null);
  const [newEmp, setNewEmp] = useState({
    name: "", email: "", password: "", department: "", position: "",
  });

  const { data: empData, isLoading, mutate } = useSWR(
    `/api/employees?search=${search}&department=${deptFilter === "all" ? "" : deptFilter}&status=${statusFilter}`,
    fetcher
  );
  const employees = empData?.data?.employees ?? [];

  const deptCounts = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = employees.filter((e: any) => e.department === dept).length;
    return acc;
  }, {} as Record<string, number>);

  const handleAdd = async () => {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmp),
    });
    if (res.ok) {
      setAddOpen(false);
      setNewEmp({ name: "", email: "", password: "", department: "", position: "" });
      mutate();
    }
  };

  const handleToggleActive = async (emp: any) => {
    setOpenMenuId(null);
    await fetch(`/api/employees/${emp._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    mutate();
  };

  const handleEdit = async () => {
    await fetch(`/api/employees/${editEmployee._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editEmployee.name,
        department: editEmployee.department,
        position: editEmployee.position,
      }),
    });
    setEditEmployee(null);
    mutate();
  };

  const handlePromote = async (emp: any, targetRole: 'manager' | 'employee') => {
    setPromoteLoading(emp._id + targetRole);
    setOpenMenuId(null);
    try {
      await fetch("/api/employees/promote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: emp._id, role: targetRole }),
      });
      mutate();
    } finally {
      setPromoteLoading(null);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>
      <div className="min-h-screen bg-[#F5F3EE]">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-[220px]" : "ml-[64px]")}>

          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[60px] bg-white border-b border-[#E5E2DB]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1A]">Employees</h1>
                <p className="text-[11px] text-[#9A9890]">{employees.length} total members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#C49426] hover:bg-[#B48820] rounded-xl shadow-[0_2px_10px_rgba(196,148,38,0.30)] transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Add Employee
              </button>
            </div>
          </header>

          <div className="p-6 space-y-4 max-w-[1400px]">

            {/* Dept Count Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEPARTMENTS.slice(0, 4).map((dept, i) => (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-[#E5E2DB] px-4 py-3.5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-[11px] font-bold text-[#9A9890] uppercase tracking-[0.06em] truncate">{dept}</p>
                  <p className="text-[26px] font-bold text-[#1C1C1A] mt-0.5">{deptCounts[dept] || 0}</p>
                </motion.div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-[#E5E2DB] p-4 flex flex-wrap gap-3 items-center shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0AEA9]" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search employees…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.10)] transition-all"
                />
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 px-3 pr-8 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 pr-8 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="h-9 px-4 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] font-medium text-[#6B6965] hover:bg-[#F0EDE6] transition-colors flex items-center gap-2">
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Export
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E5E2DB] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F0EDE6] bg-[#FAFAF8]">
                    {["Employee", "Department", "Position", "Role", "Status", "Today", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-[#9A9890] uppercase tracking-[0.07em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F3EE]">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-[#F0EDE6] rounded-lg animate-pulse" style={{ width: j === 0 ? "70%" : "60%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-[13px] text-[#9A9890]">No employees found</td>
                    </tr>
                  ) : (
                    employees.map((emp: any, i: number) => {
                      const initials = emp.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                      const todayStatus = emp.todayStatus || "absent";
                      const roleBadge = ROLE_BADGE[emp.role] || ROLE_BADGE.employee;
                      const isAdmin = emp.role === 'admin';

                      return (
                        <motion.tr
                          key={emp._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-[#FAFAF8] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-[#1C1C1A]">{emp.name}</p>
                                <p className="text-[11px] text-[#9A9890]">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[13px] text-[#6B6965]">{emp.department}</td>
                          <td className="px-5 py-3.5 text-[13px] text-[#6B6965]">{emp.position}</td>

                          {/* Role badge */}
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border",
                              roleBadge.classes
                            )}>
                              <Shield className="w-2.5 h-2.5" strokeWidth={2.5} />
                              {roleBadge.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border",
                              emp.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-[#F5F3EE] text-[#9A9890] border-[#E5E2DB]"
                            )}>
                              {emp.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {emp.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full",
                              todayStatus === "present" ? "bg-green-50 text-green-700" :
                              todayStatus === "late" ? "bg-amber-50 text-amber-700" :
                              todayStatus === "half-day" ? "bg-blue-50 text-blue-700" :
                              "bg-red-50 text-red-600"
                            )}>
                              {todayStatus}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === emp._id ? null : emp._id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9A9890] hover:bg-[#F0EDE6] hover:text-[#1C1C1A] transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === emp._id && (
                              <div className="absolute right-5 top-10 z-20 bg-white border border-[#E5E2DB] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] py-1 w-[190px]">
                                <button
                                  onClick={() => { setViewEmployee(emp); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#3A3835] hover:bg-[#FAFAF8] transition-colors"
                                >
                                  View Profile
                                </button>
                                <button
                                  onClick={() => { setEditEmployee({ ...emp }); setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#3A3835] hover:bg-[#FAFAF8] transition-colors"
                                >
                                  Edit Employee
                                </button>

                                {/* Promote / Demote — hide for admins */}
                                {!isAdmin && (
                                  <>
                                    <div className="my-1 border-t border-[#F0EDE6]" />
                                    {emp.role === 'employee' ? (
                                      <button
                                        onClick={() => handlePromote(emp, 'manager')}
                                        disabled={promoteLoading === emp._id + 'manager'}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#9A7A1A] hover:bg-[#FBF5E6] transition-colors disabled:opacity-50 flex items-center gap-2"
                                      >
                                        <Shield className="w-3.5 h-3.5" strokeWidth={2} />
                                        Promote to Manager
                                      </button>
                                    ) : emp.role === 'manager' ? (
                                      <button
                                        onClick={() => handlePromote(emp, 'employee')}
                                        disabled={promoteLoading === emp._id + 'employee'}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-[#9A9890] hover:bg-[#F5F3EE] transition-colors disabled:opacity-50 flex items-center gap-2"
                                      >
                                        <Shield className="w-3.5 h-3.5" strokeWidth={2} />
                                        Demote to Employee
                                      </button>
                                    ) : null}
                                  </>
                                )}

                                <div className="my-1 border-t border-[#F0EDE6]" />
                                <button
                                  onClick={() => handleToggleActive(emp)}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-[13px] transition-colors",
                                    emp.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                                  )}
                                >
                                  {emp.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* View Profile Modal */}
      <AnimatePresence>
        {viewEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_8px_48px_rgba(0,0,0,0.12)] w-full max-w-[420px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[#F0EDE6] flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#1C1C1A]">Employee Profile</h2>
                <button onClick={() => setViewEmployee(null)} className="text-[#9A9890] hover:text-[#1C1C1A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#FBF5E6] border-2 border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                    <span className="text-[18px] font-bold text-[#C49426]">
                      {viewEmployee.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-[#1C1C1A]">{viewEmployee.name}</p>
                    <p className="text-[12px] text-[#9A9890]">{viewEmployee.employeeId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                        viewEmployee.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {viewEmployee.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                        (ROLE_BADGE[viewEmployee.role] || ROLE_BADGE.employee).classes
                      )}>
                        <Shield className="w-2.5 h-2.5" strokeWidth={2.5} />
                        {(ROLE_BADGE[viewEmployee.role] || ROLE_BADGE.employee).label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: "Email", value: viewEmployee.email },
                    { icon: Building2, label: "Department", value: viewEmployee.department },
                    { icon: Briefcase, label: "Position", value: viewEmployee.position },
                    { icon: Calendar, label: "Joined", value: viewEmployee.createdAt ? format(new Date(viewEmployee.createdAt), "MMM d, yyyy") : "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAF8] border border-[#F0EDE6]">
                      <div className="w-7 h-7 rounded-lg bg-[#FBF5E6] flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3.5 h-3.5 text-[#C49426]" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#9A9890] uppercase tracking-wide">{item.label}</p>
                        <p className="text-[13px] text-[#1C1C1A]">{item.value || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE6] flex justify-end">
                <button
                  onClick={() => setViewEmployee(null)}
                  className="px-5 py-2 text-[13px] font-medium text-[#6B6965] bg-white border border-[#E5E2DB] rounded-xl hover:bg-[#F5F3EE] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Employee Modal */}
      <AnimatePresence>
        {editEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_8px_48px_rgba(0,0,0,0.12)] w-full max-w-[440px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[#F0EDE6] flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1C1A]">Edit Employee</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Update employee information</p>
                </div>
                <button onClick={() => setEditEmployee(null)} className="text-[#9A9890] hover:text-[#1C1C1A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Position", key: "position", type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={editEmployee[f.key] || ""}
                      onChange={(e) => setEditEmployee({ ...editEmployee, [f.key]: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)] transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">Department</label>
                  <select
                    value={editEmployee.department || ""}
                    onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer"
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE6] flex justify-end gap-2">
                <button
                  onClick={() => setEditEmployee(null)}
                  className="px-4 py-2 text-[13px] font-medium text-[#6B6965] bg-white border border-[#E5E2DB] rounded-xl hover:bg-[#F5F3EE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-[#C49426] hover:bg-[#B48820] rounded-xl shadow-[0_2px_10px_rgba(196,148,38,0.30)] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_8px_48px_rgba(0,0,0,0.12)] w-full max-w-[440px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[#F0EDE6] flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1C1A]">Add New Employee</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Create a new employee account</p>
                </div>
                <button onClick={() => setAddOpen(false)} className="text-[#9A9890] hover:text-[#1C1C1A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "Juan dela Cruz" },
                  { label: "Email", key: "email", type: "email", placeholder: "juan@company.com" },
                  { label: "Password", key: "password", type: "password", placeholder: "Min. 6 characters" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={(newEmp as any)[f.key]}
                      onChange={(e) => setNewEmp({ ...newEmp, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)] transition-all"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">Department</label>
                    <select
                      value={newEmp.department}
                      onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer"
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A5855] uppercase tracking-[0.07em] mb-1.5">Position</label>
                    <input
                      type="text"
                      value={newEmp.position}
                      onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                      placeholder="Job title"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] focus:shadow-[0_0_0_3px_rgba(196,148,38,0.12)] transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#F0EDE6] flex justify-end gap-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-[#6B6965] bg-white border border-[#E5E2DB] rounded-xl hover:bg-[#F5F3EE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-5 py-2 text-[13px] font-semibold text-white bg-[#C49426] hover:bg-[#B48820] rounded-xl shadow-[0_2px_10px_rgba(196,148,38,0.30)] transition-all"
                >
                  Add Employee
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
