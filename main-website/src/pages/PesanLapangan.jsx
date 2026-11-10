import Navbar from "../components/layout/Navbar.jsx";
import Container from "../components/common/Container.jsx";
import BookingForm from "../components/pesan/BookingForm.jsx";

const PesanLapangan = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="pt-32 pb-16">
        <Container>
          <h1 className="mb-6 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight">
            Pesan Lapangan
          </h1>
          <BookingForm />
        </Container>
      </main>
    </div>
  );
};

export default PesanLapangan;
