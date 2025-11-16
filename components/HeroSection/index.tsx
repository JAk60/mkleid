"use client";
import Image from "next/image";
import Link from "next/link";

const HeroSection = () => {
  return (
    <div className="px-5 pt-5 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="col-span-8 relative h-full w-full">
          <div className="text-center absolute w-full h-full bg-black/25 grid content-center">
            <p className="leading-relaxed text-white uppercase scaleUpCenter">
              sale upto 40% off
            </p>
            <h1 className="text-2xl md:text-6xl text-white font-bold font-oswald mb-4 capitalize scaleUpCenter">
              Ecommerce online store
            </h1>
            <div>
              <Link
                href="/"
                className="mt-3 text-white inline-flex items-center capitalize border border-white px-4 md:px-6 py-1 md:py-2 transition ease-in-out hover:bg-white hover:text-black duration-300 slideInBottom"
              >
                shop now
              </Link>
            </div>
          </div>
          <Image
            src="/offers-banner.png"
            alt="offers banner image"
            height={1080}
            width={1920}
            className="w-full object-cover h-full object-center inset-0"
          />
        </div>
        <div className="col-span-8 md:col-span-4">
          <div className="flex flex-col gap-4">
            <div className="relative h-full w-full">
              <div className="text-center absolute w-full h-full bg-black/25 grid content-center">
                <p className="text-2xl md:text-3xl text-white font-bold font-oswald mb-4 capitalize scaleUpCenter">
                  Female
                </p>
                <p className="leading-relaxed text-white capitalize scaleUpCenter">
                  Best Clothes For Female
                </p>
                <div>
                  <Link
                    href="/products/gender/Female"
                    className="mt-3 text-white inline-flex items-center capitalize border border-white px-4 md:px-6 py-1 md:py-2 transition ease-in-out hover:bg-white hover:text-black duration-300 slideInBottom"
                  >
                    shop now
                  </Link>
                </div>
              </div>
              <Image
                src="/offers-banner.png"
                alt="Female banner image"
                height={1080}
                width={1920}
                className="w-full object-cover h-full object-center inset-0"
              />
            </div>
            <div className="relative h-full w-full">
              <div className="text-center absolute w-full h-full bg-black/25 grid content-center">
                <p className="text-2xl md:text-3xl text-white font-bold font-oswald mb-4 capitalize scaleUpCenter">
                  Male
                </p>
                <p className="leading-relaxed text-white capitalize scaleUpCenter">
                  Best Clothes For Male
                </p>
                <div>
                  <Link
                    href="/products/gender/Male"
                    className="mt-3 text-white inline-flex items-center capitalize border border-white px-4 md:px-6 py-1 md:py-2 transition ease-in-out hover:bg-white hover:text-black duration-300 slideInBottom"
                  >
                    shop now
                  </Link>
                </div>
              </div>
              <Image
                src="/offers-banner.png"
                alt="Male banner image"
                height={1080}
                width={1920}
                className="w-full object-cover h-full object-center inset-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;