import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MoreAITools() {
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-12 px-6">
        <div className="text-center space-y-4">
          <h2 className="text-balance text-[32px] font-bold text-foreground">
            More AI Tools
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore more AI tools to create stunning visuals and enhance your photos with ease.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Text-to-Image Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/more-tool01.png')"
              }}
            />
            
            {/* Text overlay with gradient background */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] p-8">
              <div className="flex-1" />
              
              {/* Text content with dark background */}
              <div className="relative">
                {/* Dark overlay behind text */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-2xl" />
                
                <div className="relative z-10 space-y-4 p-4">
                  <h3 className="text-2xl font-bold leading-tight text-white">
                    Text-to-Image: Turn Words Into Stunning Visuals
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    Style chameleon — From photorealism to anime or vaporwave, the model instantly adapts to your chosen aesthetic while preserving crisp detail and vibrant color.
                  </p>
                  
                  <Button 
                    asChild
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                    size="lg"
                  >
                    <Link href="#" className="flex items-center justify-center gap-2">
                      <span>Generate Image</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Transform Image Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/more-tool02.png')"
              }}
            />
            
            {/* Text overlay with gradient background */}
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[400px] p-8">
              <div className="flex-1" />
              
              {/* Text content with dark background */}
              <div className="relative">
                {/* Dark overlay behind text */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-2xl" />
                
                <div className="relative z-10 space-y-4 p-4">
                  <h3 className="text-2xl font-bold leading-tight text-white">
                    Transform Image: Turn Words Into Stunning Visuals
                  </h3>
                  <p className="text-white/90 leading-relaxed">
                    Style chameleon — From photorealism to anime or vaporwave, the model instantly adapts to your chosen aesthetic while preserving crisp detail and vibrant color.
                  </p>
                  
                  <Button 
                    asChild
                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                    size="lg"
                  >
                    <Link href="#" className="flex items-center justify-center gap-2">
                      <span>Transform Image</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
