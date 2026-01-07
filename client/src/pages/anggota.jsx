import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa"; // icon sampah

export default function Anggota({ workspaceId }) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const currentUserId = localStorage.getItem("user_id");
  const workspaceName = localStorage.getItem("workspace_aktif_nama") || "";

  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(false);

  const [emails, setEmails] = useState([""]);
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [popup, setPopup] = useState({ show: false, message: "", success: true });
  const [confirmKick, setConfirmKick] = useState({ show: false, memberId: null });

  const fetchAnggota = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${backendURL}/api/ruangkerja/anggota?ruangkerja_id=${workspaceId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        const owner = data.data.find(a => a.role === "owner");
        if (owner) owner.user_id = currentUserId;
        setAnggota(data.data || []);
      } else {
        setAnggota([]);
      }
    } catch (err) {
      console.error(err);
      setAnggota([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnggota();
  }, [workspaceId]);

  const ownerObj = anggota.find(a => a.role === "owner");
  const isOwner = ownerObj && ownerObj.user_id === currentUserId;

  const tambahEmailField = () => setEmails((s) => [...s, ""]);
  const updateEmail = (value, idx) => setEmails((s) => s.map((v, i) => (i === idx ? value : v)));
  const resetEmails = () => setEmails([""]);

  const kirimUndangan = async () => {
    if (!workspaceId) return;

    const list = emails.map(e => e.trim()).filter(Boolean);
    if (list.length === 0) {
      alert("Isi minimal satu email");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch(`${backendURL}/api/ruangkerja/undang?ruangkerja_id=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json();
      if (data.success) {
        setPopup({ show: true, message: "Anggota berhasil diundang!", success: true });
        resetEmails();
        setShowInviteForm(false);
        await fetchAnggota();
      } else {
        setPopup({ show: true, message: data.message || "Gagal mengundang anggota", success: false });
      }
    } catch (err) {
      console.error(err);
      setPopup({ show: true, message: "Terjadi kesalahan saat mengundang", success: false });
    } finally {
      setInviting(false);
    }
  };

  const keluarkanAnggota = async (memberUserId) => {
    if (!memberUserId) return;
    

    try {
      const res = await fetch(
        `${backendURL}/api/ruangkerja/keluarkan?ruangkerja_id=${workspaceId}&user_target=${memberUserId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setPopup({ show: true, message: data.message || "Anggota berhasil dikeluarkan", success: true });
        fetchAnggota();
      } else {
        setPopup({ show: true, message: data.message || "Gagal mengeluarkan anggota", success: false });
      }
    } catch (err) {
      console.error(err);
      setPopup({ show: true, message: "Terjadi kesalahan saat mengeluarkan anggota", success: false });
    }
  };

  return (
    <div className="space-y-5 relative">
      <h3 className="text-2xl font-bold">
        Manajemen Anggota Ruang Kerja: <span className="text-green-600">{workspaceName}</span>
      </h3>

{isOwner && (
  <div className="flex justify-start">
    <div className="bg-white shadow rounded-lg w-[220px] py-3">

      {/* BAGIAN HEADER ANGGOTA */}
      <div className="bg-[#DAF2D0] rounded-t-lg px-4 py-3">
        <p className="text-[11px] font-semibold tracking-wide text-gray-700">
          ANGGOTA
        </p>

        {/* Nama workspace panjang -> wrap + kecil otomatis */}
        <h2 className="text-xl font-semibold leading-tight break-words text-gray-900">
          {workspaceName}
        </h2>
      </div>

      {/* TOMBOL */}
      <div className="flex justify-center px-3 py-4">
        <button
          onClick={() => setShowInviteForm(true)}
          className="bg-[#34C759] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2"
        >
          Tambah Anggota
          <span className="text-xl px-6">👤</span>
          
        </button>
      </div>

    </div>
  </div>
)}




      {showInviteForm && (
  <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/20 z-50">
    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
      <h4 className="font-semibold text-lg">Undang Anggota</h4>
      {emails.map((em, idx) => (
        <input
          key={idx}
          value={em}
          onChange={(e) => updateEmail(e.target.value, idx)}
          placeholder="Email anggota"
          className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      ))}

      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={tambahEmailField}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          Tambah Email
        </button>

        <button
          onClick={kirimUndangan}
          disabled={inviting}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {inviting ? "Mengirim..." : "Kirim Undangan"}
        </button>

        <button
          onClick={() => { resetEmails(); setShowInviteForm(false); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Lewati
        </button>
      </div>
    </div>
  </div>
)}


      <div className="bg-white p-4 shadow rounded">
        <h4 className="font-semibold text-lg mb-3">Daftar Anggota</h4>
        {loading ? (
          <p className="text-gray-600">Memuat anggota...</p>
        ) : anggota.length === 0 ? (
          <p className="text-gray-600">Belum ada anggota.</p>
        ) : (
          <ul className="space-y-2">
            {anggota.map((item) => (
              <li
                key={item.user_id || item.email}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <p className="font-medium">{item.nama || item.email}</p>
                  <p className="text-sm text-gray-500">Role: {item.role}</p>
                </div>

                {isOwner && item.role !== "owner" && (
                  <button
                    onClick={() => setConfirmKick({ show: true, memberId: item.user_id })}
                    className="bg-red-600 p-2 rounded hover:bg-red-700"
                  >
                    <FaTrash className="text-white" />
                  </button>

                )}
                {confirmKick.show && (
                    <div className="fixed inset-0 flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm z-50">

                      <div className="bg-white p-7 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center space-y-4">

                        {/* Icon */}
                        <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow">
                          <FaTrash className="text-white text-4xl" />
                        </div>

                        {/* Text */}
                        <p className="text-xl font-semibold text-center text-gray-700">
                          Keluarkan Anggota?
                        </p>
                        <p className="text-center text-gray-500 text-sm px-4">
                          Anggota ini akan dihapus dari workspace dan tidak dapat mengaksesnya lagi.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setConfirmKick({ show: false, memberId: null })}
                            className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 font-medium"
                          >
                            Batal
                          </button>

                          <button
                            onClick={() => {
                              const id = confirmKick.memberId;
                              setConfirmKick({ show: false, memberId: null });
                              keluarkanAnggota(id);
                            }}
                            className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium"
                          >
                            Ya, Keluarkan
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

              </li>
            ))}
          </ul>
        )}
      </div>

      {popup.show && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md flex flex-col items-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${popup.success ? "bg-green-500" : "bg-red-500"}`}>
              <span className="text-white text-3xl">{popup.success ? "✓" : "✕"}</span>
            </div>
            <div className="text-center text-lg font-medium">{popup.message}</div>
            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
