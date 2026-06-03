"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Coins, 
  LogOut, 
  ShoppingBag, 
  Settings, 
  Megaphone, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Plus, 
  Upload, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  PlusCircle,
  Edit2,
  Download
} from "lucide-react";

interface Order {
  id: string;
  whatsapp: string;
  chametId: string;
  currency: string;
  selectedPackageId: number;
  screenshotUrl: string | null;
  status: string;
  createdAt: string;
  userWhatsapp: string | null;
}

interface RatePackage {
  id: number;
  currency: string;
  coins: number;
  price: number;
}

interface PaymentSetting {
  id: number;
  type: string;
  details: string;
  qrImageUrl: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "rates" | "settings" | "announcements">("orders");
  const [loading, setLoading] = useState(false);

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<RatePackage[]>([]);
  const [settings, setSettings] = useState<PaymentSetting[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState("");

  // Rate Form States
  const [rateCurrency, setRateCurrency] = useState("INR");
  const [rateCoins, setRateCoins] = useState("");
  const [ratePrice, setRatePrice] = useState("");
  const [editingRateId, setEditingRateId] = useState<number | null>(null);

  // Settings File Upload States
  const [qrUploadLoading, setQrUploadLoading] = useState<Record<string, boolean>>({});

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("/api/admin/check");
        setAuthenticated(true);
      } catch (err) {
        setAuthenticated(false);
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  // Load all dashboard data if authenticated
  useEffect(() => {
    if (authenticated) {
      fetchOrders();
      fetchRates();
      fetchSettings();
      fetchAnnouncement();
    }
  }, [authenticated]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    }
  };

  const fetchRates = async () => {
    try {
      const res = await axios.get("/api/rates");
      setPackages(res.data);
    } catch (err) {
      toast.error("Failed to load rate packages");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      setSettings(res.data);
    } catch (err) {
      toast.error("Failed to load payment settings");
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await axios.get("/api/announcements");
      if (res.data) {
        setAnnouncementMsg(res.data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/admin/logout");
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  // Order Actions
  const toggleOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    try {
      await axios.patch("/api/orders", { id: orderId, status: nextStatus });
      toast.success(`Order status updated to ${nextStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Rate CRUD Actions
  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateCoins || !ratePrice) {
      return toast.error("Please fill in all rate fields.");
    }

    setLoading(true);
    try {
      if (editingRateId) {
        // Update package
        await axios.put("/api/rates", {
          id: editingRateId,
          currency: rateCurrency,
          coins: parseInt(rateCoins),
          price: parseFloat(ratePrice),
        });
        toast.success("Rate package updated successfully");
      } else {
        // Add package
        await axios.post("/api/rates", {
          currency: rateCurrency,
          coins: parseInt(rateCoins),
          price: parseFloat(ratePrice),
        });
        toast.success("Rate package added successfully");
      }
      // Reset form
      setRateCoins("");
      setRatePrice("");
      setEditingRateId(null);
      fetchRates();
    } catch (err) {
      toast.error("Failed to save rate package");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRate = (pkg: RatePackage) => {
    setEditingRateId(pkg.id);
    setRateCurrency(pkg.currency);
    setRateCoins(pkg.coins.toString());
    setRatePrice(pkg.price.toString());
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rate package?")) return;
    try {
      await axios.delete(`/api/rates?id=${id}`);
      toast.success("Rate package deleted");
      fetchRates();
    } catch (err) {
      toast.error("Failed to delete package");
    }
  };

  // Announcement Actions
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/announcements", { message: announcementMsg, isActive: true });
      toast.success("Marquee announcement updated");
    } catch (err) {
      toast.error("Failed to update announcement");
    }
  };

  // Payment Settings Actions
  const handleSettingsDetailChange = async (type: string, details: string) => {
    const setting = settings.find((s) => s.type === type);
    try {
      await axios.post("/api/settings", {
        id: setting?.id,
        type,
        details,
        qrImageUrl: setting?.qrImageUrl
      });
      toast.success(`${type} details saved!`);
      fetchSettings();
    } catch (err) {
      toast.error("Failed to save details");
    }
  };

  const handleQrUpload = async (type: string, file: File) => {
    const setting = settings.find((s) => s.type === type);
    
    setQrUploadLoading((prev) => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = uploadRes.data.url;

      // Save setting with new image path
      await axios.post("/api/settings", {
        id: setting?.id,
        type,
        details: setting?.details || "",
        qrImageUrl: url
      });

      toast.success(`${type} QR image updated successfully!`);
      fetchSettings();
    } catch (err) {
      toast.error("Failed to upload QR image");
    } finally {
      setQrUploadLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  // Helpers to fetch related rates for order rows
  const getPackageCoins = (pkgId: number) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return "Unknown";
    return pkg.coins >= 1000000 
      ? (pkg.coins / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
      : (pkg.coins / 1000).toFixed(0) + "K";
  };

  const getPackagePrice = (pkgId: number) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return "Unknown";
    return `${pkg.currency === "INR" ? "₹" : "AED "} ${pkg.price}`;
  };

  // Export orders database to CSV (Excel readable) format
  const exportToExcel = () => {
    if (orders.length === 0) {
      return toast.error("No orders available to export.");
    }

    const headers = ["Order ID", "Customer WhatsApp", "WhatsApp Contact", "Chamet User ID", "Currency", "Coins Purchased", "Price Paid", "Status", "Date Created"];
    const rows = orders.map(order => [
      order.id,
      order.userWhatsapp ? `+${order.userWhatsapp}` : "Guest/Anonymous",
      `+${order.whatsapp}`,
      order.chametId,
      order.currency,
      getPackageCoins(order.selectedPackageId),
      getPackagePrice(order.selectedPackageId).replace("₹", "INR").replace("AED", "AED"),
      order.status,
      new Date(order.createdAt).toLocaleString()
    ]);

    // Construct CSV content (using BOM \uFEFF for proper UTF-8 Excel symbol encoding)
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Mansi_Diamond_Orders_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to Excel (CSV) successfully!");
  };

  // Auth Guard Screen
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <span className="text-xs text-slate-500 mt-4 tracking-widest uppercase">Checking Authentication...</span>
      </div>
    );
  }

  // Count order statistics
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const completedCount = orders.filter((o) => o.status === "Completed").length;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-200 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide uppercase">Mansi Admin</h1>
            <p className="text-[10px] text-cyan-400 font-semibold tracking-wider">Top-up Management Board</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/30 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-900/40 text-xs font-bold transition duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Navigation tabs column */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Controls</div>
          
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              activeTab === "orders" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>Order Manager</span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("rates")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              activeTab === "rates" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Coins className="w-4 h-4" />
              <span>Rates Configuration</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              activeTab === "settings" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Payment Accounts</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>

          <button
            onClick={() => setActiveTab("announcements")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
              activeTab === "announcements" 
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4" />
              <span>Announcement Board</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </aside>

        {/* Dynamic component content column */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: ORDER MANAGER */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              
              {/* Stat Counters cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Pending Orders</span>
                    <span className="text-2xl font-black text-cyan-400">{pendingCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Completed Orders</span>
                    <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Volume</span>
                    <span className="text-2xl font-black text-white">{orders.length}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Orders Data list */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800/60 flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-white uppercase tracking-wider">Top-up Submissions</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToExcel}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition duration-200 cursor-pointer shadow shadow-violet-500/10 border border-violet-500/25"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export to Excel</span>
                    </button>
                    <button 
                      onClick={fetchOrders}
                      className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white transition duration-200"
                      title="Refresh Data"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs uppercase tracking-widest font-semibold">
                    No orders have been submitted yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850/50">
                          <th className="px-6 py-4">Submitted</th>
                          <th className="px-6 py-4">Chamet ID / Contact / Gmail</th>
                          <th className="px-6 py-4">Coins / Price</th>
                          <th className="px-6 py-4">Receipt Screenshot</th>
                          <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-900/10">
                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                              <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-extrabold text-white tracking-wide select-all">{order.chametId}</div>
                              <div className="text-slate-400 mt-1 select-all">+{order.whatsapp}</div>
                              {order.userWhatsapp && (
                                <div className="text-[10px] text-cyan-400 font-semibold mt-1 select-all">Registered: +{order.userWhatsapp}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-extrabold text-violet-400">{getPackageCoins(order.selectedPackageId)}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{getPackagePrice(order.selectedPackageId)}</div>
                            </td>
                            <td className="px-6 py-4">
                            {order.screenshotUrl ? (
                              <a
                                href={order.screenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-slate-400 hover:text-white font-bold transition duration-200"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span>View Receipt</span>
                              </a>
                            ) : (
                              <span className="text-slate-650 italic">No screenshot</span>
                            )}
                          </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => toggleOrderStatus(order.id, order.status)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase cursor-pointer border transition duration-300 ${
                                  order.status === "Completed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse"
                                }`}
                              >
                                {order.status}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: RATES CONFIGURATION */}
          {activeTab === "rates" && (
            <div className="space-y-6">
              
              {/* Form to Create/Edit Package */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative">
                <h2 className="text-base font-extrabold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-violet-500" />
                  {editingRateId ? "Update Rate Package" : "Add Rate Package"}
                </h2>
                
                <form onSubmit={handleRateSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Currency</label>
                    <select
                      value={rateCurrency}
                      onChange={(e) => setRateCurrency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-slate-200 text-xs transition duration-200 outline-none"
                    >
                      <option value="INR">INR (🇮🇳)</option>
                      <option value="AED">AED (🇦🇪)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Coins</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={rateCoins}
                      onChange={(e) => setRateCoins(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-650 text-xs transition duration-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 280"
                      value={ratePrice}
                      onChange={(e) => setRatePrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-650 text-xs transition duration-200 outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-violet-600/10 transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{editingRateId ? "Save Changes" : "Create"}</span>
                        </>
                      )}
                    </button>
                    {editingRateId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRateId(null);
                          setRateCoins("");
                          setRatePrice("");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold py-3 px-4 rounded-xl border border-slate-700/60 transition duration-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Rates list split by currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* INR Rates */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 bg-slate-950 border-b border-slate-850/50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <span>🇮🇳</span> INR Rate Card (₹)
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {packages.filter(p => p.currency === "INR").length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">No INR rates.</div>
                    ) : (
                      packages.filter(p => p.currency === "INR").map(pkg => (
                        <div key={pkg.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-900/10">
                          <div>
                            <span className="font-extrabold text-sm text-white block">{pkg.coins.toLocaleString()} Coins</span>
                            <span className="text-[10px] text-cyan-400 font-bold">₹ {pkg.price}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRate(pkg)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-violet-400 transition duration-200 cursor-pointer"
                              title="Edit Rate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(pkg.id)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition duration-200 cursor-pointer"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* AED Rates */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 bg-slate-950 border-b border-slate-850/50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <span>🇦🇪</span> AED Rate Card (Dhs)
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {packages.filter(p => p.currency === "AED").length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">No AED rates.</div>
                    ) : (
                      packages.filter(p => p.currency === "AED").map(pkg => (
                        <div key={pkg.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-900/10">
                          <div>
                            <span className="font-extrabold text-sm text-white block">{pkg.coins.toLocaleString()} Coins</span>
                            <span className="text-[10px] text-cyan-400 font-bold">AED {pkg.price}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRate(pkg)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-violet-400 transition duration-200 cursor-pointer"
                              title="Edit Rate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(pkg.id)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 transition duration-200 cursor-pointer"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PAYMENT ACCOUNTS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
                <h2 className="text-base font-extrabold text-white mb-6 uppercase tracking-wider">
                  Configure Payment Details
                </h2>

                <div className="space-y-6">
                  {/* Loop through seeded settings */}
                  {settings.map((setting) => (
                    <div key={setting.id} className="bg-slate-950/60 border border-slate-850/60 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-6">
                      
                      {/* Left: Input fields */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-400 font-black text-[9px] uppercase tracking-wider">
                            {setting.type}
                          </span>
                          <span className="text-xs font-bold text-slate-400">Account Details</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Enter ${setting.type} info (e.g. ID or number)`}
                            defaultValue={setting.details}
                            onBlur={(e) => handleSettingsDetailChange(setting.type, e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2 text-slate-200 text-xs transition duration-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input) handleSettingsDetailChange(setting.type, input.value);
                            }}
                            className="bg-violet-600/20 border border-violet-500/20 hover:bg-violet-600 hover:text-white text-violet-400 text-xs font-bold px-4 rounded-xl transition duration-250 cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Changes will save automatically on Save click or input blur.</span>
                      </div>

                      {/* Right: QR Upload for settings that support it (like UPI) */}
                      {setting.type === "UPI" && (
                        <div className="w-full md:w-56 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col items-center shrink-0">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2.5">UPI QR Code</span>
                          
                          {setting.qrImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={setting.qrImageUrl} 
                              alt="UPI QR Preview" 
                              className="w-24 h-24 object-contain rounded border border-slate-800 shadow-inner mb-3 bg-white p-1"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded border border-slate-800 bg-slate-950 flex items-center justify-center mb-3">
                              <span className="text-[9px] text-slate-500">No Image</span>
                            </div>
                          )}

                          <div className="relative w-full">
                            <input
                              type="file"
                              accept="image/*"
                              id="settings-qr-upload"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleQrUpload(setting.type, e.target.files[0]);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              disabled={qrUploadLoading[setting.type]}
                            />
                            <button
                              type="button"
                              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition duration-200"
                            >
                              {qrUploadLoading[setting.type] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              <span>Upload QR Code</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-extrabold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-violet-500" />
                Live Announcement Marquee
              </h2>
              
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Announcement Banner Text
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter announcement text to scroll on the client homepage marquee..."
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-650 text-xs transition duration-200 outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-lg shadow-violet-600/10 transition duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Live Announcement</span>
                </button>
              </form>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
