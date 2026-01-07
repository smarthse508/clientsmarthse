// pages/home.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Asesmen from "./asesmen";
import RekapitulasiAsesmen from "./rekapitulasiasesmen";
import Anggota from "./anggota";
import Gedung from "./gedung";
import Map from "./map";
import LaporanKecelakaan from "./laporankecelakaan";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activePage, setActivePage] = useState("Dashboard");
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState(null);
  const [anggota, setAnggota] = useState([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);

  // state untuk list ruang kerja
  const [workspaces, setWorkspaces] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL;
// ===== SAW CONFIG =====
const BOBOT_FREKUENSI = 0.3;
const BOBOT_RESIKO = 0.7;

const skalaResiko = {
  Insignificant: 1,
  Minor: 2,
  Moderate: 3,
  Major: 4,
  Fatal: 5,
};

const [laporan, setLaporan] = useState([]);
const [hasilSAW, setHasilSAW] = useState([]);
const [loadingSAW, setLoadingSAW] = useState(false);

  // Ambil workspace aktif + fetch ruang kerja pertama kali
useEffect(() => {
  const fetchWorkspaces = async () => {
    try {
      const res = await fetch(`${backendURL}/api/ruangkerja/list-ruangkerja`, {
        credentials: "include",
      });
      const data = await res.json();
      const wsList = data.data || [];
      setWorkspaces(wsList);

      // Cek workspace aktif dari localStorage dulu
      const savedWsId = localStorage.getItem("workspace_aktif");
      const savedWsName = localStorage.getItem("workspace_aktif_nama");

      if (savedWsId && savedWsName) {
        setWorkspaceId(savedWsId);
        setWorkspaceName(savedWsName);
        return; // jangan overwrite pilihan user
      }

      // Kalau belum ada workspace aktif tersimpan, tentukan default
      let defaultWs = null;
      const ownerWs = wsList.filter(
        ws => ws.pengguna_id === localStorage.getItem("user_id")
      );

      if (ownerWs.length > 0) {
        defaultWs = ownerWs.reduce((prev, curr) =>
          new Date(prev.createdAt) < new Date(curr.createdAt) ? prev : curr
        );
      } else if (wsList.length > 0) {
        defaultWs = wsList[0];
      }

      if (defaultWs) {
        setWorkspaceId(defaultWs._id);
        setWorkspaceName(defaultWs.nama);
        localStorage.setItem("workspace_aktif", defaultWs._id);
        localStorage.setItem("workspace_aktif_nama", defaultWs.nama);
      }
    } catch (err) {
      console.error("Gagal fetch ruang kerja:", err);
    }
  };

  fetchWorkspaces();
}, []);

useEffect(() => {
  if (!workspaceId) {
    setLaporan([]);
    return;
  }

  const fetchLaporan = async () => {
    setLoadingSAW(true);
    try {
      const res = await fetch(
        `${backendURL}/api/laporankecelakaan/list?ruangkerja_id=${workspaceId}`,
        { credentials: "include" }
      );
      const json = await res.json();

      const data = Array.isArray(json.data) ? json.data : [];
      setLaporan(data);
    } catch (err) {
      console.error("Gagal fetch laporan SAW:", err);
      setLaporan([]);
    } finally {
      setLoadingSAW(false);
    }
  };

  fetchLaporan();
}, [workspaceId]);
useEffect(() => {
  if (!Array.isArray(laporan) || laporan.length === 0) {
    setHasilSAW([]);
    return;
  }

  // kelompokkan per lokasi / gedung
  const lokasiMap = {};

  laporan.forEach((lap) => {
    if (!lap.lokasi || !lap.tingkat_resiko) return;

    if (!lokasiMap[lap.lokasi]) {
      lokasiMap[lap.lokasi] = {
        lokasi: lap.lokasi,
        frekuensi: 0,
        totalResiko: 0,
        detailResiko: {
          Insignificant: 0,
          Minor: 0,
          Moderate: 0,
          Major: 0,
          Fatal: 0,
        },
      };

          }

    lokasiMap[lap.lokasi].frekuensi += 1;

    const nilai = skalaResiko[lap.tingkat_resiko] || 0;
    lokasiMap[lap.lokasi].totalResiko += nilai;

    if (lokasiMap[lap.lokasi].detailResiko[lap.tingkat_resiko] !== undefined) {
      lokasiMap[lap.lokasi].detailResiko[lap.tingkat_resiko] += 1;
    }

  });

  const lokasiArray = Object.values(lokasiMap);

  if (lokasiArray.length === 0) {
    setHasilSAW([]);
    return;
  }

  const maxFrekuensi = Math.max(...lokasiArray.map(l => l.frekuensi), 1);
  const maxResiko = Math.max(...lokasiArray.map(l => l.totalResiko), 1);

  const hasil = lokasiArray
    .map((l) => {
      const normalFrekuensi = l.frekuensi / maxFrekuensi;
      const normalResiko = l.totalResiko / maxResiko;

      return {
        ...l,
        nilaiSAW:
          normalFrekuensi * BOBOT_FREKUENSI +
          normalResiko * BOBOT_RESIKO,
      };
    })
    .sort((a, b) => b.nilaiSAW - a.nilaiSAW);

  setHasilSAW(hasil);
}, [laporan]);




  return (
    <div className="h-screen flex bg-gray-100 text-gray-900">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white sticky top-0 z-10 flex justify-between items-center p-4 shadow-sm">
          <button
            className="p-2 text-2xl font-bold lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h2 className="text-2xl font-semibold">{activePage}</h2>
          <div className="bg-gray-300 w-10 h-10 rounded-full"></div>
        </header>

        <section className="p-6 space-y-4">
         {activePage === "Dashboard" && (
  <div className="space-y-4">
    <h3 className="text-xl font-bold">Dashboard</h3>

    {workspaceName && (
      <p className="text-sm text-gray-500">
        Workspace aktif: {workspaceName}
      </p>
    )}

    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-2">
        Prioritas Lokasi Risiko (Metode SAW)
      </h4>

      <p className="text-sm text-gray-600 mb-3">
        Bobot Risiko 70% · Frekuensi 30%
      </p>

      {loadingSAW ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : hasilSAW.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Belum ada data laporan kecelakaan pada workspace ini.
        </p>
      ) : (
        <ul className="space-y-2">
          {hasilSAW.map((item, index) => (
            <li
  key={item.lokasi}
  className="bg-gray-100 p-3 rounded space-y-1"
>
  <div className="flex justify-between font-medium">
    <span>
      {index + 1}. {item.lokasi}
    </span>
    <span>
      Skor: {item.nilaiSAW.toFixed(3)}
    </span>
  </div>

  <p className="text-sm text-gray-600">
    Total kasus: {item.frekuensi}
  </p>

  <div className="text-sm text-gray-700 flex flex-wrap gap-2">
    {Object.entries(item.detailResiko)
      .filter(([_, jumlah]) => jumlah > 0)
      .map(([jenis, jumlah]) => (
        <span
          key={jenis}
          className="bg-white px-2 py-0.5 rounded border text-xs"
        >
          {jenis}: {jumlah}
        </span>
      ))}
  </div>
</li>

          ))}
        </ul>
      )}
    </div>
  </div>
)}


          
          {/* ISI ASESMEN */}
          {activePage === "Isi Asesmen" && <Asesmen workspaceId={workspaceId} />}

          {/* REKAP ASESMEN */}
          {activePage === "Rekapitulasi Asesmen" && (
            <RekapitulasiAsesmen workspaceId={workspaceId} />
          )}
          

          {/* Gedung */}
          {activePage === "Gedung" &&  <Gedung workspaceId={workspaceId} /> }

          {activePage === "Laporan Kecelakaan" &&  <LaporanKecelakaan workspaceId={workspaceId} /> }

          {/* REPORTS */}
          {activePage === "Map" && <Map /> }
          {/*Anggota */}
          {activePage === "Lihat Anggota" && workspaceId && (
            <Anggota 
              workspaceId={workspaceId} 
              ownerId={workspaces.find(ws => ws._id === workspaceId)?.pengguna_id || ""}
            />
          )}




          {/* RUANG KERJA */}
          {activePage === "Ruang Kerja" && (
            <div>
              <h3 className="text-xl font-bold mb-4">Daftar Ruang Kerja</h3>

              {workspaces.length === 0 ? (
                <p className="text-gray-600">Belum ada ruang kerja.</p>
              ) : (
                <ul className="space-y-2">
                  {workspaces.map((ws) => (
                    <li
                      key={ws._id}
                      className="p-3 bg-white shadow rounded text-gray-800 cursor-pointer hover:bg-green-100"
                      onClick={() => {
                      localStorage.setItem("workspace_aktif", ws._id);
                      localStorage.setItem("workspace_aktif_nama", ws.nama);

                      setWorkspaceId(ws._id);
                      setWorkspaceName(ws.nama);
                      setActivePage("Dashboard"); // pindah ke dashboard biar jelas

                      alert(`Berhasil mengubah workspace ke: ${ws.nama}`);
                    }}

                    >
                      {ws.nama}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
