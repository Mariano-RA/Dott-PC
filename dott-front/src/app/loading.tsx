export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="space-y-3">
        <div className="h-6 w-44 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

