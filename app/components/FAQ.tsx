'use client';

import React, { useState } from 'react';
import { Plus, Minus, ArrowRight } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* DATA: YOUR QUESTIONS                                                       */
/* -------------------------------------------------------------------------- */
const faqs = [
  {
    question: "How does Elvance help me track campaign performance?",
    answer: "Elvance gives you a complete view of every campaign's performance. We track KPIs like leads, spend, ROAS, and CPL for each client, then calculate true campaign ROI. Without Elvance, you might think a campaign is profitable because you're only looking at revenue. With Elvance, you see the full picture including ad spend, tool costs, and time investment. Now you know which campaigns are truly profitable and which need optimization."
  },
  {
    question: "What are pending deliverables?",
    answer: "Pending deliverables are work items that haven't been completed or approved yet. Campaign assets waiting for client feedback, reports that need to be generated, or projects that are in progress. These can delay client satisfaction and impact your agency's reputation. Elvance shows you all pending deliverables when you view a client dashboard so you can prioritize and complete them quickly."
  },
  {
    question: "How does client success tracking work?",
    answer: "When you complete a campaign in Elvance, we instantly show you all pending deliverables still linked to that client. You see deliverable types, due dates, approval status, and one-click update options. Never miss a deliverable deadline again. One completed deliverable can lead to client retention and referrals worth thousands."
  },
  {
    question: "Can Elvance automatically link deliverables to clients?",
    answer: "Yes. Our system learns from your past patterns. If you created 'Ad Creative' deliverables for 'Acme Corp' multiple times, we'll suggest 'Acme Corp' when you create a new ad creative deliverable. We also match based on project names and client tags. Most deliverables get linked correctly, saving you time."
  },
  {
    question: "Is my client data secure?",
    answer: "Yes. We use bank-level encryption for all stored documents and data. Your client information and campaign data are never shared with third parties and are never used to train AI models. Only people in your organization can see your client dashboards and deliverables."
  },
  {
    question: "What services can I manage in Elvance?",
    answer: "Elvance supports core marketing services like Paid Ads, SEO, Web Development, Content Creation, and CRM/Automation. We also support AI-powered services including AI Receptionist, AI Chatbot, AI Lead Generation, AI Follow-Up Automation, and AI Ad Creative generation. Track deliverables, KPIs, and performance metrics for any service you offer."
  },
  {
    question: "What if I already use project management tools?",
    answer: "Elvance transforms project management from 'task tracking' (internal only) into 'client-facing deliverables' (what clients actually see). Generic project tools don't create beautiful client dashboards or track marketing KPIs. Our client portal that shows deliverables, updates, and performance metrics in one place is hard to replicate elsewhere."
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT: SINGLE FAQ ITEM                                                 */
/* -------------------------------------------------------------------------- */
const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-start justify-between text-left group"
      >
        <span className={`text-lg font-medium transition-colors duration-300 ${isOpen ? 'text-[#D6B36A]' : 'text-white group-hover:text-[#D6B36A]/80'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          {question}
        </span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {/* We swap the icon or just rotate the Plus */}
          {isOpen ? <Minus className="h-5 w-5 text-[#D6B36A]" /> : <Plus className="h-5 w-5 text-neutral-500 group-hover:text-white" />}
        </span>
      </button>

      {/* The Answer (Collapsible) */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="text-neutral-400 leading-relaxed pr-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN SECTION                                                               */
/* -------------------------------------------------------------------------- */
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0); // First one open by default

  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-4" style={{ fontFamily: "'canela-text', serif" }}>
              Common questions
            </h2>
            <p className="text-neutral-400 text-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
              Everything you need to know about tracking campaign performance and stopping inactive deliverables.
            </p>
          </div>

          {/* Contact Link (Replaces the awkward floating links) */}
          <a
            href="mailto:support@renlu.ca"
            className="hidden md:flex items-center gap-2 text-white border-b border-teal-500 pb-0.5 hover:text-[#D6B36A] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Contact Support <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* The List Container */}
        <div className="bg-neutral-900/30 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>

        {/* Mobile Contact Link (Visible only on small screens) */}
        <div className="mt-8 md:hidden">
           <a
             href="mailto:support@renlu.ca"
             className="text-[#D6B36A] font-medium flex items-center gap-2"
             style={{ fontFamily: "'Inter', sans-serif" }}
           >
             Still have questions? Chat with us <ArrowRight className="h-4 w-4" />
           </a>
        </div>

      </div>
    </section>
  );
}
