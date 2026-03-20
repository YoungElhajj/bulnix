import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

export default function Signup() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[100px] pointer-events-none"/>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/"><img src={LOGO_URL} alt="Bulnix" className="h-10 w-auto mx-auto mb-4"/></Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of buyers on Bulnix</p>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-400 mb-6">Sign up quickly using your existing account. No password required.</p>
          <Button className="w-full h-12 bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold text-base" style={{boxShadow:"0 0 20px rgba(0,185,233,0.3)"}}
            onClick={() => { window.location.href = getLoginUrl(); }}>
            Create Free Account
          </Button>
          <p className="text-xs text-slate-500 mt-4">By signing up, you agree to our <Link href="/terms" className="text-[#00B9E9] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#00B9E9] hover:underline">Privacy Policy</Link></p>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">Already have an account? <Link href="/login" className="text-[#00B9E9] hover:underline font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
