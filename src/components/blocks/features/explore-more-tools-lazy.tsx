'use client';

import dynamic from 'next/dynamic';

// 懒加载组件
const ExploreMoreToolsSection = dynamic(() => import('./explore-more-tools'), {
  loading: () => (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Loading Title */}
        <div className="text-center mb-8 lg:mb-10">
          <div className="h-8 bg-gray-200 rounded-lg w-80 mx-auto animate-pulse" />
        </div>

        {/* Loading Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-3xl w-full min-h-[400px] sm:min-h-[420px] lg:min-h-[460px] animate-pulse"
            >
              {/* Loading content */}
              <div className="pt-4 sm:pt-6 px-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
              </div>
              <div className="flex justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-[166px] lg:h-[166px] bg-gray-200 rounded-2xl" />
              </div>
              <div className="px-3 sm:px-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
  ssr: true, // 保持 SSR 以利于 SEO
});

export default ExploreMoreToolsSection;
