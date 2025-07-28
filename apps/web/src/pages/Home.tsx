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
        <section
          className="relative flex flex-col items-center justify-center text-center px-6 py-32 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-background)] overflow-hidden"
        >
          {/* Background logo */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <img
              src="/assets/logo.png" // <-- replace with your logo path
              alt="Zynqer logo background"
              className="opacity-30 dark:opacity-5 max-w-xs md:max-w-lg select-none"
              style={{
                filter: "grayscale(100%) blur(1.5px)",
                userSelect: "none",
                transform: "translateY(2%)", // lowers the logo by 20%
              }}
            />
          </div>

          {/* Foreground content */}
          <h1 className="relative text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-[var(--color-text)]">
            Zynqer: Real Talk Across Differences
          </h1>
          <p className="relative max-w-3xl text-lg md:text-xl text-[var(--color-mutedText)] mb-10 leading-relaxed">
            Step into a space where your voice matters — where curiosity, respect, and honest conversation bridge divides. Connect with people from all walks of life, and explore ideas beyond your own worldview.
          </p>
          <div className="relative flex gap-6">
            <Button
              onClick={handleJoinClick}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-3 rounded-2xl text-lg shadow-md"
            >
              Join the Conversation
            </Button>
            <Button
              onClick={() => navigate("/learn-more")}
              variant="outline"
              className="text-white border-[var(--color-border)] hover:border-white px-8 py-3 rounded-2xl text-lg"
            >
              Learn More
            </Button>
          </div>
        </section>

        {/* What is Zynqer */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">What is Zynqer?</h2>
          <p className="text-[var(--color-secondaryText)] text-lg max-w-3xl mx-auto">
            Zynqer is a structured space for meaningful conversations — where users disclose ideology, values, and preferences to enable transparent, respectful dialogue.
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
