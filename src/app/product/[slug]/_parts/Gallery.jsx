"use client";

import { useState } from "react";

// Product image gallery: one big main image + selectable thumbnails.
// grayscale -> colour on hover, same language as the shop cards.
// Fixed aspect-[3/4] everywhere so switching images never shifts layout.
export default function Gallery({ images = [], alt = "", tag }) {
  const pics = images.length ? images : [];
  const [active, setActive] = useState(0);
  const main = pics[active] ?? pics[0];

  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {/* main image */}
      <figure className="group relative overflow-hidden rounded-sm border border-line bg-black">
        {tag && (
          <span className="absolute top-3 right-3 z-10 rounded-sm bg-crimson px-2.5 py-1 text-xs text-concrete">
            {tag}
          </span>
        )}
        <img
          key={main}
          src={main}
          alt={alt}
          className="aspect-[3/4] w-full object-cover grayscale-[0.5] transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
        />
      </figure>

      {/* thumbnails */}
      {pics.length > 1 && (
        <div
          className="thin-scroll flex gap-3 overflow-x-auto pb-1"
          role="group"
          aria-label="تصاویرِ محصول"
        >
          {pics.map((src, i) => (
            <button
              key={src}
              type="button"
              data-hot
              data-on={i === active}
              aria-pressed={i === active}
              aria-label={`نمایشِ تصویرِ ${i + 1}`}
              onClick={() => setActive(i)}
              className="swatch relative w-20 shrink-0 overflow-hidden rounded-sm border border-line transition-opacity sm:w-24"
              style={{ opacity: i === active ? 1 : 0.6 }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="aspect-[3/4] w-full object-cover grayscale-[0.4]"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
