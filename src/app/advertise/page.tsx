'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MegaphoneIcon,
  UserGroupIcon,
  ChartBarIcon,
  TrophyIcon,
  SparklesIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const stats = [
  { label: 'Active Gamers', value: '10K+', icon: UserGroupIcon },
  { label: 'Monthly Views', value: '100K+', icon: ChartBarIcon },
  { label: 'Tournaments', value: '50+', icon: TrophyIcon },
  { label: 'Engagement Rate', value: '85%', icon: SparklesIcon },
];

const adFormats = [
  {
    name: 'Feed Ads',
    description: 'Native ads that appear seamlessly in the main feed alongside posts and matches.',
    features: ['High visibility', 'Native format', 'Targeted placement'],
  },
  {
    name: 'Sponsored Stories',
    description: 'Featured placement in the stories carousel at the top of the feed.',
    features: ['Premium position', 'Full-screen view', 'Animated transitions'],
  },
  {
    name: 'Tournament Sponsorship',
    description: 'Brand your tournaments and get exclusive visibility during competitive events.',
    features: ['Logo placement', 'Custom branding', 'Event integration'],
  },
  {
    name: 'Banner Ads',
    description: 'Traditional banner placements across the platform for maximum reach.',
    features: ['Wide reach', 'Multiple sizes', 'Flexible placement'],
  },
];

const benefits = [
  'Reach the next generation of gamers',
  'Highly engaged youth esports audience',
  'Authentic gaming environment',
  'Flexible campaign options',
  'Real-time performance analytics',
  'Dedicated account management',
];

export default function AdvertisePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    budget: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Thank you for your interest! We'll be in touch within 24-48 hours.");
    setFormData({
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      budget: '',
      message: '',
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
              <MegaphoneIcon className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-medium">Advertise with Gamzic</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Reach the Next Generation of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Gamers
              </span>
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-8">
              Connect your brand with passionate young esports enthusiasts. Our platform offers
              authentic engagement opportunities in the heart of competitive gaming.
            </p>
            <Button
              size="lg"
              onClick={() =>
                document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-y border-dark-700/50 bg-dark-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-dark-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Formats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Advertising Formats</h2>
            <p className="text-dark-300 max-w-xl mx-auto">
              Choose from a variety of ad formats designed to maximize engagement and brand
              visibility.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {adFormats.map((format, index) => (
              <motion.div
                key={format.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="glass" className="h-full">
                  <h3 className="text-xl font-bold text-white mb-2">{format.name}</h3>
                  <p className="text-dark-300 mb-4">{format.description}</p>
                  <ul className="space-y-2">
                    {format.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-dark-400">
                        <CheckCircleIcon className="w-4 h-4 text-cyan-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-dark-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-6">
                Why Advertise on Gamzic?
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-dark-200">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card variant="neon" className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Premium Partner Program</h3>
                <p className="text-dark-300 mb-6">
                  Join our exclusive partner program for enhanced visibility, custom integrations,
                  and dedicated support.
                </p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Learn More
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-dark-300">
              Ready to reach our gaming audience? Fill out the form below and our team will contact
              you within 24-48 hours.
            </p>
          </div>
          <Card variant="glass">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  placeholder="Your company"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  leftIcon={<BuildingOffice2Icon className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Contact Name"
                  placeholder="Your name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Phone (Optional)"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <Input
                label="Estimated Budget"
                placeholder="e.g., $1,000 - $5,000/month"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <TextArea
                label="Tell us about your campaign"
                placeholder="What are your advertising goals? What products/services would you like to promote?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                required
              />
              <Button type="submit" fullWidth isLoading={isSubmitting}>
                Submit Inquiry
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-t border-dark-700/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Questions? We&apos;re here to help.
          </h2>
          <p className="text-dark-300 mb-6">
            Email us directly at{' '}
            <a href="mailto:ads@gamzic.com" className="text-cyan-400 hover:text-cyan-300">
              ads@gamzic.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
