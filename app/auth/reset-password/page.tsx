import { ResetPasswordForm } from "@/components/dashboard/reset-password-form";
import "@/app/dashboard/dashboard.css";
export const metadata={title:"Reset password | Cornerstone Site Finder"};
export default function ResetPasswordPage(){return <main className="auth-page"><section className="auth-card"><p className="finder-eyebrow">Account recovery</p><h1>Choose a new password</h1><p>Use at least 10 characters and a unique password.</p><ResetPasswordForm/></section></main>}
