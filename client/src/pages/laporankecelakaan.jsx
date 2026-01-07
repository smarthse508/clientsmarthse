import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";

export default function LaporanKecelakaan({ workspaceId }) {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const workspaceName = localStorage.getItem("workspace_aktif_nama") || "";

  const [laporanList, setLaporanList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
  deskripsi_kejadian: "",
  lokasi: "",
  penyebab: "",
  tingkat_resiko: "",
  jenis_cedera: "",
  pertolongan_pertama: "",
  nama_petugas: "",
  pencegahan_ke_depan: "",
});
const opsiResiko = [
  "Insignificant",
  "Minor",
  "Moderate",
  "Major",
  "Fatal",
];

const [foto, setFoto] = useState(null);
const [showDetail, setShowDetail] = useState(false); // ⬅️ toggle detail tambahan


  const [confirmDelete, setConfirmDelete] = useState({ show: false, laporanId: null });
  const [popup, setPopup] = useState({ show: false, message: "", success: true });

  /* ================= FETCH ================= */
  const fetchLaporan = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${backendURL}/api/laporankecelakaan/list?ruangkerja_id=${workspaceId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setLaporanList(data.data || []);
      else setLaporanList([]);
    } catch {
      setLaporanList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [workspaceId]);

  /* ================= SIMPAN ================= */
  const simpanLaporan = async () => {
    if (!form.deskripsi_kejadian.trim()) {
      setPopup({ show: true, message: "Deskripsi kejadian wajib diisi", success: false });
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (foto) fd.append("foto", foto);

    try {
      const url = editId
        ? `${backendURL}/api/laporankecelakaan/edit?laporan_id=${editId}`
        : `${backendURL}/api/laporankecelakaan/tambah?ruangkerja_id=${workspaceId}`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setPopup({
          show: true,
          message: editId ? "Laporan berhasil diperbarui!" : "Laporan berhasil ditambahkan!",
          success: true,
        });
        setModalOpen(false);
        setEditId(null);
        setForm({ lokasi: "", deskripsi_kejadian: "", penyebab: "", tingkat_resiko: "" });
        setFoto(null);
        fetchLaporan();
      } else {
        setPopup({ show: true, message: data.message || "Gagal menyimpan laporan", success: false });
      }
    } catch {
      setPopup({ show: true, message: "Kesalahan server saat menyimpan laporan", success: false });
    }
  };

  /* ================= HAPUS ================= */
  const hapusLaporan = async () => {
    try {
      const res = await fetch(
        `${backendURL}/api/laporankecelakaan/hapus?laporan_id=${confirmDelete.laporanId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setPopup({ show: true, message: "Laporan berhasil dihapus!", success: true });
        fetchLaporan();
      } else {
        setPopup({ show: true, message: data.message || "Gagal menghapus laporan", success: false });
      }
    } catch {
      setPopup({ show: true, message: "Kesalahan server saat menghapus laporan", success: false });
    } finally {
      setConfirmDelete({ show: false, laporanId: null });
    }
  };

  const openEditModal = (item) => {
    setForm({
      lokasi: item.lokasi || "",
      deskripsi_kejadian: item.deskripsi_kejadian || "",
      penyebab: item.penyebab || "",
      tingkat_resiko: item.tingkat_resiko || "",
    });
    setEditId(item._id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5 relative">
      <h3 className="text-2xl font-bold">
        Laporan Kecelakaan: <span className="text-green-600">{workspaceName}</span>
      </h3>

      {/* Kartu Tambah */}
      <div className="bg-white shadow rounded-lg w-[260px] py-3">
        <div className="bg-[#DAF2D0] rounded-t-lg px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-gray-700">
            LAPORAN KECELAKAAN
          </p>
          <h2 className="text-lg font-semibold text-gray-900">{workspaceName}</h2>
        </div>

        <div className="flex justify-center px-3 py-4">
          <button
            onClick={() => {
              setModalOpen(true);
              setEditId(null);
              setForm({ lokasi: "", deskripsi_kejadian: "", penyebab: "", tingkat_resiko: "" });
              setFoto(null);
            }}
            className="bg-[#34C759] text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2"
          >
            Tambah Laporan <FaPlus />
          </button>
        </div>
      </div>

      {/* ================= TABEL ================= */}
      <div className="bg-white p-4 shadow rounded overflow-x-auto">
        <h4 className="text-lg font-semibold mb-3">List Laporan</h4>

        {loading ? (
          <p>Memuat...</p>
        ) : laporanList.length === 0 ? (
          <p className="text-gray-600">Belum ada laporan.</p>
        ) : (
          <table className="min-w-full table-fixed border-collapse">
            <thead>
            <tr className="bg-gray-100 text-sm">
                <th className="px-2 py-2 border w-10">No</th>
                <th className="px-2 py-2 border w-20">Foto</th>
                <th className="px-2 py-2 border">Deskripsi</th>
                <th className="px-2 py-2 border">Lokasi</th>
                <th className="px-2 py-2 border">Cedera</th>
                <th className="px-2 py-2 border">P3K</th>
                <th className="px-2 py-2 border">Petugas</th>
                <th className="px-2 py-2 border">Resiko</th>
                <th className="px-2 py-2 border">Pencegahan</th>
                <th className="px-2 py-2 border w-32">Aksi</th>
            </tr>
            </thead>

            <tbody>
            {laporanList.map((item, i) => (
                <tr key={item._id} className="hover:bg-gray-50 text-sm align-top">
                <td className="px-2 py-2 border text-center">{i + 1}</td>

                {/* FOTO */}
                <td className="px-2 py-2 border">
                    {item.foto ? (
                    <img
                        src={`${backendURL}${item.foto}`}
                        alt="foto kejadian"
                        className="w-16 h-16 object-cover rounded"
                        />

                    ) : (
                    <span className="text-gray-400 italic">Tidak ada</span>
                    )}
                </td>
                
                <td className="px-2 py-2 border">{item.deskripsi_kejadian}</td>
                <td className="px-2 py-2 border">{item.lokasi || "-"}</td>
                <td className="px-2 py-2 border">{item.jenis_cedera || "-"}</td>
                <td className="px-2 py-2 border">{item.pertolongan_pertama || "-"}</td>
                <td className="px-2 py-2 border">{item.nama_petugas || "-"}</td>

                {/* RESIKO */}
                <td className="px-2 py-2 border text-center font-semibold">
                    {item.tingkat_resiko || "-"}
                </td>

                <td className="px-2 py-2 border">
                    {item.pencegahan_ke_depan || "-"}
                </td>

                {/* AKSI */}
                <td className="px-2 py-2 border text-center">
                    <div className="flex flex-col gap-1">
                    <button
                        onClick={() => openEditModal(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center"
                    >
                        <FaEdit /> Edit
                    </button>
                    <button
                        onClick={() =>
                        setConfirmDelete({ show: true, laporanId: item._id })
                        }
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 justify-center"
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

      {/* ================= MODAL TAMBAH / EDIT ================= */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-md flex flex-col max-h-[85vh]">
            <h4 className="text-lg font-semibold">
              {editId ? "Edit Laporan" : "Tambah Laporan"}
            </h4>
            <div className="p-6 space-y-4 overflow-y-auto">
            {/* FOTO */}
            <div className="space-y-2">
                <label className="text-sm font-semibold">Foto Kejadian *</label>
                <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setFoto(e.target.files[0])}
                className="w-full border rounded p-2"
                />
            </div>

            {/* DESKRIPSI */}
            <div className="space-y-2">
                <label className="text-sm font-semibold">Deskripsi Kejadian *</label>
                <textarea
                value={form.deskripsi_kejadian}
                onChange={(e) =>
                    setForm({ ...form, deskripsi_kejadian: e.target.value })
                }
                className="w-full border rounded p-2 min-h-[100px]"
                placeholder="Jelaskan kronologi kejadian"
                />
            </div>

            {/* TOGGLE DETAIL */}
            <button
                type="button"
                onClick={() => setShowDetail(!showDetail)}
                className="text-green-600 text-sm font-medium hover:underline"
            >
                {showDetail ? "Tutup Detail Tambahan ▲" : "Detail Tambahan ▼"}
            </button>

            {/* DETAIL TAMBAHAN */}
            {showDetail && (
            <div className="grid grid-cols-1 gap-2 mt-2">
                <input
                placeholder="Lokasi"
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                className="border rounded p-2"
                />

                <input
                placeholder="Penyebab"
                value={form.penyebab}
                onChange={(e) => setForm({ ...form, penyebab: e.target.value })}
                className="border rounded p-2"
                />

                <select
                  value={form.tingkat_resiko}
                  onChange={(e) =>
                    setForm({ ...form, tingkat_resiko: e.target.value })
                  }
                  className="border rounded p-2 bg-white"
                >
                  <option value="">Pilih Tingkat Resiko</option>
                  {opsiResiko.map((resiko) => (
                    <option key={resiko} value={resiko}>
                      {resiko}
                    </option>
                  ))}
                </select>


                <input
                placeholder="Jenis Cedera"
                value={form.jenis_cedera}
                onChange={(e) =>
                    setForm({ ...form, jenis_cedera: e.target.value })
                }
                className="border rounded p-2"
                />

                <input
                placeholder="Pertolongan Pertama"
                value={form.pertolongan_pertama}
                onChange={(e) =>
                    setForm({ ...form, pertolongan_pertama: e.target.value })
                }
                className="border rounded p-2"
                />

                <input
                placeholder="Nama Petugas"
                value={form.nama_petugas}
                onChange={(e) =>
                    setForm({ ...form, nama_petugas: e.target.value })
                }
                className="border rounded p-2"
                />

                <input
                placeholder="Pencegahan Ke Depan"
                value={form.pencegahan_ke_depan}
                onChange={(e) =>
                    setForm({ ...form, pencegahan_ke_depan: e.target.value })
                }
                className="border rounded p-2"
                />
            </div>
            )}

            </div>


            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={simpanLaporan}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL HAPUS ================= */}
      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/20 z-50">
          <div className="bg-white p-7 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center">
              <FaTrash className="text-white text-4xl" />
            </div>
            <p className="text-xl font-semibold">Hapus Laporan?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete({ show: false, laporanId: null })}
                className="bg-gray-300 px-5 py-2 rounded"
              >
                Batal
              </button>
              <button
                onClick={hapusLaporan}
                className="bg-red-600 text-white px-5 py-2 rounded"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP ================= */}
      {popup.show && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50">
          <div className="bg-white p-6 rounded shadow-lg flex flex-col items-center space-y-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                popup.success ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <span className="text-white text-3xl">
                {popup.success ? "✓" : "✕"}
              </span>
            </div>
            <p className="text-lg">{popup.message}</p>
            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
