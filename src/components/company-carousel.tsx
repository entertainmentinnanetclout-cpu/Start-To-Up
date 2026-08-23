import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    kicker: "THE STARTUP OPERATING COMPANY",
    title: "Build the company, not just the idea.",
    body: "Start To Up brings venture strategy, product, commercial execution, operations, founder development and growth into one practical startup system.",
    cta: "Open the startup playbook",
    href: "/startup-playbook",
    accent: "gold",
    proof: ["VALIDATE", "BUILD", "SELL"],
  },
  {
    kicker: "FOUNDER OPERATING DISCIPLINE",
    title: "Know what to do next—and what not to waste money on.",
    body: "Learn customer discovery, MVP discipline, pricing, cash control, sales cadence, hiring, metrics and the weekly operating habits that keep startups alive.",
    cta: "Learn how to run a startup",
    href: "/startup-playbook",
    accent: "blue",
    proof: ["CASH", "SALES", "EXECUTION"],
  },
  {
    kicker: "PRODUCT & TECHNOLOGY",
    title: "Turn validated demand into a product people can use.",
    body: "From prototype and UX to production systems, Start To Up helps founders move from assumptions to usable technology with a commercial purpose.",
    cta: "Explore product services",
    href: "#services",
    accent: "green",
    proof: ["MVP", "PRODUCT", "SYSTEMS"],
  },
  {
    kicker: "CAPITAL & INVESTOR READINESS",
    title: "Raise from evidence, not excitement.",
    body: "Build a sharper story around traction, unit economics, milestones, governance, data rooms and the use of funds investors need to understand quickly.",
    cta: "Prepare the business",
    href: "/startup-playbook",
    accent: "gold",
    proof: ["TRACTION", "METRICS", "CAPITAL"],
  },
  {
    kicker: "SCALE WITH CONTROL",
    title: "Growth should make the company stronger, not harder to run.",
    body: "Install repeatable acquisition, customer success, financial control, team accountability and operating systems before complexity starts managing the founder.",
    cta: "Build for scale",
    href: "/startup-playbook",
    accent: "blue",
    proof: ["SYSTEMISE", "MEASURE", "SCALE"],
  },
] as const;

export function CompanyCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      6200,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) =>
    setActive((current) => (current + direction + slides.length) % slides.length);

  return (
    <section
      className="company-carousel shell-width startup-authority-carousel"
      aria-roledescription="carousel"
      aria-label="Start To Up startup operating system"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="carousel-stage">
        {slides.map((slide, index) => (
          <article
            className={`carousel-slide carousel-${slide.accent} ${index === active ? "active" : ""}`}
            key={slide.kicker}
            aria-hidden={index !== active}
          >
            <div className="carousel-copy">
              <span className="carousel-kicker">{slide.kicker}</span>
              <h1>{slide.title}</h1>
              <p>{slide.body}</p>
              <div className="carousel-actions">
                {slide.href.startsWith("/") ? (
                  <Link preload="intent" to="/startup-playbook" className="button carousel-primary">
                    {slide.cta} <ArrowRight />
                  </Link>
                ) : (
                  <a href={slide.href} className="button carousel-primary">
                    {slide.cta} <ArrowRight />
                  </a>
                )}
                <Link preload="intent" to="/app/home" className="button carousel-secondary">
                  Enter the network
                </Link>
              </div>
            </div>

            <div className="carousel-visual company-logo-visual" aria-label="Start To Up">
              <div className="company-logo-stage">
                <span>STARTUP OPERATING SYSTEM</span>
                <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" decoding="async" fetchPriority={index === 0 ? "high" : "auto"} />
                <p>Connect · Build · Launch · Upscale</p>
                <div className="company-logo-proof">
                  {slide.proof.map((item) => <strong key={item}>{item}</strong>)}
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className="carousel-controls">
          <button onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft /></button>
          <div>
            {slides.map((slide, index) => (
              <button
                key={slide.kicker}
                className={index === active ? "active" : ""}
                onClick={() => setActive(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              ><i /></button>
            ))}
          </div>
          <button onClick={() => move(1)} aria-label="Next slide"><ArrowRight /></button>
        </div>
        <span className="carousel-count">0{active + 1} / 0{slides.length}</span>
      </div>
    </section>
  );
}
