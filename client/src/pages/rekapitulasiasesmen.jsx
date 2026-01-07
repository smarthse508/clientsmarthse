import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaPrint } from "react-icons/fa";

function RekapitulasiAsesmen({ workspaceId }) {
  const [bangunanList, setBangunanList] = useState([]);
  const [selectedBangunan, setSelectedBangunan] = useState(null);
  const [asesmenList, setAsesmenList] = useState([]);
  const [asesmenAll, setAsesmenAll] = useState([]);
  const [filterTanggal, setFilterTanggal] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAsesmen, setEditAsesmen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

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
    prevensi: "",
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
      prevensi: "",
    });
  };
  const handleChange = (field, value) => {
  const newData = { ...formData };

  const levelMap = {
    "1": { likelihood: 1 },
    "2": { likelihood: 2 },
    "3": { likelihood: 3 },
    "4": { likelihood: 4 },
    "5": { likelihood: 5 },
  };

  const impactMap = {
    "1": { severity: 1 },
    "2": { severity: 2 },
    "3": { severity: 3 },
    "4": { severity: 4 },
    "5": { severity: 5 },
  };

  if (field === "level" && levelMap[value]) {
    newData.level = value;
    newData.likelihood = levelMap[value].likelihood;
  } else if (field === "impact" && impactMap[value]) {
    newData.impact = value;
    newData.severity = impactMap[value].severity;
  } else {
    newData[field] = value;
  }

  const likelihood = Number(newData.likelihood) || 0;
  const severity = Number(newData.severity) || 0;

  newData.risk = likelihood * severity;
  newData.danger =
    newData.risk >= 15 ? "High" :
    newData.risk >= 5 ? "Medium" : "Low";

  setFormData(newData);
};
const handleUpdateAsesmen = async (e) => {
  e.preventDefault();
  if (!editAsesmen?._id) return;

  const payload = { ...formData };
  delete payload._id;
  delete payload.tanggal_dibuat;
  delete payload.dibuat_oleh;

  const res = await fetch(
    `http://localhost:5454/api/asesmen/edit?asesmen_id=${editAsesmen._id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  if (data.success) {
    fetchAsesmen(selectedBangunan._id);
    setShowForm(false);
    setEditAsesmen(null);
    resetForm();
  } else {
    alert(data.message || "Gagal update asesmen");
  }
};
const handleDeleteAsesmen = async () => {
  const res = await fetch(
    `http://localhost:5454/api/asesmen/hapus?asesmen_id=${confirmDelete.id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const data = await res.json();
  if (data.success) {
    fetchAsesmen(selectedBangunan._id);
  } else {
    alert(data.message || "Gagal hapus asesmen");
  }

  setConfirmDelete({ show: false, id: null });
};

  /* ======================
     FETCH BANGUNAN
  ====================== */
  useEffect(() => {
    if (!workspaceId) return;

    fetch(`http://localhost:5454/api/bangunan/list?ruangkerja_id=${workspaceId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setBangunanList(data.data || []);
      });
  }, [workspaceId]);

  /* ======================
     FETCH ASESMEN
  ====================== */
  const fetchAsesmen = async (bangunanId) => {
    const res = await fetch(
      `http://localhost:5454/api/asesmen/list?bangunan_id=${bangunanId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    if (data.success) {
      setAsesmenAll(data.data);
      setAsesmenList(data.data);
    }
  };

  /* ======================
     FILTER & SEARCH
  ====================== */
  const [filterMode, setFilterMode] = useState("date");
// "date" | "month" | "year"

  const sameDate = (a, b) =>
  new Date(a).toISOString().slice(0, 10) ===
  new Date(b).toISOString().slice(0, 10);

  useEffect(() => {
  let filtered = asesmenAll;

  if (filterTanggal) {
    filtered = filtered.filter(a => {
      if (!a.tanggal_dibuat) return false;

      const d = new Date(a.tanggal_dibuat);

      if (filterMode === "date") {
        return d.toISOString().slice(0, 10) === filterTanggal;
      }

      if (filterMode === "month") {
        const [year, month] = filterTanggal.split("-");
        return (
          d.getFullYear() === Number(year) &&
          d.getMonth() + 1 === Number(month)
        );
      }

      if (filterMode === "year") {
        return d.getFullYear() === Number(filterTanggal);
      }

      return true;
    });
  }

  if (search) {
    filtered = filtered.filter(a =>
      a.jenis_pekerjaan.toLowerCase().includes(search.toLowerCase()) ||
      a.jenis_bahaya.toLowerCase().includes(search.toLowerCase())
    );
  }

  setAsesmenList(filtered);
}, [filterTanggal, filterMode, search, asesmenAll]);

  /* ======================
     EXPORT PDF
  ====================== */
// ================================
// FUNGSI CETAK PDF (GANTI INI)
// ================================
const getPeriodeLaporan = (data) => {
  if (!data || !data.length) return "PERIODE -";

  const dates = data
    .filter(a => a.tanggal_dibuat)
    .map(a => new Date(a.tanggal_dibuat))
    .sort((a, b) => a - b);

  const start = dates[0];
  const end = dates[dates.length - 1];

  const startMonth = start.toLocaleString("id-ID", { month: "long" }).toUpperCase();
  const startYear = start.getFullYear();

  const endMonth = end.toLocaleString("id-ID", { month: "long" }).toUpperCase();
  const endYear = end.getFullYear();

  if (
    start.getMonth() === end.getMonth() &&
    startYear === endYear
  ) {
    return `BULAN ${startMonth} TAHUN ${startYear}`;
  }

  if (startYear === endYear) {
    return `PERIODE ${startMonth} – ${endMonth} ${startYear}`;
  }

  return `PERIODE ${startMonth} ${startYear} – ${endMonth} ${endYear}`;
};

const safeFileText = (text) =>
  text
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_");

const handleExportPDF = () => {
  if (!selectedBangunan || !asesmenList.length) return;

  const doc = new jsPDF("p", "pt", "a4");
  let y = 40;

  const periode = getPeriodeLaporan(asesmenList);

  // ===== JUDUL =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    `LAPORAN ASSESSMENT K3L GEDUNG ${selectedBangunan.nama.toUpperCase()}`,
    297,
    y,
    { align: "center" }
  );

  y += 18;

  doc.setFontSize(12);
  doc.text(periode, 297, y, { align: "center" });

  y += 30;

  // ===== KETERANGAN UMUM =====
  doc.setFontSize(11);
  doc.text("a. Keterangan Umum", 40, y);
  y += 15;

  doc.text(
    `Nama pembuat assessment : ${asesmenList[0]?.dibuat_oleh?.nama || "-"}`,
    50,
    y
  );

  y += 15;
  doc.text(`Tempat : ${selectedBangunan.nama}`, 50, y);

  y += 25;

  // ===== TABEL =====
  doc.text("b. Keselamatan Kerja", 40, y);
  y += 15;
  doc.text("b1. Identifikasi Bahaya", 50, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Jenis Pekerjaan", "Jenis Bahaya", "Cause & Effect", "Tanggal"]],
    body: asesmenList.map(a => [
      a.jenis_pekerjaan,
      a.jenis_bahaya,
      a.cause_effect,
      new Date(a.tanggal_dibuat).toLocaleDateString("id-ID")
    ]),
    styles: { fontSize: 9 }
  });

  y = doc.lastAutoTable.finalY + 20;

  doc.text("b2. Kecelakaan / Insiden Kerja", 50, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["No", "Severity", "Likelihood", "Danger", "Tanggal"]],
    body: asesmenList.map((a, i) => [
      i + 1,
      a.severity,
      a.likelihood,
      a.danger,
      new Date(a.tanggal_dibuat).toLocaleDateString("id-ID")
    ]),
    styles: { fontSize: 9 }
  });

  y = doc.lastAutoTable.finalY + 20;

  doc.text("b3. Tindakan Pencegahan Kecelakaan", 50, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["No", "Jenis Bahaya", "Prevensi"]],
    body: asesmenList.map((a, i) => [
      i + 1,
      a.jenis_bahaya,
      a.prevensi
    ]),
    styles: { fontSize: 9 }
  });

  const filePeriode = safeFileText(periode);

  doc.save(
    `Laporan_Assessment_K3L_${selectedBangunan.nama}_${filePeriode}.pdf`
  );

};



  return (
    <>
    <div className="min-h-screen bg-gray-100 p-8">

      {/* FLOAT PRINT */}
      <button
        onClick={handleExportPDF}
        className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full p-4"
        title="Print PDF"
      >
        <FaPrint className="text-xl" />
      </button>

      <h1 className="text-3xl font-bold text-center mb-6">
        📊 Rekapitulasi Asesmen
      </h1>

      {/* FILTER */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          className="border p-2 rounded"
          onChange={(e) => {
            const b = bangunanList.find(x => x._id === e.target.value);
            setSelectedBangunan(b);
            fetchAsesmen(e.target.value);
          }}
        >
          <option value="">-- Pilih Bangunan --</option>
          {bangunanList.map(b => (
            <option key={b._id} value={b._id}>{b.nama}</option>
          ))}
        </select>

        <select
  className="border p-2 rounded"
  value={filterMode}
  onChange={e => setFilterMode(e.target.value)}
>
  <option value="date">Tanggal</option>
  <option value="month">Bulan</option>
  <option value="year">Tahun</option>
</select>

{filterMode === "date" && (
  <input
    type="date"
    className="border p-2 rounded"
    onChange={e => setFilterTanggal(e.target.value)}
  />
)}

{filterMode === "month" && (
  <input
    type="month"
    className="border p-2 rounded"
    onChange={e => setFilterTanggal(e.target.value)}
  />
)}

{filterMode === "year" && (
  <input
    type="number"
    placeholder="2025"
    className="border p-2 rounded"
    onChange={e => setFilterTanggal(e.target.value)}
  />
)}


        <input
          type="text"
          placeholder="Cari pekerjaan / bahaya..."
          className="border p-2 rounded flex-1"
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">No</th>
              <th className="border p-2">Pekerjaan</th>
              <th className="border p-2">Bahaya</th>
              <th className="border p-2">Likelihood</th>
              <th className="border p-2">Severity</th>
              <th className="border p-2">Risk</th>
              <th className="border p-2">Danger</th>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Aksi</th>

            </tr>
          </thead>
          <tbody>
            {asesmenList.map((a, i) => (
              <tr key={a._id}>
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2">{a.jenis_pekerjaan}</td>
                <td className="border p-2">{a.jenis_bahaya}</td>
                <td className="border p-2 text-center">{a.likelihood}</td>
                <td className="border p-2 text-center">{a.severity}</td>
                <td className="border p-2 text-center">{a.risk}</td>
                <td className="border p-2 text-center">{a.danger}</td>
                <td className="border p-2 text-center">
                  {new Date(a.tanggal_dibuat).toLocaleDateString()}
                </td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => {
                      const { _id, tanggal_dibuat, dibuat_oleh, ...editable } = a;
                      setFormData(editable);
                      setEditAsesmen(a);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    onClick={() => setConfirmDelete({ show: true, id: a._id })}
                  >
                    Hapus
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
    {showForm && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center pt-10 z-50">
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Edit Asesmen</h2>

      <form
        onSubmit={handleUpdateAsesmen}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input className="border p-2 rounded"
          value={formData.jenis_pekerjaan}
          onChange={e => handleChange("jenis_pekerjaan", e.target.value)}
          placeholder="Jenis Pekerjaan"
          required
        />

        <input className="border p-2 rounded"
          value={formData.jenis_bahaya}
          onChange={e => handleChange("jenis_bahaya", e.target.value)}
          placeholder="Jenis Bahaya"
          required
        />

        <textarea className="col-span-2 border p-2 rounded"
          value={formData.cause_effect}
          onChange={e => handleChange("cause_effect", e.target.value)}
          placeholder="Cause & Effect"
        />

        <select className="border p-2 rounded"
          value={formData.level}
          onChange={e => handleChange("level", e.target.value)}
        >
          <option value="">Pilih Level</option>
          <option value="1">1 - Rare</option>
          <option value="2">2 - Unlikely</option>
          <option value="3">3 - Possible</option>
          <option value="4">4 - Likely</option>
          <option value="5">5 - Almost Certain</option>
        </select>

        <select className="border p-2 rounded"
          value={formData.impact}
          onChange={e => handleChange("impact", e.target.value)}
        >
          <option value="">Pilih Impact</option>
          <option value="1">1 - Insignificant</option>
          <option value="2">2 - Minor</option>
          <option value="3">3 - Moderate</option>
          <option value="4">4 - Major</option>
          <option value="5">5 - Fatal</option>
        </select>

        <input className="border p-2 rounded bg-gray-200" readOnly value={formData.risk} />
        <input className="border p-2 rounded bg-gray-200" readOnly value={formData.danger} />

        <textarea className="col-span-2 border p-2 rounded"
          value={formData.prevensi}
          onChange={e => handleChange("prevensi", e.target.value)}
          placeholder="Prevensi"
        />

        <div className="col-span-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditAsesmen(null);
              resetForm();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{confirmDelete.show && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-4 text-red-600">
        Hapus Asesmen?
      </h2>

      <p className="mb-6 text-sm text-gray-600">
        Data yang dihapus tidak bisa dikembalikan.
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setConfirmDelete({ show: false, id: null })}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Batal
        </button>

        <button
          onClick={handleDeleteAsesmen}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Hapus
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
  
}

export default RekapitulasiAsesmen;