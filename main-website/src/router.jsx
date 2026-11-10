import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home.jsx";
import PesanLapangan from "./pages/PesanLapangan.jsx";
import BookingDetail from "./pages/BookingDetail.jsx";
import CekPesanan from "./pages/CekPesanan.jsx";
import NotFound from "./pages/NotFound.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/pesan-lapangan", element: <PesanLapangan /> },
  { path: "/booking-detail", element: <BookingDetail /> },
  { path: "/cek-pesanan", element: <CekPesanan /> },
  { path: "*", element: <NotFound /> },
]);

export default router;
