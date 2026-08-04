import { ResetPasswordForm } from "@/components/dashboard/reset-password-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import "@/app/dashboard/dashboard.css";
export const metadata={title:"Reset password | NSoul Studio"};
export default function ResetPasswordPage(){return <main className="auth-page"><div className="auth-theme-control"><span>Appearance</span><ThemeToggle /></div><section className="auth-card"><p className="finder-eyebrow">Account recovery</p><h1>Choose a new password</h1><p>Use at least 10 characters and a unique password.</p><ResetPasswordForm/></section></main>}
