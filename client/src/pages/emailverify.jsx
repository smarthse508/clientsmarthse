import { useState } from "react";

export default function EmailVerify() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${backendURL}/api/auth/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();
      setMessage(data.message);
      setLoading(false);

      if (!data.success) return;

      // setelah verifikasi cek workspace user
      const wsRes = await fetch(`${backendURL}/api/ruangkerja/list-ruangkerja`, {
        method: "GET",
        credentials: "include",
      });

      const wsData = await wsRes.json();

      if (wsData.success && wsData.data.length > 0) {
        // set workspace pertama sebagai aktif
        const ws = wsData.data[0];
        localStorage.setItem("workspace_aktif", ws._id);
        localStorage.setItem("workspace_aktif_nama", ws.nama);
        window.location.href = "/home";
      } else {
        // belum punya workspace
        window.location.href = "/welcome";
      }
    } catch {
      setMessage("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${backendURL}/api/auth/send-verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();
      setMessage(data.message);
      setResendLoading(false);
    } catch {
      setMessage("Gagal mengirim ulang OTP.");
      setResendLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center">
    <img
      src="/loginhero.svg"
      alt="Verify Hero"
      className="hidden md:block w-1/3 h-auto object-cover"
    />

    <div className="w-full max-w m-24 p-4 space-y-6">
      <h1 className="text-4xl font-bold text-center text-emerald-700">
        Verifikasi Email
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-center text-gray-700">
          Masukkan kode OTP yang telah dikirim ke email kamu.
        </p>

        <input
          type="text"
          placeholder="Masukkan kode OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="border p-4 w-full rounded-xl text-center tracking-widest text-lg"
        />

        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendLoading}
          className="text-green-600 underline text-sm"
        >
          {resendLoading ? "Mengirim ulang..." : "Kirim ulang kode"}
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => (window.location.href = "/login")}
            className="w-1/2 bg-gray-300 py-3 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-1/2 bg-green-600 text-white py-3 rounded-xl"
          >
            {loading ? "Memverifikasi..." : "Lanjutkan"}
          </button>
        </div>
      </form>

      {message && (
        <p className="text-center text-sm text-green-600 bg-green-50 py-2 rounded">
          {message}
        </p>
      )}
    </div>
  </div>
);

}
