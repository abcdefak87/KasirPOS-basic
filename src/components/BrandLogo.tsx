"use client";
import { useBrand } from "./BrandProvider";

interface Props {
  size?: number;
  className?: string;
  rounded?: string;
}

export function BrandLogo({ size = 36, className = "", rounded = "rounded-xl" }: Props) {
  const { brand, initial } = useBrand();
  if (brand.logo_url) {
    return (
      <span
        className={`inline-block overflow-hidden bg-white ${rounded} ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo_url}
          alt={brand.brand_name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center bg-brand-600 text-white font-bold ${rounded} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial()}
    </span>
  );
}
