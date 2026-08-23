import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Code2, Rocket, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    kicker: "INNOVATION & VENTURE DEVELOPMENT",
    title: "We turn ambitious ideas into ventures built to move.",
    body: "Strategy, technology, brand, launch and growth support—designed around the realities of African founders and future-facing businesses.",
    cta: "Build with Start To Up",
    href: "#contact",
    accent: "gold",
    visual: "journey",
  },
  {
    kicker: "PRODUCT & TECHNOLOGY STUDIO",
    title: "From the first wireframe to a product people can actually use.",
    body: "We design and develop premium websites, platforms, business systems and digital products with a clear commercial purpose.",
    cta: "Explore our services",
    href: "#services",
    accent: "blue",
    visual: "product",
  },
  {
    kicker: "A VENTURE ALREADY IN MOTION",
    title: "ResKonnect proves that we build beyond presentations.",
    body: "Our living, AI and opportunity ecosystem connects students and young people to accommodation, application readiness and pathways forward.",
    cta: "Visit ResKonnect",
    href: "https://www.reskonnect.org/",
    accent: "green",
    visual: "reskonnect",
  },
] as const;

export function CompanyCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const move = (direction: number) =>
    setActive((current) => (current + direction + slides.length) % slides.length);

  return (
    <section
      className="company-carousel shell-width"
      aria-roledescription="carousel"
      aria-label="Start To Up company highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
                {slide.href.startsWith("http") ? (
                  <a
                    href={slide.href}
                    target="_blank"
                    rel="noreferrer"
                    className="button carousel-primary"
                  >
                    {slide.cta} <ArrowRight />
                  </a>
                ) : (
                  <a href={slide.href} className="button carousel-primary">
                    {slide.cta} <ArrowRight />
                  </a>
                )}
                <Link to="/app/home" className="button carousel-secondary">
                  Enter the network
                </Link>
              </div>
            </div>
            <CarouselVisual type={slide.visual} />
          </article>
        ))}
        <div className="carousel-controls">
          <button onClick={() => move(-1)} aria-label="Previous slide">
            <ArrowLeft />
          </button>
          <div>
            {slides.map((slide, index) => (
              <button
                key={slide.kicker}
                className={index === active ? "active" : ""}
                onClick={() => setActive(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              >
                <i />
              </button>
            ))}
          </div>
          <button onClick={() => move(1)} aria-label="Next slide">
            <ArrowRight />
          </button>
        </div>
        <span className="carousel-count">
          0{active + 1} / 0{slides.length}
        </span>
      </div>
    </section>
  );
}

function CarouselVisual({ type }: { type: (typeof slides)[number]["visual"] }) {
  if (type === "reskonnect")
    return (
      <div className="carousel-visual reskonnect-visual">
        <div className="gold-glass-card product-proof-card">
          <span>VENTURE 01</span>
          <div className="reskonnect-lockup">
            <img src="/brand/reskonnect-product-icon.png" alt="ResKonnect" />
            <div>
              <strong>RESKONNECT</strong>
              <small>LIVING · AI · OPPORTUNITY</small>
            </div>
          </div>
          <p>Student living, application readiness and youth opportunity infrastructure.</p>
          <div className="proof-tags">
            <span>LIVE PRODUCT</span>
            <span>SOUTH AFRICA</span>
          </div>
        </div>
      </div>
    );
  if (type === "product")
    return (
      <div className="carousel-visual product-visual-premium">
        <div className="gold-glass-card product-window">
          <div className="window-top">
            <i />
            <i />
            <i />
          </div>
          <Code2 />
          <strong>BUILD / TEST / LAUNCH</strong>
          <span>Premium digital infrastructure</span>
          <div className="code-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="floating-gold-chip">
          <BadgeCheck /> Production-minded
        </div>
      </div>
    );
  return (
    <div className="carousel-visual journey-visual-premium">
      <div className="venture-orbit">
        <Rocket />
        <i />
        <i />
        <i />
      </div>
      <div className="gold-glass-card venture-card">
        <span>VENTURE PATH</span>
        <strong>IDEA → IMPACT</strong>
        <div>
          <ShieldCheck /> Protected by design
        </div>
      </div>
    </div>
  );
}
