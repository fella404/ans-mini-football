import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-hero font-extrabold leading-[1.1] tracking-tight text-balance">
        404
      </h1>
      <p className="text-pretty text-muted-foreground">Halaman tidak ditemukan.</p>
      <Link
        to="/"
        className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
};

export default NotFound;
