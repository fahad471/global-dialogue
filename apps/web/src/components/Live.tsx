// import React from "react";
import Footer from "@/components/Footer";

export default function LiveStreamPromo() {
  return (
    <div
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
      className="min-h-screen flex flex-col font-sans"
    >
      {/* Hero / Main Promo */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-background)]">
        <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
          Zynqer Live
        </h1>
        <p className="text-xl max-w-3xl text-[var(--color-mutedText)] mb-12 leading-relaxed">
          Experience real conversations — streamed live.<br />
          Watch authentic dialogues unfold in real time, challenge ideas, and learn from every perspective.
        </p>
        <a
          href="/signup"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xl font-semibold px-12 py-4 rounded-xl transition"
        >
          Get Early Access
        </a>
      </section>

      {/* Features Highlight */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold mb-10 text-center">Why Watch Zynqer Live?</h2>
        <div className="grid md:grid-cols-3 gap-10 text-center">
          {[
            {
              emoji: "🎙️",
              title: "Authentic Dialogue",
              desc: "No scripts. No bots. Real people engaging in honest, respectful conversations.",
            },
            {
              emoji: "🌍",
              title: "Global Perspectives",
              desc: "Hear voices from around the world, with diverse beliefs and values.",
            },
            {
              emoji: "💡",
              title: "Learn & Reflect",
              desc: "Gain insight through live debates, storytelling, and thought-provoking discussions.",
            },
            {
              emoji: "🔴",
              title: "Live Interaction",
              desc: "Participate via chat or reaction tools, shaping the conversation dynamically.",
            },
            {
              emoji: "📈",
              title: "Community Growth",
              desc: "Support speakers and moderators with ratings and feedback in real time.",
            },
            {
              emoji: "📅",
              title: "Scheduled Streams",
              desc: "Tune in for upcoming talks or discover spontaneous dialogues happening right now.",
            },
          ].map(({ emoji, title, desc }, i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-3xl p-8 shadow-lg">
              <div className="text-[var(--color-primary)] text-5xl mb-4">{emoji}</div>
              <h3 className="text-2xl font-semibold mb-2">{title}</h3>
              <p className="text-[var(--color-secondaryText)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[var(--color-surface-alt)] py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6">Be the First to Experience Zynqer Live</h2>
        <p className="text-[var(--color-secondaryText)] max-w-3xl mx-auto mb-10">
          Sign up now to get early access and exclusive updates on our live conversation streaming feature.
        </p>
        <a
          href="/signup"
          className="inline-block bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-lg font-semibold px-14 py-4 rounded-xl transition"
        >
          Sign Up Today
        </a>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
