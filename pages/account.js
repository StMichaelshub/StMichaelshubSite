import Head from "next/head";
import Center from "@/components/Center";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getPublicOrderConfirmationPath,
  getPublicSiteConfig,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

function applySessionPayload(payload, { applyAuthenticatedSession, clearSessionState }) {
  if (payload?.authenticated) {
    applyAuthenticatedSession(payload.customer, payload.orders || []);
    return;
  }

  clearSessionState();
}

export default function AccountPage() {
  const router = useRouter();
  const siteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(siteKey);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", name: "" });
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [customer, setCustomer] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [submittingAction, setSubmittingAction] = useState("");
  const [orders, setOrders] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [otpDelivery, setOtpDelivery] = useState({
    method: "",
    maskedTarget: "",
    expiresInMinutes: 0,
  });

  const applyAuthenticatedSession = (sessionCustomer, sessionOrders = []) => {
    setIsAuthenticated(true);
    setCustomer(sessionCustomer);
    setOrders(sessionOrders);
    setProfileForm({
      name: sessionCustomer?.name || "",
      phone: sessionCustomer?.phone || "",
      address: sessionCustomer?.address || "",
      city: sessionCustomer?.city || "",
    });
  };

  const clearSessionState = () => {
    setIsAuthenticated(false);
    setCustomer(null);
    setOrders([]);
  };

  const loadSession = async () => {
    setSessionLoading(true);
    try {
      const response = await axios.get("/api/account/session");
      applySessionPayload(response.data, {
        applyAuthenticatedSession,
        clearSessionState,
      });
    } catch {
      clearSessionState();
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    axios
      .get("/api/account/session")
      .then((response) => {
        if (!cancelled) {
          applySessionPayload(response.data, {
            applyAuthenticatedSession,
            clearSessionState,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSessionState();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!loginForm.email) return;

    setSubmittingAction("request-otp");
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await axios.post("/api/account/request-otp", loginForm);
      setOtpRequested(true);
      setOtpDelivery({
        method: response.data.delivery || "",
        maskedTarget: response.data.maskedDeliveryTarget || "your email",
        expiresInMinutes: response.data.expiresInMinutes || 0,
      });
      setInfoMessage(
        response.data.delivery === "email"
          ? `A sign-in code was sent to ${response.data.maskedDeliveryTarget || "your email"}. Check spam or promotions if it does not arrive within a minute.`
          : "Email delivery is not configured in this environment. Use the development code shown below."
      );
      setDebugOtp(response.data.debugOtp || "");
    } catch (error) {
      setOtpDelivery({ method: "", maskedTarget: "", expiresInMinutes: 0 });
      setErrorMessage(
        error.response?.data?.message || "We could not send a sign-in code right now."
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !otpCode) return;

    setSubmittingAction("verify-otp");
    setErrorMessage("");
    setInfoMessage("");

    try {
      await axios.post("/api/account/verify-otp", {
        email: loginForm.email,
        code: otpCode,
      });
      setOtpCode("");
      setOtpRequested(false);
      setOtpDelivery({ method: "", maskedTarget: "", expiresInMinutes: 0 });
      setDebugOtp("");
      setInfoMessage("You are now signed in.");
      await loadSession();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "The sign-in code is invalid or expired."
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSubmittingAction("save-profile");
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await axios.put("/api/account/profile", profileForm);
      setCustomer(response.data.customer);
      setProfileForm({
        name: response.data.customer.name || "",
        phone: response.data.customer.phone || "",
        address: response.data.customer.address || "",
        city: response.data.customer.city || "",
      });
      setInfoMessage("Your account details have been updated.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "We could not update your profile right now."
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const handleLogout = async () => {
    setSubmittingAction("logout");
    setErrorMessage("");
    setInfoMessage("");

    try {
      await axios.post("/api/account/logout");
      setIsAuthenticated(false);
      setCustomer(null);
      setOrders([]);
      setLoginForm({ email: "", name: "" });
      setProfileForm({ name: "", phone: "", address: "", city: "" });
      setOtpCode("");
      setOtpRequested(false);
      setOtpDelivery({ method: "", maskedTarget: "", expiresInMinutes: 0 });
      setDebugOtp("");
      setInfoMessage("You have been signed out.");
    } catch {
      setErrorMessage("We could not sign you out right now.");
    } finally {
      setSubmittingAction("");
    }
  };

  const paidOrders = orders.filter((order) => order.paid).length;
  const pendingOrders = orders.length - paidOrders;
  const totalSpend = orders.reduce((runningTotal, order) => runningTotal + (order.total || 0), 0);

  return (
    <>
      <Head>
        <title>{`My Account | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={siteKey} />
      <Center>
        <div className="min-h-screen py-8 px-4 sm:px-8">
          <div className="theme-shell-light mx-auto max-w-4xl rounded-[2rem] p-8">
            <div className="border-b border-[rgba(20,109,126,0.12)] pb-6">
              <span className="theme-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                Customer account
              </span>
              <h1 className="mb-3 mt-4 text-3xl font-extrabold text-[var(--foreground-strong)]">
                My Account
              </h1>
              <p className="max-w-2xl theme-muted-page">
                Sign in with a code sent to your email to view your orders and update your details.
              </p>
            </div>

            {sessionLoading ? (
              <div className="py-16 text-center theme-muted-page">Loading your account...</div>
            ) : !isAuthenticated ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="theme-card-light rounded-[1.75rem] p-8 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(18,52,60,0.54)]">
                    Easy account access
                  </p>
                  <h2 className="mt-4 text-3xl font-bold text-[var(--foreground-strong)]">
                    One code to view your account.
                  </h2>
                  <p className="mt-4 max-w-xl theme-muted-page">
                    Use the same email you use for your orders. We will send a sign-in code so only you can view your order history and update your details.
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-[rgba(20,148,182,0.08)] p-4 backdrop-blur-sm">
                      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Sign-in</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">Email code</p>
                    </div>
                    <div className="rounded-2xl bg-[rgba(20,148,182,0.08)] p-4 backdrop-blur-sm">
                      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Orders</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">All in one place</p>
                    </div>
                    <div className="rounded-2xl bg-[rgba(20,148,182,0.08)] p-4 backdrop-blur-sm">
                      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Access</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">No password</p>
                    </div>
                  </div>
                </div>

                <div className="theme-card-light rounded-[1.75rem] p-6 shadow-lg">
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">Request a sign-in code</h2>
                    <p className="text-sm theme-muted-page">
                      Use your email to get a sign-in code.
                    </p>

                    <div className="rounded-[1.25rem] border border-[rgba(20,109,126,0.12)] bg-[rgba(22,125,143,0.06)] px-4 py-4 text-sm theme-muted-page">
                      We send the code to the same email you use at checkout. For faster delivery, check spam or promotions if it does not appear quickly.
                    </div>

                    <input
                      type="text"
                      placeholder="Full name"
                      value={loginForm.name}
                      onChange={(event) =>
                        setLoginForm((currentValue) => ({
                          ...currentValue,
                          name: event.target.value,
                        }))
                      }
                      className="theme-input-light w-full rounded-2xl px-4 py-3"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((currentValue) => ({
                          ...currentValue,
                          email: event.target.value,
                        }))
                      }
                      className="theme-input-light w-full rounded-2xl px-4 py-3"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingAction === "request-otp"}
                      className="theme-button-accent w-full min-h-[3.5rem] rounded-[1.15rem] px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingAction === "request-otp" ? "Sending code..." : "Send sign-in code"}
                    </button>
                  </form>

                  {otpRequested && (
                    <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4 border-t border-[rgba(20,109,126,0.12)] pt-6">
                      <h3 className="text-xl font-bold text-[var(--foreground-strong)]">Verify your code</h3>
                      <p className="text-sm theme-muted-page">
                        {otpDelivery.method === "email"
                          ? `Use the code sent to ${otpDelivery.maskedTarget}.`
                          : "Use the development code displayed below."}
                        {otpDelivery.expiresInMinutes ? ` It expires in ${otpDelivery.expiresInMinutes} minutes.` : ""}
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                        className="theme-input-light w-full rounded-2xl px-4 py-3 tracking-[0.35em]"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingAction === "verify-otp"}
                        className="theme-button-primary w-full min-h-[3.5rem] rounded-[1.15rem] px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingAction === "verify-otp" ? "Verifying..." : "Verify and sign in"}
                      </button>
                    </form>
                  )}

                  {debugOtp && (
                    <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Development code: <span className="font-semibold tracking-[0.25em]">{debugOtp}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="theme-card-light mt-8 flex flex-col gap-4 rounded-[1.75rem] p-8 shadow-xl lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[rgba(18,52,60,0.54)]">Signed in</p>
                    <h2 className="mt-3 text-3xl font-bold text-[var(--foreground-strong)]">Welcome back, {customer?.name || customer?.email}</h2>
                    <p className="mt-3 theme-muted-page">
                      {customer?.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={submittingAction === "logout"}
                    className="theme-button-accent rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submittingAction === "logout" ? "Signing out..." : "Sign out"}
                  </button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-4">
                  <div className="theme-card-light rounded-[1.5rem] p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Orders found</p>
                    <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{orders.length}</p>
                  </div>
                  <div className="theme-card-light rounded-[1.5rem] p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Paid orders</p>
                    <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{paidOrders}</p>
                  </div>
                  <div className="theme-card-light rounded-[1.5rem] p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Pending orders</p>
                    <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{pendingOrders}</p>
                  </div>
                  <div className="theme-card-light rounded-[1.5rem] p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Total spend</p>
                    <p className="mt-2 text-3xl font-bold text-[var(--accent)]">₦{totalSpend.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <form onSubmit={handleProfileSave} className="theme-card-light rounded-[1.75rem] p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">Customer profile</h2>
                    <p className="mt-2 text-sm theme-muted-page">
                      Keep your online account details current for faster checkout.
                    </p>

                    <div className="mt-6 space-y-4">
                      <input
                        type="text"
                        placeholder="Full name"
                        value={profileForm.name}
                        onChange={(event) =>
                          setProfileForm((currentValue) => ({
                            ...currentValue,
                            name: event.target.value,
                          }))
                        }
                          className="theme-input-light w-full rounded-2xl px-4 py-3"
                      />
                      <input
                        type="email"
                        value={customer?.email || ""}
                        readOnly
                          className="theme-input-readonly w-full rounded-2xl px-4 py-3"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((currentValue) => ({
                            ...currentValue,
                            phone: event.target.value,
                          }))
                        }
                        className="theme-input-light w-full rounded-2xl px-4 py-3"
                      />
                      <input
                        type="text"
                        placeholder="Street address"
                        value={profileForm.address}
                        onChange={(event) =>
                          setProfileForm((currentValue) => ({
                            ...currentValue,
                            address: event.target.value,
                          }))
                        }
                        className="theme-input-light w-full rounded-2xl px-4 py-3"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={profileForm.city}
                        onChange={(event) =>
                          setProfileForm((currentValue) => ({
                            ...currentValue,
                            city: event.target.value,
                          }))
                        }
                        className="theme-input-light w-full rounded-2xl px-4 py-3"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAction === "save-profile"}
                      className="theme-button-accent mt-6 w-full min-h-[3.5rem] rounded-[1.15rem] px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingAction === "save-profile" ? "Saving..." : "Save profile"}
                    </button>
                  </form>

                  <div className="theme-card-light rounded-[1.75rem] p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">Your orders</h2>
                        <p className="mt-2 text-sm theme-muted-page">
                          Track your order status and view order details in one place.
                        </p>
                      </div>
                    </div>

                    {orders.length === 0 ? (
                      <p className="mt-8 rounded-2xl border border-dashed border-[rgba(20,109,126,0.18)] bg-[rgba(22,125,143,0.05)] px-4 py-8 text-center theme-muted-page">
                        No orders have been linked to this account yet.
                      </p>
                    ) : (
                      <div className="mt-6 space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order._id}
                            className="rounded-[1.5rem] border border-[rgba(20,109,126,0.12)] bg-[rgba(255,255,255,0.78)] p-5 transition hover:shadow-md"
                          >
                            <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="text-lg font-medium text-[var(--foreground-strong)]">
                                  Order #{order._id.slice(-8)}
                                </p>
                                <p className="text-sm theme-muted-page">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 md:justify-end">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    order.paid
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {order.paid ? "Paid" : order.paymentStatus || "Pending"}
                                </span>
                                <span className="theme-card-light inline-block rounded-full px-3 py-1 text-xs font-medium text-[var(--foreground-strong)]">
                                  {order.status}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-2 text-sm theme-muted-page md:grid-cols-[1fr_auto] md:items-end">
                              <div>
                                <p>
                                  {order.items?.length || 0} items &middot; ₦{order.total?.toLocaleString()}
                                </p>
                                <p className="mt-1 text-[rgba(18,52,60,0.56)]">
                                  {order.items?.slice(0, 2).map((item) => item.name).join(", ")}
                                  {order.items?.length > 2 ? " and more" : ""}
                                </p>
                              </div>
                              <Link
                                href={getPublicOrderConfirmationPath(order.siteKey || siteKey, order._id)}
                                className="theme-button-accent inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-2 text-sm font-medium transition"
                              >
                                View order
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {infoMessage && (
              <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {infoMessage}
              </div>
            )}
          </div>
        </div>
      </Center>
    </>
  );
}
