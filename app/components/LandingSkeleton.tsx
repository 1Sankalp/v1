export default function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="h-10 w-72 md:w-[28rem] bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-6 w-56 md:w-[22rem] bg-gray-100 rounded mt-4 animate-pulse" />
      <div className="h-14 w-56 bg-gray-100 rounded-xl mt-12 animate-pulse" />
    </div>
  );
}
