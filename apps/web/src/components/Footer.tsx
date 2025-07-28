// components/Footer.tsx
// import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface-alt text-secondaryText py-10 px-6 mt-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* Left: Branding */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-2">Zynqer</h3>
          <p className="text-sm max-w-sm">
            Real talk across differences. Join structured conversations powered by curiosity and transparency.
          </p>
        </div>

        {/* Center: Links */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-white font-medium mb-2">Platform</h4>
            <ul className="space-y-1">
              <li><Link to="/learn-more" className="hover:text-white transition">How It Works</Link></li>
              <li><Link to="/ranking" className="hover:text-white transition">Ranking System</Link></li>
              <li><Link to="/chat" className="hover:text-white transition">Live Chat</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Legal</h4>
            <ul className="space-y-1">
              <li><Link to="/terms" className="hover:text-white transition">Terms of Use</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Right: Socials or CTA */}
        <div>
          <h4 className="text-white font-medium mb-2">Stay in the Loop</h4>
          <p className="text-sm mb-4">Follow us for updates and discussions.</p>
          <div className="flex gap-4">
            {/* Replace with actual icons or social links */}
            <a href="https://x.com" target="_blank" className="hover:text-white">X</a>
            <a href="https://discord.com" target="_blank" className="hover:text-white">Discord</a>
            <a href="https://linkedin.com" target="_blank" className="hover:text-white">LinkedIn</a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-mutedText">
        © {new Date().getFullYear()} Zynqer. All rights reserved.
      </div>
    </footer>
  );
}
