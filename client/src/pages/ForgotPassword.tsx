import { useEffect } from "react";
import { useLocation } from "wouter";

// Forgot password is handled inside the Login page (click "Forgot password?" link).
// Redirect anyone who lands here directly to /login.
export default function ForgotPassword() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/login"); }, [navigate]);
  return null;
}
