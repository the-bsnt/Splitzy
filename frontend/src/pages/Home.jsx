import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Wallet, PieChart } from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-white to-purple-100 flex flex-col items-center justify-center px-6 text-center">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center py-6 max-w-6xl">
        <Link to="/" className="flex items-center">
          <img src="/src/assets/splitzy.svg" className="mr-3 h-12" alt="Logo" />
        </Link>
        <div className="space-x-3">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mt-10 max-w-3xl"
      >
        <h2 className="text-5xl font-extrabold text-gray-800 mb-4">
          Split Bills, Share Expenses, Stay Balanced
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          With <span className="font-semibold text-indigo-600">Splitzy</span>,
          manage shared expenses effortlessly with your friends, roommates, or
          teams.
        </p>

        <div className="flex justify-center gap-4">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl"
      >
        <FeatureCard
          icon={<Users className="h-10 w-10 text-indigo-600" />}
          title="Group Management"
          desc="Easily create and manage groups for trips, events, or shared living."
        />
        <FeatureCard
          icon={<Wallet className="h-10 w-10 text-indigo-600" />}
          title="Expense Tracking"
          desc="Add, split, and record every expense to stay transparent with your group."
        />
        <FeatureCard
          icon={<PieChart className="h-10 w-10 text-indigo-600" />}
          title="Smart Insights"
          desc="Visualize spending patterns and see who owes whom instantly."
        />
      </motion.div>

      {/* Footer */}
      <footer className="mt-24 py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Splitzy — Simplify Shared Expenses.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 text-center hover:shadow-lg transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
