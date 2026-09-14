export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen md:h-screen bg-white p-8 overflow-hidden pt-12 md:px-12 px-4">
      <div className="max-w-full mx-auto flex flex-col md:flex-row h-full">
        <div className="w-full md:w-[400px] flex-shrink-0 mb-8 md:mb-0">
          <div className="w-48 h-48 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-8 w-56 bg-gray-100 rounded-lg mt-6 animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded mt-4 animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-end gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
            <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-12 w-32 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-end">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[220px] w-full md:w-[400px] rounded-3xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
