import Navbar from "../components/layout/Navbar.jsx";
import Hero from "../components/home/Hero.jsx";
import FieldCarousel from "../components/home/FieldCarousel.jsx";
import Testimonials from "../components/home/Testimonials.jsx";
import CtaBanner from "../components/home/CtaBanner.jsx";
import Footer from "../components/layout/Footer.jsx";

const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <main>
        <FieldCarousel />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
};

export default Home;
