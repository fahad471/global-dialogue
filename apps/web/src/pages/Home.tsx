// import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer"; // adjust path if needed

export default function HomePage() {
  const navigate = useNavigate();
  const isLoggedIn = false;

  function handleJoinClick() {
    if (isLoggedIn) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  }

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text)] min-h-screen flex flex-col font-sans">
      {/* Main content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-background)]">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            MicSpot: Real Talk Across Differences
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-mutedText)] max-w-2xl mb-8">
            Join live video conversations with people around the world — matched by beliefs, values, and curiosity.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={handleJoinClick}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-2 rounded-xl text-lg"
            >
              Join the Conversation
            </Button>
            <Button
              onClick={() => navigate("/learn-more")}
              variant="outline"
              className="text-white border-[var(--color-border)] hover:border-white"
            >
              Learn More
            </Button>
          </div>
        </section>

        {/* What is MicSpot */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">What is MicSpot?</h2>
          <p className="text-[var(--color-secondaryText)] text-lg max-w-3xl mx-auto">
            MicSpot is a structured space for meaningful conversations — where users disclose ideology, values, and preferences to enable transparent, respectful dialogue.
          </p>
          <div className="grid md:grid-cols-2 gap-10 mt-12">
            {[
              {
                title: "🧠 Transparent Profiles",
                desc: "See a user's ideological stance, personality type, and topic expertise before you connect.",
              },
              {
                title: "🎯 Smart Matching",
                desc: "Talk to people who agree with you, challenge your views, or surprise you entirely.",
              },
              {
                title: "🎙️ Real Conversations",
                desc: "Join live audio/video chats guided by shared or opposing ideas.",
              },
              {
                title: "🏆 Reputation System",
                desc: "Earn credibility and badges based on your dialogue quality and peer ratings.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-lg text-left"
              >
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[var(--color-secondaryText)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[var(--color-surface-alt)] py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Start your first real dialogue today</h2>
          <p className="text-[var(--color-secondaryText)] mb-8">
            Sign up, get matched, and start talking — one idea at a time.
          </p>
          <Button
            onClick={() => navigate("/signup")}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-3 rounded-xl text-lg"
          >
            Sign Up Now <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
