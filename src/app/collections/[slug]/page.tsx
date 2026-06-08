import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ProductCard from "@/components/ui/ProductCard";

export const revalidate = 60; // ISR cache for 60 seconds

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Validate image URL string structure
 */
const isValidImageUrl = (url?: string): boolean => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  const headersList = await headers();
  const domain =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    "localhost";

  let collection = null;

  try {
    const res = await apiClient.get(`/collections/${slug}`, {
      headers: { "x-tenant-domain": domain },
    });

    collection = Array.isArray(res) ? res : res.data || res;
  } catch (error) {
    console.error(`[SSR] Failed to fetch collection for slug: ${slug}`, error);
    return notFound();
  }

  if (!collection || !collection.products) return notFound();

  const hasValidHeroImage =
    collection.image && isValidImageUrl(collection.image);

  return (
    <main className="min-h-screen bg-zinc-50 pb-16 pt-24">
      {/* Premium Hero Banner Section */}
      <div className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`
            relative 
            w-full 
            overflow-hidden 
            rounded-[32px] 
            border 
            border-zinc-200/60 
            bg-zinc-900 
            shadow-sm
            ${hasValidHeroImage ? "aspect-[2/1]" : "py-12 md:py-16 px-8 md:px-12 bg-gradient-to-br from-zinc-900 to-zinc-800"}
          `}
        >
          {/* Dynamic Background Image Layer */}
          {hasValidHeroImage && (
            <>
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1216px"
              />
              {/* Responsive Cinematic Scrim Overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-zinc-950/20 md:bg-gradient-to-r md:from-zinc-950/95 md:via-zinc-950/60 md:to-transparent" />
            </>
          )}

          {/* Banner Content Layer */}
          <div
            className={`
              relative 
              z-20 
              flex 
              h-full 
              w-full 
              flex-col 
              justify-end 
              p-6 
              sm:p-10 
              md:max-w-2xl 
              md:justify-center
              ${!hasValidHeroImage ? "md:max-w-none" : ""}
            `}
          >
            <span className="mb-2 text-xs font-bold tracking-widest text-emerald-400 uppercase sm:mb-3">
              Curated Collection
            </span>

            <h1
              className={`
                text-2xl 
                font-black 
                tracking-tight 
                uppercase 
                sm:text-4xl 
                md:text-5xl 
                lg:text-6xl
                ${hasValidHeroImage ? "text-white" : "text-white"}
              `}
            >
              {collection.name}
            </h1>

            {collection.description && (
              <p
                className={`
                  mt-3 
                  line-clamp-2 
                  text-sm 
                  font-medium 
                  leading-relaxed 
                  sm:mt-4 
                  sm:text-base 
                  md:line-clamp-3
                  ${hasValidHeroImage ? "text-zinc-200" : "text-zinc-300"}
                `}
              >
                {collection.description}
              </p>
            )}

            <div className="mt-4 sm:mt-6">
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-emerald-400 uppercase backdrop-blur-md">
                {collection.products.length} Products Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Feed Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between border-b border-zinc-200/80 pb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 uppercase sm:text-2xl">
            Explore Catalog
          </h2>
          <span className="text-sm font-semibold text-zinc-400">
            Showing All Results
          </span>
        </div>

        {collection.products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {collection.products.map((product: any) => (
              <div
                key={product.id}
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-zinc-200 border-dashed bg-white py-24 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 text-zinc-400">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-800">
              Collection Empty
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Check back soon for new additions to this catalog.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}