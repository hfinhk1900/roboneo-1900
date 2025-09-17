import { OptimizedImage } from '@/components/seo/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { LocaleLink } from '@/i18n/navigation';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { formatDate } from '@/lib/formatter';
import { type BlogType, authorSource, categorySource } from '@/lib/source';
import Image from 'next/image';

interface BlogCardProps {
  locale: string;
  post: BlogType;
}

export default function BlogCard({ locale, post }: BlogCardProps) {
  const { date, title, description, image, author, categories } = post.data;
  const imageUrl = typeof image === 'string' ? image : image?.url ?? null;
  const defaultAlt = `${title || 'Roboneo AI Blog'} - AI Image Generation Tutorial`;
  const imageAlt = typeof image === 'object' && image ? image.alt ?? defaultAlt : defaultAlt;
  const publishDate = formatDate(new Date(date));
  const blogAuthor = authorSource.getPage([author], locale);
  const blogCategories = categorySource
    .getPages(locale)
    .filter((category) => categories.includes(category.slugs[0] ?? ''));

  return (
    <LocaleLink href={`/blog/${post.slugs}`} className="block h-full">
      <div className="group flex flex-col border rounded-lg overflow-hidden h-full">
        {/* Image container - fixed aspect ratio */}
        <div className="group overflow-hidden relative aspect-16/9 w-full">
          {imageUrl && (
            <div className="relative w-full h-full">
              <OptimizedImage
                src={imageUrl}
                alt={imageAlt}
                className="object-cover hover:scale-105 transition-transform duration-300"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {blogCategories && blogCategories.length > 0 && (
                <div className="absolute left-2 bottom-2 opacity-100 transition-opacity duration-300">
                  <div className="flex flex-wrap gap-1">
                    {blogCategories.map((category, index) => (
                      <span
                        key={`${category?.slugs[0]}-${index}`}
                        className="text-xs font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded-md"
                      >
                        {category?.data.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post info container */}
        <div className="flex flex-col justify-between p-4 flex-1">
          <div>
            {/* Post title */}
            <h3 className="text-lg line-clamp-2 font-medium">
              <span
                className="bg-linear-to-r from-green-200 to-green-100
                  bg-[length:0px_10px] bg-left-bottom bg-no-repeat
                  transition-[background-size]
                  duration-500
                  hover:bg-[length:100%_3px]
                  group-hover:bg-[length:100%_10px]
                  dark:from-purple-800 dark:to-purple-900"
              >
                {title}
              </span>
            </h3>

            {/* Post excerpt */}
            <div className="mt-2">
              {description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Author and date */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between space-x-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 shrink-0">
                {blogAuthor?.data.avatar && (
                  <OptimizedImage
                    src={blogAuthor?.data.avatar}
                    alt={`${blogAuthor?.data.name} - Roboneo AI Blog Author`}
                    className="rounded-full object-cover border"
                    fill
                  />
                )}
              </div>
              <span className="truncate text-sm">{blogAuthor?.data.name}</span>
            </div>

            <time className="truncate text-sm" dateTime={date}>
              {publishDate}
            </time>
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-full">
      <div className="overflow-hidden relative aspect-16/9 w-full">
        <Image
          src={PLACEHOLDER_IMAGE}
          alt="Loading placeholder"
          className="object-cover"
          fill
        />
      </div>
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
        </div>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
