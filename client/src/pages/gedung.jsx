import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";

export default function Gedung({ workspaceId }) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const workspaceName = localStorage.getItem("workspace_aktif_nama") || "";

  const [gedungList, setGedungList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [namaBangunan, setNamaBangunan] = useState("");
  const [editId, setEditId] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({ show: false, gedungId: null });

  const [popup, setPopup] = useState({ show: false, message: "", success: true });

  const fetchGedung = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendURL}/api/bangunan/list?ruangkerja_id=${workspaceId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setGedungList(data.data || []);
      else setGedungList([]);
    } catch {
      setGedungList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGedung();
  }, [workspaceId]);

  const simpanGedung = async () => {
    if (!namaBangunan.trim()) {
      setPopup({ show: true, message: "Nama gedung wajib diisi", success: false });
      return;
    }

    try {
      const url = editId
        ? `${backendURL}/api/bangunan/edit?bangunan_id=${editId}`
        : `${backendURL}/api/bangunan/buat?ruangkerja_id=${workspaceId}`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nama: namaBangunan }),
      });

      const data = await res.json();

      if (data.success) {
        setPopup({
          show: true,
          message: editId ? "Gedung berhasil diupdate!" : "Gedung berhasil ditambahkan!",
          success: true,
        });
        setModalOpen(false);
        setNamaBangunan("");
        setEditId(null);
        fetchGedung();
      } else {
        setPopup({ show: true, message: data.message || "Gagal menyimpan gedung", success: false });
      }
    } catch {
      setPopup({ show: true, message: "Kesalahan server saat menyimpan gedung", success: false });
    }
  };

  const hapusGedung = async () => {
    try {
      const res = await fetch(
        `${backendURL}/api/bangunan/hapus?bangunan_id=${confirmDelete.gedungId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setPopup({ show: true, message: "Gedung berhasil dihapus!", success: true });
        fetchGedung();
      } else {
        setPopup({ show: true, message: data.message || "Gagal menghapus gedung", success: false });
      }
    } catch {
      setPopup({ show: true, message: "Kesalahan server saat menghapus gedung", success: false });
    } finally {
      setConfirmDelete({ show: false, gedungId: null });
    }
  };

  const openEditModal = (gedung) => {
    setNamaBangunan(gedung.nama);
    setEditId(gedung._id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 relative">
      <h3 className="text-2xl font-bold">
        Daftar Gedung: <span className="text-green-600">{workspaceName}</span>
      </h3>

      {/* Kartu Tambah Gedung */}
      <div className="bg-white shadow rounded-lg w-[220px] py-3">
        <div className="bg-[#DAF2D0] rounded-t-lg px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-gray-700">GEDUNG</p>
          <h2 className="text-xl font-semibold break-words text-gray-900">{workspaceName}</h2>
        </div>

        <div className="flex justify-center px-3 py-4">
          <button
            onClick={() => { setModalOpen(true); setNamaBangunan(""); setEditId(null); }}
            className="bg-[#34C759] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2"
          >
            Tambah Gedung <FaPlus />
          </button>
        </div>
      </div>

      {/* Modal Tambah/Edit Gedung */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h4 className="text-lg font-semibold">{editId ? "Edit Gedung" : "Tambah Gedung"}</h4>
            <input
              value={namaBangunan}
              onChange={(e) => setNamaBangunan(e.target.value)}
              placeholder="Nama gedung"
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setModalOpen(false); setEditId(null); }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={simpanGedung}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel List Gedung */}
    <div className="bg-white p-4 shadow rounded overflow-x-auto">
    <h4 className="text-lg font-semibold mb-3">List Gedung</h4>
    {loading ? (
        <p>Memuat...</p>
    ) : gedungList.length === 0 ? (
        <p className="text-gray-600">Belum ada gedung.</p>
    ) : (
        <table className="min-w-full table-fixed border-collapse">
        <thead>
            <tr className="bg-gray-100">
            <th className="w-12 px-4 py-2 border">No</th>
            <th className="w-[60%] px-4 py-2 border">Nama Gedung</th>
            <th className="w-[10%] px-4 py-2 border">Aksi</th>
            </tr>
        </thead>
        <tbody>
            {gedungList.map((item, index) => (
            <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{index + 1}</td>
                <td className="px-4 py-2 border truncate" title={item.nama}>
                {item.nama}
                </td>
                <td className="px-4 py-2 border text-center">
                    <div className="inline-flex gap-2 justify-center">
                        <button
                        onClick={() => openEditModal(item)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center gap-1"
                        >
                        <FaEdit /> Edit
                        </button>
                        <button
                        onClick={() => setConfirmDelete({ show: true, gedungId: item._id })}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
                        >
                        <FaTrash /> Hapus
                        </button>
                    </div>
                    </td>

            </tr>
            ))}
        </tbody>
        </table>
    )}
    </div>


      {/* Modal Konfirmasi Hapus */}
      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white p-7 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow">
              <FaTrash className="text-white text-4xl" />
            </div>
            <p className="text-xl font-semibold text-center text-gray-700">
              Hapus Gedung?
            </p>
            <p className="text-center text-gray-500 text-sm px-4">
              Gedung ini akan dihapus permanen dari workspace.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete({ show: false, gedungId: null })}
                className="px-5 py-2 rounded-md bg-gray-300 hover:bg-gray-400 font-medium"
              >
                Batal
              </button>
              <button
                onClick={hapusGedung}
                className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Sukses/Gagal */}
      {popup.show && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md flex flex-col items-center space-y-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                popup.success ? "bg-green-500" : "bg-red-500"
              }`}
            >
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
