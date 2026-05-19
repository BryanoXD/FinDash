/**
 * useSessionGuard - validates the user's session against the backend
 *
 * Behavior:
 * - On mount, validates immediately
 * - On window focus, revalidates (catches "I logged out elsewhere")
 * - Every 5 minutes, revalidates
 * - On 401, redirects to "/" with a toast-friendly reason
 * - On network error: 2 retries; if still failing, keeps user in app (do NOT logout
 *   the user for transient network issues)
 *
 * The hook only runs when `enabled` is true (used on protected routes).
 */
import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 min

export default function useSessionGuard({ enabled = true, onInvalid } = {}) {
  const navigate = useNavigate();
  const failureCountRef = useRef(0);

  const handleInvalid = useCallback((reason) => {
    try {
      localStorage.removeItem("findash_auth");
      localStorage.removeItem("findash_user");
      localStorage.removeItem("findash_workspace");
    } catch (_) { /* ignore */ }
    if (typeof onInvalid === "function") {
      onInvalid(reason);
    } else {
      const msg = encodeURIComponent(reason || "Sua sessao expirou. Faca login novamente.");
      navigate(`/?reason=${msg}`, { replace: true });
    }
  }, [navigate, onInvalid]);

  const validate = useCallback(async () => {
    try {
      await authAPI.validate();
      failureCountRef.current = 0;
      return true;
    } catch (err) {
      const msg = (err && err.message) || "";
      // Auth failures coming from XHR helper
      const isAuthFail =
        msg.includes("Sessao expirada") ||
        msg.includes("Sua sessao foi encerrada") ||
        msg.includes("Conta desativada") ||
        msg.includes("Not authenticated") ||
        msg.includes("Invalid session");

      if (isAuthFail) {
        handleInvalid(msg);
        return false;
      }
      // Tolerate transient network errors (no logout)
      failureCountRef.current += 1;
      console.warn("Session validation transient error:", msg);
      return false;
    }
  }, [handleInvalid]);

  useEffect(() => {
    if (!enabled) return;
    validate();

    const onFocus = () => { validate(); };
    const onVisibility = () => { if (document.visibilityState === "visible") validate(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(validate, REVALIDATE_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [enabled, validate]);

  return { validate };
}
