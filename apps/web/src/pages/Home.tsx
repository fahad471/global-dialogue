import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";

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
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-background)] overflow-hidden">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <img
              src="/assets/logo.png"
              alt="Zynqer logo background"
              className="opacity-30 dark:opacity-5 max-w-xs md:max-w-lg select-none"
              style={{
                filter: "grayscale(100%) blur(1.5px)",
                userSelect: "none",
                transform: "translateY(2%)",
              }}
            />
          </div>
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
              {
                title: "🗣️ Build Speaking Skills",
                desc: "Develop clearer expression, stronger arguments, and better listening through real conversations.",
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

        {/* How It Works */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-10 text-left">
            {[
              {
                title: "1. Create Your Profile",
                desc: "Share your values, beliefs, communication style, and preferred discussion topics.",
              },
              {
                title: "2. Get Matched Intelligently",
                desc: "Our algorithm connects you with people who either align or respectfully differ.",
              },
              {
                title: "3. Engage in Dialogue",
                desc: "Join real-time conversations with prompts designed to spark insight, not conflict.",
              },
              {
                title: "4. Build Reputation",
                desc: "Receive feedback, earn trust, and grow your credibility as a thoughtful communicator.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-lg"
              >
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-[var(--color-secondaryText)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Zynqer Matters */}
        <section className="bg-[var(--color-surface-alt)] py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Why Zynqer Matters</h2>
          <p className="max-w-3xl mx-auto text-lg text-[var(--color-secondaryText)]">
            In a world increasingly divided by ideology and filtered by algorithms, authentic dialogue is rare.
            Zynqer is built to bring people back into respectful, curiosity-driven conversations — even when they disagree.
          </p>
          <p className="mt-4 max-w-3xl mx-auto text-md text-[var(--color-secondaryText)]">
            It’s more than just a platform — it’s a movement to restore empathy, clarity, and community through transparent, meaningful interaction.
          </p>
        </section>

        {/* Grow Your Voice Section */}
        <section className="bg-[var(--color-surface)] py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Grow Your Voice</h2>
          <p className="text-[var(--color-secondaryText)] text-lg max-w-3xl mx-auto mb-6">
            Zynqer isn’t just about dialogue — it’s a space to build your voice. Learn to speak with clarity, structure arguments, and listen with empathy.
          </p>
          <p className="text-[var(--color-secondaryText)] text-md max-w-3xl mx-auto">
            Whether you're preparing for debates, interviews, or everyday discussions, Zynqer helps you gain real-world communication skills through practice, feedback, and meaningful challenge.
          </p>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">What People Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Jordan M.",
                quote: "I've had some of the most thoughtful conversations of my life on Zynqer. It's a refreshing space.",
              },
              {
                name: "Aliyah R.",
                quote: "I was matched with someone who completely disagreed with me — but we actually *listened* to each other.",
              },
              {
                name: "Tom S.",
                quote: "Zynqer is like structured honesty therapy. I feel seen *and* challenged every time I log in.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-[var(--color-surface)] p-6 rounded-2xl shadow">
                <p className="italic text-[var(--color-secondaryText)]">"{item.quote}"</p>
                <p className="mt-4 font-semibold">{item.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="bg-[var(--color-background)] py-20 px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-[var(--color-secondaryText)] max-w-4xl mx-auto text-lg">
            Zynqer exists to make hard conversations easier. We believe in truth-seeking over tribalism, and we’re building the infrastructure for a world where people speak, listen, and grow — together.
          </p>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6 max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6 text-left">
            <div>
              <h3 className="font-bold">Is Zynqer a social media platform?</h3>
              <p className="text-[var(--color-secondaryText)]">Not in the traditional sense. Zynqer is a platform for structured, human conversations — with a feedback system to help you grow as a communicator.</p>
            </div>
            <div>
              <h3 className="font-bold">Is it moderated?</h3>
              <p className="text-[var(--color-secondaryText)]">Yes. Every conversation is monitored by shared community guidelines and tools that promote civility.</p>
            </div>
            <div>
              <h3 className="font-bold">Can I remain anonymous?</h3>
              <p className="text-[var(--color-secondaryText)]">You can choose to remain pseudonymous, but values and conversation history remain transparent to others.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
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
