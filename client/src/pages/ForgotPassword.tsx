import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-10 w-auto mx-auto mb-8"/></Link>
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-3">Reset Password</h1>
          <p className="text-slate-400 mb-6">Password reset is handled through our secure OAuth provider. Click below to access your account.</p>
          <Button className="w-full h-11 bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold" onClick={() => { window.location.href = getLoginUrl(); }}>
            Sign In with OAuth
          </Button>
        </div>
        <Link href="/login" className="text-sm text-slate-500 hover:text-[#00B9E9] mt-4 block">Back to Sign In</Link>
      </div>
    </div>
  );
}
