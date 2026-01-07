import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function Login() {
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(location.state?.register || false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const url = isRegister
      ? `${backendURL}/api/auth/register`
      : `${backendURL}/api/auth/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message);

      if (!data.success) return;
      
      if (data.success) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("user_email", data.email);
      }

      // REGISTER → langsung ke verifikasi email
      if (isRegister) {
        window.location.href = "/email-verify";
        return;
      }

      // LOGIN → backend sudah kasih redirect yang benar
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      // fallback kalau backend lupa ngirim redirect
      window.location.href = "/home";
    } catch (err) {
      setMessage("Terjadi kesalahan, silakan coba lagi");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
    <img
      src="/loginhero.svg"
      alt="login hero"
      className="hidden md:block w-1/3 h-auto object-cover"
      />

      <form onSubmit={handleSubmit} className="w-full max-w space-y-4 m-24 p-4">

        <h1 className="text-4xl font-bold text-center">
          {isRegister ? "Daftar" : "Login"}
        </h1>

        {isRegister && (
          <input
            type="text"
            name="name"
            placeholder="Nama"
            value={form.name}
            onChange={handleChange}
            className="border p-4 w-full rounded-xl"
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-4 w-full rounded-xl"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Kata sandi"
            value={form.password}
            onChange={handleChange}
            className="border p-4 w-full rounded-xl"
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {!isRegister && (
          <p
            className="text-right text-green-700 cursor-pointer"
            onClick={() => (window.location.href = "/reset-password")}
          >
            Lupa password?
          </p>
        )}


        <button
          type="submit"
          className="w-full text-lg font-semibold bg-green-600 text-white py-4 rounded hover:bg-green-700 rounded-xl"
        >
          {isRegister ? "Daftar" : "Login"}
        </button>

        <p
          onClick={() => setIsRegister(!isRegister)}
          className="text-center font-semibold cursor-pointer"
        >
          {isRegister
            ? "Sudah punya akun? Login"
            : "Belum punya akun? Daftar"}
        </p>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-4 bg-emerald-50 py-2 rounded">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
