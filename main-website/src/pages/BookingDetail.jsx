import Navbar from "../components/layout/Navbar.jsx";
import Container from "../components/common/Container.jsx";
import BookingDetailContent from "../components/booking/BookingDetailContent.jsx";

const BookingDetail = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar solid />
      <main className="pt-24 pb-16">
        <Container>
          <div className="py-4 pb-8">
            <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.1] tracking-tight">
              Detail Pesanan
            </h1>
          </div>
          <BookingDetailContent />
        </Container>
      </main>
    </div>
  );
};

export default BookingDetail;
