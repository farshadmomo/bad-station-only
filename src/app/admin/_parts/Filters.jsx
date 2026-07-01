"use client";

// Orders-dashboard controls: date range (incl. custom range), sort, and search.
// Pure presentational — all filtering math lives in AdminBoard. RTL / Persian.

export const DATE_RANGES = [
  { id: "today", label: "امروز" },
  { id: "7d", label: "۷ روز" },
  { id: "30d", label: "۳۰ روز" },
  { id: "month", label: "این ماه" },
  { id: "all", label: "همه‌وقت" },
  { id: "custom", label: "بازه" },
];

export const SORTS = [
  { id: "priority", label: "اولویتِ کاری" },
  { id: "newest", label: "جدیدترین" },
  { id: "oldest", label: "قدیمی‌ترین" },
];

export default function Filters({
  range,
  setRange,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  sort,
  setSort,
  search,
  setSearch,
}) {
  return (
    <section className="mt-6 space-y-3" aria-label="فیلترها و مرتب‌سازی">
      {/* date range + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="stencil ml-1 text-[0.7rem] text-concrete-dim" dir="ltr">
          / RANGE
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="بازه‌ی زمانی">
          {DATE_RANGES.map((r) => (
            <button
              key={r.id}
              data-hot
              data-on={range === r.id}
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className="chip min-h-11 rounded-full px-4 text-sm"
            >
              {r.label}
            </button>
          ))}
        </div>

        <label className="mr-auto flex items-center gap-2 text-sm text-concrete-dim">
          <span className="whitespace-nowrap">مرتب‌سازی</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="field min-h-11 rounded-sm px-3 text-sm text-concrete"
            aria-label="ترتیبِ نمایش"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* custom date range (two inputs) */}
      {range === "custom" && (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-black-2 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-concrete-dim">
            <span>از</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              dir="ltr"
              className="field min-h-11 rounded-sm px-3 text-sm text-concrete"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-concrete-dim">
            <span>تا</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              dir="ltr"
              className="field min-h-11 rounded-sm px-3 text-sm text-concrete"
            />
          </label>
          {(customFrom || customTo) && (
            <button
              data-hot
              onClick={() => {
                setCustomFrom("");
                setCustomTo("");
              }}
              className="chip min-h-11 rounded-full px-4 text-xs"
            >
              پاک‌کردنِ بازه
            </button>
          )}
        </div>
      )}

      {/* search */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جست‌وجو: کدِ سفارش، نام، یا شماره‌ی موبایل…"
          aria-label="جست‌وجوی سفارش"
          className="field min-h-11 w-full rounded-sm px-3 text-sm text-concrete"
        />
      </div>
    </section>
  );
}
