import { useState } from "react";

export default function Welcome() {
  const [nama, setNama] = useState("");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [emails, setEmails] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Buat workspace baru
  const buatWorkspace = async () => {
    if (!nama.trim()) {
      setMessage("Nama workspace tidak boleh kosong");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${backendURL}/api/ruangkerja/buat-ruangkerja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nama })
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Gagal membuat workspace");
        setLoading(false);
        return;
      }

      const id = data.data._id;
      setWorkspaceId(id);

      // set workspace sebagai aktif di backend
      await fetch(`${backendURL}/api/auth/workspace/set-aktif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workspace_id: id })
      });

    } catch (err) {
      console.error(err);
      setMessage("Terjadi kesalahan, silakan coba lagi");
    }

    setLoading(false);
  };

  const tambahEmailField = () => {
    setEmails([...emails, ""]);
  };

  const updateEmail = (value, index) => {
    const list = [...emails];
    list[index] = value;
    setEmails(list);
  };

  // Kirim undangan anggota
  const kirimUndangan = async () => {
    if (!workspaceId) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${backendURL}/api/ruangkerja/undang?ruangkerja_id=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails })
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Gagal mengirim undangan");
        setLoading(false);
        return;
      }

      window.location.href = "/home";
    } catch (err) {
      console.error(err);
      setMessage("Terjadi kesalahan, silakan coba lagi");
    }

    setLoading(false);
  };

  // Skip undangan
  const skipUndangan = async () => {
    window.location.href = "/home";
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">

      {message && <p className="text-red-600">{message}</p>}

      {!workspaceId ? (
        <>
          <h2 className="text-2xl font-bold">Buat Workspace</h2>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama workspace"
            className="border p-2 w-full rounded"
          />

          <button
            onClick={buatWorkspace}
            disabled={loading}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            {loading ? "Membuat..." : "Buat"}
          </button>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold">Tambah Anggota (Opsional)</h2>

          {emails.map((email, index) => (
            <input
              key={index}
              value={email}
              onChange={(e) => updateEmail(e.target.value, index)}
              placeholder="Email anggota"
              className="border p-2 w-full rounded mb-2"
            />
          ))}

          <div className="flex gap-2 mt-2">
            <button
              onClick={tambahEmailField}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Tambah Email
            </button>

            <button
              onClick={kirimUndangan}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {loading ? "Mengirim..." : "Kirim Undangan"}
            </button>

            <button
              onClick={skipUndangan}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Lewati
            </button>
          </div>
        </>
      )}

    </div>
  );
}
