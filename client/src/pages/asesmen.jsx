import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { FaPrint } from "react-icons/fa"; // icon print

function Asesmen({ workspaceId }) {
  const [bangunanList, setBangunanList] = useState([]);
  const [selectedBangunan, setSelectedBangunan] = useState(null);
  const [asesmenList, setAsesmenList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", success: false });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, asesmenId: null });
  const [editForm, setEditForm] = useState({ show: false, asesmen: null });
  const [filterTanggal, setFilterTanggal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [asesmenListAll, setAsesmenListAll] = useState([]);

  const [formData, setFormData] = useState({
    jenis_pekerjaan: "",
    jenis_bahaya: "",
    cause_effect: "",
    likelihood: "",
    severity: "",
    risk: "",
    level: "",
    impact: "",
    danger: "",
    prevensi: ""
  });

  const resetForm = () => {
    setFormData({
      jenis_pekerjaan: "",
      jenis_bahaya: "",
      cause_effect: "",
      likelihood: "",
      severity: "",
      risk: "",
      level: "",
      impact: "",
      danger: "",
      prevensi: ""
    });
  };

  useEffect(() => {
    if (!workspaceId) return;
    const fetchBangunan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5454/api/bangunan/list?ruangkerja_id=${workspaceId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setBangunanList(data.data || []);
      } catch {
        console.log("Gagal mengambil data bangunan");
      }
      setLoading(false);
    };
    fetchBangunan();
  }, [workspaceId]);

  const fetchAsesmen = async (bangunanId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5454/api/asesmen/list?bangunan_id=${bangunanId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setAsesmenListAll(data.data || []);  // simpan semua
        setAsesmenList(data.data || []);     // dan yang ditampilkan
      }
    } catch {
      console.log("Gagal mengambil data asesmen");
      setAsesmenListAll([]);
      setAsesmenList([]);
    }
    setLoading(false);
  };


 const handleUpdateAsesmen = async (e) => {
  e.preventDefault();
  if (!editForm?.asesmen?._id) {
    setPopup({ show: true, message: "Tidak ada asesmen yang dipilih untuk diedit", success: false });
    return;
  }

  try {
    // buat payload tanpa field yang bikin masalah
    const payload = { ...formData };
    delete payload._id;
    delete payload.dibuat_oleh;
    delete payload.tanggal_dibuat;

    const res = await fetch(
      `http://localhost:5454/api/asesmen/edit?asesmen_id=${editForm.asesmen._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (data.success) {
      setPopup({ show: true, message: "Perubahan disimpan", success: true });
      setEditForm({ show: false, asesmen: null });
      resetForm();
      fetchAsesmen(selectedBangunan._id);
      // pastikan juga menutup modal add (safety)
      setShowAddForm(false);
    } else {
      setPopup({ show: true, message: data.message || "Gagal menyimpan perubahan", success: false });
    }
  } catch (err) {
    // log ringan supaya bisa debugging tanpa nangis
    console.error("handleUpdateAsesmen error:", err);
    setPopup({ show: true, message: "Kesalahan server saat menyimpan perubahan", success: false });
  }
};

  const handleDeleteAsesmen = async () => {
    try {
      const res = await fetch(
        `http://localhost:5454/api/asesmen/hapus?asesmen_id=${confirmDelete.asesmenId}`,
        { method: "DELETE", credentials: "include" }
      );

      const data = await res.json();
      if (data.success) {
        fetchAsesmen(selectedBangunan._id);
        setPopup({ show: true, message: "Asesmen berhasil dihapus", success: true });
      } else {
        setPopup({ show: true, message: data.message, success: false });
      }
    } catch {
      setPopup({ show: true, message: "Gagal menghapus asesmen", success: false });
    } finally {
      setConfirmDelete({ show: false, asesmenId: null });
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData };
    const levelMap = {
      "1": { text: "Rare", likelihood: 1 },
      "2": { text: "Unlikely", likelihood: 2 },
      "3": { text: "Possible", likelihood: 3 },
      "4": { text: "Likely", likelihood: 4 },
      "5": { text: "Almost Certain", likelihood: 5 },
    };
    const impactMap = {
      "1": { text: "Insignificant", severity: 1 },
      "2": { text: "Minor", severity: 2 },
      "3": { text: "Moderate", severity: 3 },
      "4": { text: "Major", severity: 4 },
      "5": { text: "Fatal", severity: 5 },
    };

    if (field === "level" && value in levelMap) {
      newData.level = value;
      newData.likelihood = levelMap[value].likelihood;
    } else if (field === "impact" && value in impactMap) {
      newData.impact = value;
      newData.severity = impactMap[value].severity;
    } else newData[field] = value;

    const likelihood = Number(newData.likelihood) || 0;
    const severity = Number(newData.severity) || 0;
    const risk = likelihood * severity;
    newData.risk = risk;
    newData.danger = risk >= 15 ? "High" : risk >= 5 ? "Medium" : "Low";

    setFormData(newData);
  };

  const handleSubmitAsesmen = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5454/api/asesmen/tambah?bangunan_id=${selectedBangunan._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (data.success) {
        setPopup({ show: true, message: "Asesmen berhasil ditambahkan", success: true });
        setShowAddForm(false);
        resetForm();
        fetchAsesmen(selectedBangunan._id);
      } else {
        setPopup({ show: true, message: data.message || "Gagal menambah asesmen", success: false });
      }
    } catch {
      setPopup({ show: true, message: "Kesalahan server", success: false });
    }
  };

 const handleExportPDF = () => {
    if (!selectedBangunan) return;

    const doc = new jsPDF("p", "pt", "a4");

    // --- Tentukan tanggal untuk judul ---
    let dateText = "";
    if (filterTanggal) {
      dateText = new Date(filterTanggal).toLocaleDateString();
    } else if (asesmenListAll.length) {
      const firstDate = new Date(Math.min(...asesmenListAll.map(a => new Date(a.tanggal_dibuat))));
      const lastDate = new Date(Math.max(...asesmenListAll.map(a => new Date(a.tanggal_dibuat))));
      dateText = `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`;
    }

    // --- Judul PDF ---
    const ruangKerjaName = bangunanList.find(b => b._id === selectedBangunan._id)?.ruangKerjaNama || "RUANGKERJA";
    const title = `ASESMEN - ${selectedBangunan.nama.toUpperCase()} - ${ruangKerjaName.toUpperCase()} - ${dateText}`;

    // Cetak judul di PDF, tebal dan capslock
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 40, 40);

    // --- Table ---
    const tableColumn = [
      "No", "Jenis Pekerjaan", "Jenis Bahaya", "Cause & Effect", 
      "Likelihood", "Severity", "Risk", "Level", "Impact", "Danger", "Prevensi", "Tanggal"
    ];

    const tableRows = asesmenList.map((a, i) => [
      i + 1,
      a.jenis_pekerjaan,
      a.jenis_bahaya,
      a.cause_effect,
      a.likelihood,
      a.severity,
      a.risk,
      a.level,
      a.impact,
      a.danger,
      a.prevensi,
      new Date(a.tanggal_dibuat).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70, // kasih jarak sedikit dari judul
      styles: { fontSize: 8, cellWidth: "wrap" },
      headStyles: { fillColor: [220, 220, 220] }
    });

    doc.save(`${title}.pdf`);
  };



  return (
    
    <div className="min-h-screen bg-gray-100 p-8">
              {/* Floating Export Button */}
        <button
          onClick={handleExportPDF}
          className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full p-4 hover:bg-gray-100 flex items-center justify-center z-50"
          title="Export ke PDF"
        >
          <FaPrint className="text-xl text-gray-700" />
        </button>
      <h1 className="text-3xl font-bold text-center mb-6">📝 Isi Asesmen</h1>

      {bangunanList.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {/* Dropdown Bangunan */}
          <select
            className="border rounded-lg p-2 w-64 bg-white"
            value={selectedBangunan?._id || ""}
            onChange={(e) => {
              const b = bangunanList.find(x => x._id === e.target.value);
              setSelectedBangunan(b);
              fetchAsesmen(e.target.value);
              resetForm();
            }}
          >
            <option value="">-- Pilih Bangunan --</option>
            {bangunanList.map((b) => (
              <option key={b._id} value={b._id}>{b.nama}</option>
            ))}
          </select>

          {/* Filter Tanggal */}
          {/* Filter Tanggal */}
          <input
            type="date"
            className="border rounded-lg p-2"
            value={filterTanggal}
            onChange={(e) => {
              const date = e.target.value;
              setFilterTanggal(date);
              let filtered = asesmenListAll; // selalu mulai dari data lengkap
              if (date) {
                filtered = filtered.filter(a =>
                  new Date(a.tanggal_dibuat).toLocaleDateString() === new Date(date).toLocaleDateString()
                );
              }
              setAsesmenList(filtered);
            }}
          />


          {/* Pencarian */}
          <input
            type="text"
            placeholder="Cari jenis pekerjaan atau bahaya..."
            className="border rounded-lg p-2 flex-1 min-w-[200px]"
            onChange={(e) => {
              const keyword = e.target.value.toLowerCase();
              let filtered = asesmenListAll; // selalu mulai dari data lengkap
              if (keyword) {
                filtered = filtered.filter(a =>
                  a.jenis_pekerjaan.toLowerCase().includes(keyword) ||
                  a.jenis_bahaya.toLowerCase().includes(keyword)
                );
              }
              setAsesmenList(filtered);
            }}
          />

        </div>
        
      )}


      {selectedBangunan && (
        <section className="mt-8">
          <div className="flex justify-between mb-3">
            <h2 className="text-xl font-semibold">Asesmen - {selectedBangunan.nama}</h2>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                setEditForm({ show: false, asesmen: null });
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Tambah Asesmen
            </button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full border table-fixed">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2 w-12">No</th>
                <th className="border p-2 w-48">Jenis Pekerjaan</th>
                <th className="border p-2 w-48">Jenis Bahaya</th>
                <th className="border p-2 w-48">Cause & Effect</th>
                <th className="border p-2 w-23">Likelihood</th>
                <th className="border p-2 w-20">Severity</th>
                <th className="border p-2 w-20">Risk</th>
                <th className="border p-2 w-20">Level</th>
                <th className="border p-2 w-20">Impact</th>
                <th className="border p-2 w-24">Danger</th>
                <th className="border p-2 w-48">Prevensi</th>
                <th className="border p-2 w-28">Tanggal</th>
                <th className="border p-2 w-40">Aksi</th>
              </tr>
            </thead>

              <tbody>
                {asesmenList.map((a, index) => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td className="border p-2 truncate" title={a.jenis_pekerjaan}>{a.jenis_pekerjaan}</td>
                    <td className="border p-2 truncate" title={a.jenis_bahaya}>{a.jenis_bahaya}</td>
                    <td className="border p-2 truncate" title={a.cause_effect}>{a.cause_effect}</td>
                    <td className="border p-2 text-center">{a.likelihood}</td>
                    <td className="border p-2 text-center">{a.severity}</td>
                    <td className="border p-2 text-center">{a.risk}</td>
                    <td className="border p-2 text-center">{a.level}</td>
                    <td className="border p-2 text-center">{a.impact}</td>
                    <td className="border p-2 text-center">{a.danger}</td>
                    <td className="border p-2 truncate" title={a.prevensi}>{a.prevensi}</td>
                    <td className="border p-2 text-center">{new Date(a.tanggal_dibuat).toLocaleDateString()}</td>
                    <td className="border p-2 text-center space-x-2">
                      <button
                        onClick={() => {
                          const { _id, tanggal_dibuat, ...editable } = a;
                          setFormData(editable);
                          setEditForm({ show: true, asesmen: a });
                          setShowAddForm(false);
                        }}
                        className="px-2 py-1 bg-yellow-500 text-white rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ show: true, asesmenId: a._id })}
                        className="px-2 py-1 bg-red-600 text-white rounded-md"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </section>
      )}

      {(showAddForm || editForm.show) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start pt-10 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Tambah Asesmen</h2>
            <form
              onSubmit={editForm.show ? handleUpdateAsesmen : handleSubmitAsesmen}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input className="border p-2 rounded-lg" required placeholder="Jenis Pekerjaan"
                value={formData.jenis_pekerjaan} onChange={(e) => handleChange("jenis_pekerjaan", e.target.value)}
              />
              <input className="border p-2 rounded-lg" required placeholder="Jenis Bahaya"
                value={formData.jenis_bahaya} onChange={(e) => handleChange("jenis_bahaya", e.target.value)}
              />
              <textarea className="col-span-2 border rounded-lg p-2" placeholder="Cause & Effect"
                value={formData.cause_effect} onChange={(e) => handleChange("cause_effect", e.target.value)}
              />
              <select className="border p-2 rounded-lg bg-white"
                value={formData.level} onChange={(e) => handleChange("level", e.target.value)}
              >
                <option value="">Pilih Level</option>
                <option value="1">1 - Rare</option>
                <option value="2">2 - Unlikely</option>
                <option value="3">3 - Possible</option>
                <option value="4">4 - Likely</option>
                <option value="5">5 - Almost Certain</option>
              </select>
              <select className="border p-2 rounded-lg bg-white"
                value={formData.impact} onChange={(e) => handleChange("impact", e.target.value)}
              >
                <option value="">Pilih Impact</option>
                <option value="1">1 - Insignificant</option>
                <option value="2">2 - Minor</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Major</option>
                <option value="5">5 - Fatal</option>
              </select>
              <input className="border p-2 rounded-lg bg-gray-200" readOnly value={formData.risk} placeholder="Risk" />
              <input className="border p-2 rounded-lg bg-gray-200" readOnly value={formData.danger} placeholder="Danger" />
              <textarea className="col-span-2 border rounded-lg p-2" placeholder="Prevansi"
                value={formData.prevensi} onChange={(e) => handleChange("prevensi", e.target.value)}
              />
              <div className="col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => {
                  setShowAddForm(false);
                  setEditForm({ show: false, asesmen: null });
                  resetForm();
                }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Batal
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editForm.show ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl space-y-4 text-center max-w-sm w-full">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-3xl ${popup.success ? "bg-green-500" : "bg-red-500"}`}>
              {popup.success ? "✓" : "✕"}
            </div>
            <p className="text-lg font-medium">{popup.message}</p>
            <button
              onClick={() => setPopup({ ...popup, show: false })}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {confirmDelete.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500 flex items-center justify-center text-white text-4xl">
              🗑
            </div>
            <p className="text-lg font-semibold">Hapus asesmen?</p>
            <p className="text-sm text-gray-600 px-3">Data asesmen ini akan hilang secara permanen.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete({ show: false, asesmenId: null })}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAsesmen}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    
  );
}

export default Asesmen;
