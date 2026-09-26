"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { api } from "@/lib/interceptor";
import { formatINR } from "@/utils/helpers";
import {
  Package, Truck, ShieldCheck, FileText, MapPin, Building2,
  User, Phone, Link2, CheckCircle, AlertCircle, Loader2, ArrowLeft,
  ChevronRight, Shield, Copy, ExternalLink
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductCategory } from "@/types";

type Step = "form" | "otp" | "success";

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export default function OrderPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [mobileLookup, setMobileLookup] = useState(false);
  const [mobileLookedUp, setMobileLookedUp] = useState(false);
  const [orgStates, setOrgStates] = useState<{id: number; name: string}[]>([]);
  const [orgCities, setOrgCities] = useState<{id: number; name: string}[]>([]);
  const [shipStates, setShipStates] = useState<{id: number; name: string}[]>([]);
  const [shipCities, setShipCities] = useState<{id: number; name: string}[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [form, setForm] = useState({
    mobile: "",
    name: "",
    email: "",
    companyName: "",
    orgStreet: "",
    orgCity: "",
    orgCityId: 0,
    orgState: "",
    orgStateId: 0,
    orgZip: "",
    orgCountry: "India",
    shipStreet: "",
    shipCity: "",
    shipCityId: 0,
    shipState: "",
    shipStateId: 0,
    shipZip: "",
    shipCountry: "India",
    locationUrl: "",
    message: "",
    qty: 1,
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get<any>(`/api/products/${productId}`);
        const p = res.data?.data ?? res.data;
        if (!p) { setProduct(null); return; }
        const mapped: Product = {
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: p.price,
          originalPrice: p.originalPrice || null,
          category: (p.category || "Automation") as unknown as ProductCategory,
          subcategory: p.subcategory,
          brand: p.brand?.name || p.brand || p.brandName || "Unknown",
          brandLogo: p.brand?.logo || p.brandLogo,
          model: p.model || "",
          image: p.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
          images: p.images || [],
          rating: p.rating || 4.5,
          reviews: p.reviewCount || p.reviews || 0,
          stock: p.stock || 0,
          sku: p.sku || "",
          partNumber: p.partNumber || "",
          keywords: p.keywords || [],
          featured: p.featured || false,
          badge: p.badge,
          specs: p.specs || {},
          leadTime: p.leadTime,
          isActive: p.isActive ?? true,
        };
        setProduct(mapped);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (form.mobile.length !== 10 || !/^[6-9]\d{9}$/.test(form.mobile)) {
      setMobileLookedUp(false);
      return;
    }

    const timer = setTimeout(async () => {
      setMobileLookup(true);
      try {
        const res = await api.get<any>("/api/orders/lookup", { mobile: form.mobile });
        const data = res.data?.data ?? res.data;
        if (data.found) {
          const orgStateRes = await api.get<any>("/api/orders/locations/states", { q: data.orgAddress?.state || "" });
          const orgStatesData = orgStateRes.data?.data ?? orgStateRes.data;
          const orgStateMatch = orgStatesData?.find((s: {name: string}) => s.name === data.orgAddress?.state);
          const mappedOrgStates = (orgStatesData || []).map((s: {stateId: number; name: string}) => ({ id: s.stateId, name: s.name }));
          setOrgStates(mappedOrgStates);

          let orgCityId = 0;
          let orgStateId = orgStateMatch?.stateId || 0;
          let mappedOrgCities: {id: number; name: string}[] = [];
          if (orgStateId) {
            const orgCityRes = await api.get<any>("/api/orders/locations/cities", { stateId: orgStateId, q: data.orgAddress?.city || "" });
            const orgCitiesData = orgCityRes.data?.data ?? orgCityRes.data;
            const orgCityMatch = orgCitiesData?.find((c: {name: string}) => c.name === data.orgAddress?.city);
            orgCityId = orgCityMatch?.cityId || 0;
            mappedOrgCities = (orgCitiesData || []).map((c: {cityId: number; name: string}) => ({ id: c.cityId, name: c.name }));
            setOrgCities(mappedOrgCities);
          }

          const shipStateName = data.sameAddress ? data.orgAddress?.state : data.shippingAddress?.state;
          const shipCityName = data.sameAddress ? data.orgAddress?.city : data.shippingAddress?.city;
          const shipStateMatch = orgStatesData?.find((s: {name: string}) => s.name === shipStateName);
          let shipStateId = shipStateMatch?.stateId || 0;
          let shipCityId = 0;
          let mappedShipCities: {id: number; name: string}[] = [];

          if (data.sameAddress) {
            setShipStates(mappedOrgStates);
            setShipCities(mappedOrgCities);
            shipStateId = orgStateId;
            shipCityId = orgCityId;
          } else if (shipStateId) {
            const shipCityRes = await api.get<any>("/api/orders/locations/cities", { stateId: shipStateId, q: shipCityName || "" });
            const shipCitiesData = shipCityRes.data?.data ?? shipCityRes.data;
            const shipCityMatch = shipCitiesData?.find((c: {name: string}) => c.name === shipCityName);
            shipCityId = shipCityMatch?.cityId || 0;
            mappedShipCities = (shipCitiesData || []).map((c: {cityId: number; name: string}) => ({ id: c.cityId, name: c.name }));
            setShipStates(mappedOrgStates);
            setShipCities(mappedShipCities);
          } else {
            setShipStates(mappedOrgStates);
          }

          setForm(f => ({
            ...f,
            name: data.customerName || f.name,
            email: data.customerEmail || f.email,
            companyName: data.customerCompany || f.companyName,
            orgStreet: data.orgAddress?.street || "",
            orgCity: data.orgAddress?.city || "",
            orgCityId,
            orgState: data.orgAddress?.state || "",
            orgStateId,
            orgZip: data.orgAddress?.zip || "",
            orgCountry: data.orgAddress?.country || "India",
            shipStreet: data.sameAddress ? data.orgAddress?.street || "" : data.shippingAddress?.street || "",
            shipCity: shipCityName || "",
            shipCityId,
            shipState: shipStateName || "",
            shipStateId,
            shipZip: data.sameAddress ? data.orgAddress?.zip || "" : data.shippingAddress?.zip || "",
            shipCountry: data.sameAddress ? data.orgAddress?.country || "India" : data.shippingAddress?.country || "India",
            locationUrl: data.locationUrl || f.locationUrl,
          }));
          setSameAddress(data.sameAddress ?? true);
          setMobileLookedUp(true);
        } else {
          setMobileLookedUp(false);
        }
      } catch {
        setMobileLookedUp(false);
      } finally {
        setMobileLookup(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.mobile]);

  const fetchStates = async (q: string, isOrg: boolean) => {
    setLoadingStates(true);
    try {
      const res = await api.get<any>("/api/orders/locations/states", { q });
      const data = res.data?.data ?? res.data;
      const mapped = (data || []).map((s: {stateId: number; name: string}) => ({ id: s.stateId, name: s.name }));
      if (isOrg) setOrgStates(mapped);
      else setShipStates(mapped);
    } catch {
      if (isOrg) setOrgStates([]);
      else setShipStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (stateId: number, q: string, isOrg: boolean) => {
    if (!stateId) {
      if (isOrg) setOrgCities([]);
      else setShipCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const res = await api.get<any>("/api/orders/locations/cities", { stateId, q });
      const data = res.data?.data ?? res.data;
      const mapped = (data || []).map((c: {cityId: number; name: string}) => ({ id: c.cityId, name: c.name }));
      if (isOrg) setOrgCities(mapped);
      else setShipCities(mapped);
    } catch {
      if (isOrg) setOrgCities([]);
      else setShipCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleOrgStateChange = (name: string, id: number) => {
    setForm(f => ({ ...f, orgState: name, orgStateId: id, orgCity: "", orgCityId: 0 }));
    setOrgCities([]);
    if (id) fetchCities(id, "", true);
  };

  const handleOrgCityChange = (name: string, id: number) => {
    setForm(f => ({ ...f, orgCity: name, orgCityId: id }));
  };

  const handleShipStateChange = (name: string, id: number) => {
    setForm(f => ({ ...f, shipState: name, shipStateId: id, shipCity: "", shipCityId: 0 }));
    setShipCities([]);
    if (id) fetchCities(id, "", true);
  };

  const handleShipCityChange = (name: string, id: number) => {
    setForm(f => ({ ...f, shipCity: name, shipCityId: id }));
  };

  const handleSyncAddress = () => {
    setForm(f => ({
      ...f,
      shipStreet: f.orgStreet,
      shipCity: f.orgCity,
      shipCityId: f.orgCityId,
      shipState: f.orgState,
      shipStateId: f.orgStateId,
      shipZip: f.orgZip,
      shipCountry: f.orgCountry,
    }));
    setShipStates(orgStates);
    setShipCities(orgCities);
  };

  const handleClearShipping = () => {
    setForm(f => ({ ...f, shipStreet: "", shipCity: "", shipCityId: 0, shipState: "", shipStateId: 0, shipZip: "" }));
    setShipStates([]);
    setShipCities([]);
  };

  const validateForm = () => {
    if (!form.mobile || form.mobile.length !== 10 || !/^[6-9]\d{9}$/.test(form.mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return false;
    }
    if (!form.name.trim()) { setError("Name is required"); return false; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Valid email is required"); return false; }
    if (!form.companyName.trim()) { setError("Company / Organization name is required"); return false; }
    if (!form.orgStreet.trim()) { setError("Organization address is required"); return false; }
    if (!form.orgStateId) { setError("Please select a state"); return false; }
    if (!form.orgCityId) { setError("Please select a city"); return false; }
    if (!form.orgZip.trim() || form.orgZip.length !== 6) { setError("Valid 6-digit PIN code is required"); return false; }
    if (!sameAddress) {
      if (!form.shipStreet.trim()) { setError("Delivery address is required"); return false; }
      if (!form.shipStateId) { setError("Please select a delivery state"); return false; }
      if (!form.shipCityId) { setError("Please select a delivery city"); return false; }
      if (!form.shipZip.trim() || form.shipZip.length !== 6) { setError("Valid 6-digit delivery PIN code is required"); return false; }
    }
    return true;
  };

  const handleSendOtp = async () => {
    setError("");
    if (!validateForm()) return;
    if (sameAddress) handleSyncAddress();

    setSendingOtp(true);
    try {
      const res = await api.post<any>("/api/orders/otp/send", { mobile: form.mobile });
      const token = res.data?.otpToken ?? res.data?.data?.otpToken;
      setOtpToken(token || "");
      setOtpSent(true);
      setStep("otp");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndPlaceOrder = async () => {
    setError("");
    if (!product) return;

    setSubmitting(true);
    try {
      const orgAddress: Address = {
        street: form.orgStreet,
        city: form.orgCity,
        state: form.orgState,
        zip: form.orgZip,
        country: form.orgCountry,
      };
      const shippingAddress: Address = sameAddress ? { ...orgAddress } : {
        street: form.shipStreet,
        city: form.shipCity,
        state: form.shipState,
        zip: form.shipZip,
        country: form.shipCountry,
      };

      const res = await api.post<any>("/api/orders", {
        items: [{ productId: product.id, quantity: form.qty }],
        customerName: form.name,
        customerEmail: form.email,
        customerCompany: form.companyName,
        mobile: form.mobile,
        orgAddress,
        shippingAddress,
        locationUrl: form.locationUrl || undefined,
        otpToken,
        paymentMethod: "wire_transfer",
        notes: form.message || undefined,
      });

      const order = res.data?.data ?? res.data;
      setOrderNumber(order.orderNumber);
      setStep("success");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-24">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-display font-bold text-2xl text-slate-600 mb-1">Product Not Found</p>
            <Link href="/shop" className="btn-primary inline-flex items-center gap-2 mt-4">
              <ArrowLeft className="w-4 h-4" />Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">Order Confirmed!</h2>
            <p className="text-slate-500 mb-1">Your order has been placed successfully.</p>
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 mb-6">
              <span className="text-xs text-primary-600 font-bold">Order No.</span>
              <span className="font-mono font-bold text-primary-700">{orderNumber}</span>
              <button onClick={() => { navigator.clipboard.writeText(orderNumber); }} className="p-1 hover:bg-primary-100 rounded">
                <Copy className="w-3.5 h-3.5 text-primary-500" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-8">You will receive a confirmation email at <span className="font-medium text-slate-500">{form.email}</span> and SMS on <span className="font-medium text-slate-500">+91 {form.mobile}</span> with delivery details.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/orders" className="btn-primary">Track Order</Link>
              <Link href="/shop" className="btn-outline">Continue Shopping</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = product.price * form.qty;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-primary-700 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-primary-300 text-xs mb-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium truncate">{product.name}</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Place Order</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {["Details", "Verify OTP"].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                (i === 0 && step === "form") || (i === 1 && step === "otp")
                  ? "bg-primary-600 text-white"
                  : (i === 0 && step === "otp")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
              }`}>
                {(i === 0 && step === "otp") ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{i + 1}</span>
                )}
                {s}
              </div>
              {i < 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "form" && (
              <div className="card p-6 animate-fade-in space-y-6">
                <h2 className="section-title flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />Contact & Organization Details
                </h2>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className="input pl-10 pr-10"
                        value={form.mobile}
                        onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                      />
                      {mobileLookup && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4">
                          <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
                        </span>
                      )}
                      {mobileLookedUp && !mobileLookup && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {mobileLookedUp && (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />Previous details auto-filled
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={e => set("name", e.target.value)}
                      placeholder="Rajesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      className="input"
                      value={form.email}
                      onChange={e => set("email", e.target.value)}
                      placeholder="rajesh@acme.com"
                    />
                  </div>
                  <div>
                    <label className="label">Company / Organization *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        className="input pl-10"
                        value={form.companyName}
                        onChange={e => set("companyName", e.target.value)}
                        placeholder="Acme Industries Pvt. Ltd."
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Address */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-600" />Organization Address
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="label">Street / Area *</label>
                      <input className="input" value={form.orgStreet} onChange={e => set("orgStreet", e.target.value)} placeholder="Plot 22, MIDC Industrial Area" />
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <SearchableSelect
                        options={orgStates}
                        value={form.orgState}
                        onChange={handleOrgStateChange}
                        placeholder="Select state"
                        loading={loadingStates}
                        onSearch={q => fetchStates(q, true)}
                      />
                    </div>
                    <div>
                      <label className="label">City *</label>
                      <SearchableSelect
                        options={orgCities}
                        value={form.orgCity}
                        onChange={handleOrgCityChange}
                        placeholder="Select city"
                        disabled={!form.orgStateId}
                        loading={loadingCities}
                        onSearch={q => fetchCities(form.orgStateId, q, true)}
                      />
                    </div>
                    <div>
                      <label className="label">PIN Code *</label>
                      <input className="input" value={form.orgZip} onChange={e => set("orgZip", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="411019" />
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input className="input bg-slate-50" value="India" disabled />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600" />Delivery Address
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-slate-500">Same as organization</span>
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors ${sameAddress ? "bg-primary-600" : "bg-slate-300"}`}
                        onClick={() => {
                          if (sameAddress) {
                            handleClearShipping();
                          } else {
                            handleSyncAddress();
                          }
                          setSameAddress(!sameAddress);
                        }}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sameAddress ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  </div>

                  {sameAddress ? (
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      Will be delivered to the organization address above
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div className="sm:col-span-2">
                        <label className="label">Street / Area *</label>
                        <input className="input" value={form.shipStreet} onChange={e => set("shipStreet", e.target.value)} placeholder="14, Nehru Industrial Estate" />
                      </div>
                      <div>
                        <label className="label">State *</label>
                        <SearchableSelect
                          options={shipStates}
                          value={form.shipState}
                          onChange={handleShipStateChange}
                          placeholder="Select state"
                          loading={loadingStates}
                          onSearch={q => fetchStates(q, false)}
                        />
                      </div>
                      <div>
                        <label className="label">City *</label>
                        <SearchableSelect
                          options={shipCities}
                          value={form.shipCity}
                          onChange={handleShipCityChange}
                          placeholder="Select city"
                          disabled={!form.shipStateId}
                          loading={loadingCities}
                          onSearch={q => fetchCities(form.shipStateId, q, false)}
                        />
                      </div>
                      <div>
                        <label className="label">PIN Code *</label>
                        <input className="input" value={form.shipZip} onChange={e => set("shipZip", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="600010" />
                      </div>
                      <div>
                        <label className="label">Country</label>
                        <input className="input bg-slate-50" value="India" disabled />
                      </div>
                    </div>
                  )}
                </div>

                {/* Location URL */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary-600" />Location Pin <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </h3>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="input pl-10"
                      value={form.locationUrl}
                      onChange={e => set("locationUrl", e.target.value)}
                      placeholder="https://maps.google.com/?q=18.5204,73.8567"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Paste a Google Maps link to help our delivery team locate you easily</p>
                </div>

                {/* Quantity */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display font-bold text-slate-900 mb-4">Quantity</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                      <button onClick={() => set("qty", Math.max(1, form.qty - 1))} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">−</button>
                      <span className="px-6 py-2 text-sm font-bold text-slate-900 min-w-[3rem] text-center">{form.qty}</span>
                      <button onClick={() => set("qty", Math.min(product.stock, form.qty + 1))} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">+</button>
                    </div>
                    <span className="text-sm text-slate-500">{product.stock} available</span>
                  </div>
                </div>

                {/* Additional Message */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />Additional Message <span className="text-xs font-normal text-slate-400">(optional)</span>
                  </h3>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    value={form.message}
                    onChange={e => set("message", e.target.value.slice(0, 350))}
                    placeholder="Any special instructions, delivery preferences, or notes for our team..."
                  />
                  <p className={`text-xs mt-1.5 text-right ${form.message.length >= 350 ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                    {form.message.length}/350
                  </p>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={product.stock === 0 || sendingOtp}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending OTP...</>
                  ) : (
                    <><Shield className="w-4 h-4" />Verify & Continue</>
                  )}
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="card p-6 animate-fade-in">
                <h2 className="section-title flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary-600" />OTP Verification
                </h2>
                <p className="text-sm text-slate-500 mb-6">Enter the OTP sent to <span className="font-semibold text-slate-700">+91 {form.mobile}</span></p>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <div className="max-w-xs mx-auto mb-6">
                  <input
                    className="input text-center text-3xl font-mono tracking-widest py-4"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 text-center mt-2">Enter the 6-digit OTP sent to your mobile</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="btn-outline flex-1">Back</button>
                  <button
                    onClick={handleVerifyAndPlaceOrder}
                    disabled={submitting || otp.length < 6}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Placing Order...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" />Confirm & Place Order</>
                    )}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="card p-5 h-fit sticky top-24 space-y-4">
            <h3 className="section-title mb-2">Order Summary</h3>

            <div className="flex gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{product.brand}</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Qty: {form.qty}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span className="font-semibold">{formatINR(tax)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className={shipping === 0 ? "text-emerald-600 font-bold" : "font-semibold"}>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
              <div className="divider pt-2 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-700">{formatINR(total)}</span></div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              {[
                { icon: Truck, label: product.leadTime || "Ships in 2-3 days" },
                { icon: ShieldCheck, label: "Genuine OEM Product" },
                { icon: FileText, label: "GST Invoice Included" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-slate-600">
                  <Icon className="w-3.5 h-3.5 text-primary-500 shrink-0" />{label}
                </div>
              ))}
            </div>

            {form.locationUrl && (
              <a href={form.locationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 pt-2 border-t border-slate-100">
                <ExternalLink className="w-3.5 h-3.5" />View location on map
              </a>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
