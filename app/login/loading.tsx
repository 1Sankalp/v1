export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-white px-4 md:px-24 pt-16 md:pt-32">
      <div className="h-8 w-8 bg-gray-100 rounded mb-4 animate-pulse" />
      <div className="h-10 w-80 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-5 w-48 bg-gray-100 rounded mt-4 animate-pulse" />
      <div className="flex gap-4 mt-12 max-w-md">
        <div className="h-14 flex-1 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-14 flex-1 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
