interface TestimonialsProps {
  testimonials: string[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  const items = testimonials.slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-white to-[#fff8ef] py-20">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <div className="mb-11 text-center">
          <h2 className="m-0 mb-2.5 text-[clamp(34px,4vw,56px)] font-medium leading-[1.08] text-[#16233e]">
            成员心声
          </h2>
          <p className="m-0 text-[clamp(17px,1.8vw,22px)] leading-[1.6] text-[#62738b]">
            听听他们在 SACC 的成长故事
          </p>
        </div>

        <div className="grid gap-[22px] md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item}
              className="rounded-3xl border border-[#eef1f6] bg-white/96 p-7 shadow-[0_12px_28px_rgba(23,48,86,0.06)] transition-transform hover:-translate-y-0.5"
            >
              <span className="mb-2.5 inline-block text-[44px] leading-none text-[#ff9a00]">
                &quot;
              </span>
              <p className="m-0 text-base font-medium leading-[1.75] text-[#63748b]">{item}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}