const FullPageSpinner = () => (
  <div
    role="status"
    className="flex min-h-dvh items-center justify-center bg-background"
  >
    <span
      aria-hidden="true"
      className="size-6 animate-spin border-2 border-border border-t-primary motion-reduce:animate-none"
    />
    <span className="sr-only">Memeriksa sesi…</span>
  </div>
);

export default FullPageSpinner;
