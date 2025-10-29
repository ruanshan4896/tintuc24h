export default function Loading() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Skeleton */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 h-64 md:h-80 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="h-8 w-48 bg-white/20 rounded mb-4"></div>
          <div className="h-12 w-96 bg-white/20 rounded mb-6"></div>
          <div className="h-6 w-full max-w-2xl bg-white/20 rounded"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Article Skeleton */}
        <div className="mb-16">
          <div className="h-8 w-32 bg-gray-200 rounded-full mb-6 animate-pulse"></div>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-96 bg-gray-200"></div>
              <div className="p-8 md:p-12 space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Sliders Skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-12 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex-none w-[300px] md:w-[350px]">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="h-52 bg-gray-200"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

