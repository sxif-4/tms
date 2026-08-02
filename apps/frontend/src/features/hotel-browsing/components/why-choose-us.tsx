import { Link } from "@tanstack/react-router";

type Highlight = {
  title: string;
  body: string;
  image: string;
  to: string;
  /** Cell size on the 12-column bento. Row one is taller than row two. */
  cell: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    title: "Comfortable Hotels",
    body: "Overwater villas, beach retreats, and cliffside suites — compare room types and see what's free on your dates.",
    image: "/images/card-ui-img/hotelstay.png",
    to: "/hotels",
    cell: "lg:col-span-4 lg:min-h-88",
  },
  {
    title: "Ferry Transfers Included",
    body: "Your crossing is held the moment your room is. Pick a sailing time as you book.",
    image: "/images/card-ui-img/ferryTransfer.png",
    to: "/ferry",
    cell: "lg:col-span-4 lg:min-h-88",
  },
  {
    title: "Theme Park Adventures",
    body: "Dated park entry, plus seats at the rides and shows that need one.",
    image: "/images/card-ui-img/themepark.png",
    to: "/theme-park",
    cell: "lg:col-span-5 lg:min-h-72",
  },
  {
    title: "Interactive Island Map",
    body: "Every hotel, jetty, ride, and beach in one view. Open a pin to book what's there.",
    image: "/images/card-ui-img/islandmap.png",
    to: "/map",
    cell: "lg:col-span-7 lg:min-h-72",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      {/* Bento: the heading is the top-left cell rather than a banner above
          the grid, so row one reads heading | hotels | ferry and row two
          reads theme park | map. Collapses to 2-up at md, stacked below. */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 sm:gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-center md:col-span-2 lg:col-span-4 lg:py-4 lg:pr-4">
          <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-blue-600 uppercase dark:text-blue-400">
            Why choose us
          </p>
          <h2 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Everything you need for the perfect{" "}
            <span className="text-blue-600 italic dark:text-blue-400">
              island escape
            </span>
          </h2>
          <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
            Rooms, crossings, ride days, and beach nights all sit on the same
            trip so you leave with one reference number instead of five.
          </p>
        </div>

        {HIGHLIGHTS.map(({ title, body, image, to, cell }) => (
          <Link
            key={title}
            to={to}
            className={`group relative isolate flex aspect-3/2 flex-col justify-end overflow-hidden rounded-3xl md:aspect-video lg:aspect-auto ${cell}`}
          >
            <img
              src={image}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              loading="lazy"
            />
            {/* Diagonal toward the top-right: weighted into the bottom-left
                corner where the copy sits, clear by 70% so the far side of the
                photo stays as shot. The text shadow lets it stay this light. */}
            <span className="absolute inset-0 -z-10 bg-linear-to-tr from-black/80 from-0% via-black/35 via-35% to-transparent to-70%" />

            <div className="max-w-[85%] p-6 [text-shadow:0_1px_10px_rgb(0_0_0/0.5)] sm:max-w-[80%] sm:p-8">
              <h3 className="line-clamp-2 text-xl leading-tight font-bold tracking-tight text-balance text-white lg:text-2xl">
                {title}
              </h3>
              {/* Body reserves two lines so the copy lines up across a row. */}
              <p className="mt-2 line-clamp-2 min-h-[2lh] text-sm text-pretty text-white/80">
                {body}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
