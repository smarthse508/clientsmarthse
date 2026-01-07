// import React, { useState } from "react";
// import Sidebar from "../components/Sidebar";

// function IsiAsesmen() {
//   const handleNavigation = (menuId) => {
//     console.log("Navigate to:", menuId);
//   };

//   const [pekerjaan, setPekerjaan] = useState("");
//   const [cause, setCause] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Data:", { pekerjaan, cause });
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <Sidebar
//         userRole="superadmin"
//         activePage="isi-asesmen"
//         onNavigate={handleNavigation}
//       />

//       {/* Konten utama */}
//       <main className="flex-1 p-10 overflow-y-auto">
//         {/* Header */}
//         <h1 className="text-3xl font-semibold text-gray-800 mb-8">
//           Form Asesmen
//         </h1>

//         {/* Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 md:grid-cols-2 gap-8"
//         >
//           {/* Input Nama */}
//           <div className="flex flex-col">
//             <label className="text-gray-700 mb-2 font-medium">Deskripsi Pekerjaan</label>
//             <input
//               type="text"
//               value={pekerjaan}
//               onChange={(e) => setPekerjaan(e.target.value)}
//               placeholder="Masukkan deskripsi"
//               className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             />
//           </div>

//           {/* Input Nilai */}
//           <div className="flex flex-col">
//             <label className="text-gray-700 mb-2 font-medium">Cause/effect</label>
//             <input
//               type="text"
//               value={cause}
//               onChange={(e) => setCause(e.target.value)}
//               placeholder="Deskripsi cause/effct"
//               className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
//             />
//           </div>

//           {/* Tombol Submit */}
//           <div className="col-span-full flex justify-end mt-4">
//             <button
//               type="submit"
//               className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 transition"
//             >
//               Kirim
//             </button>
//           </div>
//         </form>
//       </main>
//     </div>
//   );
// }

// export default IsiAsesmen;
