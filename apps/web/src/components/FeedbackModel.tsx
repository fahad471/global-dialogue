// components/FeedbackModal.tsx
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function FeedbackModal({ onSubmit, userId, partnerId, durationSec }: any) {
  const [topics, setTopics] = useState<string[]>([]);
  const [form, setForm] = useState({
    knowledge: 5,
    respectfulness: 5,
    engagement: 5,
    clarity: 5,
    overall: 5,
    feedback: "",
    topic: "",
    stance: "for",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("topics").select("name");
      if (data) setTopics(data.map((t) => t.name));
    })();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      ...form,
      user_id: userId,
      partner_id: partnerId,
      call_duration_sec: durationSec,
    };
    await onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] p-6 rounded-xl w-full max-w-md space-y-4 border border-gray-700 text-white">
        <h2 className="text-2xl font-semibold text-center">Call Feedback</h2>

        {["knowledge", "respectfulness", "engagement", "clarity", "overall"].map((field) => (
          <div key={field}>
            <label className="block mb-1 capitalize">{field}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={(form as any)[field]}
              onChange={(e) => setForm({ ...form, [field]: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}

        <div>
          <label>Topic</label>
          <select
            className="w-full bg-gray-800 p-2 rounded"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          >
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Stance</label>
          <select
            className="w-full bg-gray-800 p-2 rounded"
            value={form.stance}
            onChange={(e) => setForm({ ...form, stance: e.target.value })}
          >
            <option value="for">For</option>
            <option value="against">Against</option>
          </select>
        </div>

        <textarea
          placeholder="Additional feedback (optional)"
          className="w-full bg-gray-800 p-2 rounded"
          value={form.feedback}
          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
        />

        <button
          className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded"
          onClick={handleSubmit}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
