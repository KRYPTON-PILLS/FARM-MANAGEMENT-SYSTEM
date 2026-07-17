import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Wallet,
  BarChart3,
  CalendarClock,
  Package,
  Bot,
  Store,
  PawPrint,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  PlayCircle,
} from 'lucide-react';
import { useOnboarding } from '../components/onboarding/OnboardingProvider';

const GETTING_STARTED_STEPS = [
  'Complete your profile',
  'Add livestock',
  'Add crops',
  'Record farm activities',
  'Record production',
  'Record sales',
  'Record expenses',
  'View reports',
  'Use the AI Assistant',
];

const FEATURES = [
  { icon: PawPrint, title: 'Livestock Management', description: 'Track every animal — health, breeding, vaccinations, and production history.' },
  { icon: Sprout, title: 'Crop Management', description: 'Manage planting, irrigation, fertilization, and harvests for every field.' },
  { icon: Wallet, title: 'Financial Management', description: 'Record sales and expenses, and see your real profit at a glance.' },
  { icon: BarChart3, title: 'Reports & Analytics', description: 'Turn your farm records into financial, livestock, crop, and feed reports.' },
  { icon: CalendarClock, title: 'Activity Planner', description: 'Schedule and track vaccinations, feeding, harvests, and daily tasks.' },
  { icon: Package, title: 'Inventory Management', description: 'Keep tabs on feed, medicine, and equipment stock before it runs low.' },
  { icon: Bot, title: 'AI Farm Assistant', description: 'Ask questions about your farm and get recommendations in plain language.' },
  { icon: Store, title: 'Marketplace', description: 'Buy and sell livestock, crops, machinery, and supplies with other farmers.' },
];

const FAQS = [
  { q: 'How do I add livestock?', a: 'Go to Animals, choose the species category, and click "Add Animal." Fill in the basic details — you can add health and breeding records any time from the animal\'s profile.' },
  { q: 'How do I record milk production?', a: 'Open the animal\'s profile from the Animals page and log production there, or use the quick action on the Dashboard for faster entry across multiple animals.' },
  { q: 'How do I add crops?', a: 'Go to Crops and click "Add Crop." You can record the field, planting date, and expected yield, then update it as the crop progresses.' },
  { q: 'How do I record expenses?', a: 'Expenses are recorded from the Sales & Finances area — add an expense entry with a category, amount, and date, and it flows straight into your Financial Reports.' },
  { q: 'How do I generate reports?', a: 'Go to Reports and pick a section — Financials, Livestock & Health, Production, Crops & Feed, or Activity & Inventory. Every report is generated automatically from what you\'ve already recorded.' },
  { q: 'How do I manage inventory?', a: 'Feed, medicine, and equipment stock are tracked from the Inventory section — add items with a quantity and cost, and low-stock items are flagged automatically.' },
  { q: 'How do I use the AI Assistant?', a: 'Open the Assistant hub. Currently the user is able to add events in the calendar and the AI helps in managing the farm.' },
];

const RECENT_FEATURES = ['Reports & Analytics', 'Marketplace', 'Livestock Management', 'Crop Management', 'AI Assistant', 'Inventory Tracking'];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-green-900">{q}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function HelpCenter() {
  const navigate = useNavigate();
  const { restartTour } = useOnboarding();

  const handleRestartTour = () => {
    restartTour();
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

      {/* About */}
      <section>
        <h1 className="text-3xl font-bold text-green-900 mb-3">About FanakaCo</h1>
        <p className="text-gray-600 leading-relaxed mb-2">
          FanakaCo is a complete Farm Operating System — one place to manage livestock, crops,
          finances, inventory, production, and daily farm activities, with reports and an AI
          assistant built on top of your own records.
        </p>
        <p className="text-gray-600 leading-relaxed mb-2">
          <span className="font-semibold text-green-900">Our mission</span> is to give every
          farmer — from a single smallholder plot to a growing commercial operation — the same
          quality of business insight that used to require expensive software or a full-time
          accountant.
        </p>
        <p className="text-gray-600 leading-relaxed mb-2">
          <span className="font-semibold text-green-900">Our vision</span> is a future where no
          farmer makes a major decision — what to plant, when to sell, which animal to breed —
          without clear, accurate data behind it.
        </p>
        <p className="text-gray-600 leading-relaxed">
          FanakaCo exists because farm management has historically meant scattered paper records
          and guesswork. It's built for farmers who want to run their operation like the business
          it already is.
        </p>
      </section>

      {/* Getting Started */}
      <section>
        <h2 className="text-xl font-bold text-green-900 mb-4">Getting Started</h2>
        <ol className="space-y-2">
          {GETTING_STARTED_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Feature Overview */}
      <section>
        <h2 className="text-xl font-bold text-green-900 mb-4">Feature Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
                <Icon size={18} className="text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-green-900 mb-1">{title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold text-green-900 mb-4">Frequently Asked Questions</h2>
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 px-5">
          {FAQS.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </section>

      {/* Tutorials */}
      <section>
        <h2 className="text-xl font-bold text-green-900 mb-4">Tutorials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Getting started with FanakaCo', 'Recording your first sale', 'Reading your reports'].map((title) => (
            <div key={title} className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
              <PlayCircle size={28} className="text-gray-300 mb-2" />
              <p className="text-xs font-medium text-gray-500">{title}</p>
              <p className="text-[11px] text-gray-400 mt-1">Video coming soon</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section>
        <h2 className="text-xl font-bold text-green-900 mb-4">Contact Support</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'support@fanakaco.com' },
            { icon: Phone, label: '+254 700 000 000' },
            { icon: MessageCircle, label: 'Chat on WhatsApp' },
            { icon: Globe, label: 'www.fanakaco.com' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-white shadow-sm border border-gray-100 p-4">
              <Icon size={16} className="text-green-700" />
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Version + Recent Features */}
      <section className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">Version</p>
          <p className="text-sm font-bold text-green-900">FanakaCo Version 1.0</p>
        </div>
        <div className="flex-[2] rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-2">Recent Features</p>
          <div className="flex flex-wrap gap-2">
            {RECENT_FEATURES.map((f) => (
              <span key={f} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Restart Tour */}
      <section className="text-center pt-4">
        <button
          onClick={handleRestartTour}
          className="px-6 py-2.5 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
        >
          Take the Product Tour Again
        </button>
      </section>

    </div>
  );
}