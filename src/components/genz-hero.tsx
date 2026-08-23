import { Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Heart, MessageCircle, Rocket, Sparkles, Users } from "lucide-react";

export function GenZHero() {
  return <section className="genz-hero" aria-labelledby="genz-hero-title">
    <div className="genz-sky" aria-hidden="true"><i/><i/><i/></div>
    <div className="shell-width genz-hero-grid">
      <div className="genz-copy">
        <span className="genz-eyebrow"><Sparkles/> BUILT FOR THE GENERATION THAT BUILDS</span>
        <h1 id="genz-hero-title">Turn the idea into something <em>real.</em></h1>
        <p>Start To Up is the innovation operating network for developers, founders, creators, investors and institutions building the next company, product or movement.</p>
        <div className="genz-actions"><Link preload="intent" to="/app/home" className="button button-primary button-large">Enter the network <ArrowRight/></Link><Link preload="intent" to="/app/website-studio-templates" className="button button-secondary button-large">Explore templates</Link></div>
        <div className="genz-proof"><span><Users/> Build together</span><span><Code2/> Ship real products</span><span><Rocket/> Launch & scale</span></div>
      </div>

      <div className="genz-scene" aria-label="Animated Start To Up creator network scene">
        <div className="genz-orbit genz-orbit-one"/><div className="genz-orbit genz-orbit-two"/>
        <div className="genz-social-card">
          <header><img src="/brand/start-to-up-symbol.png" alt=""/><div><strong>@start_to_up</strong><span>building now</span></div><b>LIVE</b></header>
          <div className="genz-stage"><span>CREATE</span><div className="genz-product-card"><small>BUILD LOG #024</small><strong>Idea → prototype → launch</strong><p>Share progress. Find collaborators. Ship faster.</p><i/></div></div>
          <footer><span><Heart fill="currentColor"/> 12.4K</span><span><MessageCircle/> 684</span><span><Rocket/> 1.8K builds</span></footer>
        </div>
        <div className="genz-float genz-code"><Code2/><span>src/</span><strong>shipping</strong></div>
        <div className="genz-float genz-heart"><Heart fill="currentColor"/></div>
        <div className="genz-float genz-chat"><MessageCircle/><i/><i/><i/></div>
        <div className="genz-float genz-rocket"><Rocket/><span>LAUNCH</span></div>
        <div className="genz-chip genz-chip-a">FOUNDERS</div><div className="genz-chip genz-chip-b">DEVELOPERS</div><div className="genz-chip genz-chip-c">INVESTORS</div>
      </div>
    </div>
    <div className="genz-marquee" aria-label="Start To Up capabilities"><div><span>IDEAS</span><b>✦</b><span>CODE</span><b>✦</b><span>CONTENT</span><b>✦</b><span>CAPITAL</span><b>✦</b><span>COLLABORATION</span><b>✦</b><span>LAUNCH</span><b>✦</b><span>SCALE</span></div></div>
  </section>;
}
