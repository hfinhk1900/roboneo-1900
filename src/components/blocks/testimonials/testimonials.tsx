import { useTranslations } from 'next-intl';

type Testimonial = {
  body: string;
  author: {
    name: string;
    handle: string;
    imageUrl: string;
  };
};

export default function TestimonialsSection() {
  const t = useTranslations('HomePage.testimonials');

  const testimonials: Testimonial[] = [
    {
      body: t('items.item-1.quote'),
      author: {
        name: t('items.item-1.name'),
        handle: t('items.item-1.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-1.image'),
      },
    },
    {
      body: t('items.item-2.quote'),
      author: {
        name: t('items.item-2.name'),
        handle: t('items.item-2.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-2.image'),
      },
    },
    {
      body: t('items.item-3.quote'),
      author: {
        name: t('items.item-3.name'),
        handle: t('items.item-3.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-3.image'),
      },
    },
    {
      body: t('items.item-4.quote'),
      author: {
        name: t('items.item-4.name'),
        handle: t('items.item-4.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-4.image'),
      },
    },
    {
      body: t('items.item-5.quote'),
      author: {
        name: t('items.item-5.name'),
        handle: t('items.item-5.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-5.image'),
      },
    },
    {
      body: t('items.item-6.quote'),
      author: {
        name: t('items.item-6.name'),
        handle: t('items.item-6.role').toLowerCase().replace(' ', ''),
        imageUrl: t('items.item-6.image'),
      },
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base/7 font-semibold text-indigo-600">{t('title')}</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl">
            {t('subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author.handle} className="pt-8 sm:inline-block sm:w-full sm:px-4">
                <figure className="rounded-2xl bg-gray-50 p-8 text-sm/6">
                  <blockquote className="text-gray-900">
                    <p>{`"${testimonial.body}"`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <img alt="" src={testimonial.author.imageUrl} className="size-10 rounded-full bg-gray-50" />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.author.name}</div>
                      <div className="text-gray-600">{`@${testimonial.author.handle}`}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
