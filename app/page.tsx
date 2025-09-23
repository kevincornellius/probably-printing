"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [printersOnline, setPrintersOnline] = useState(3);
  const [jobsInQueue, setJobsInQueue] = useState(42);
  const [pagesPerSecond, setPagesPerSecond] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrintersOnline((prev) => (prev === 5 ? 3 : prev + 1));
      setJobsInQueue((prev) =>
        Math.max(0, prev + Math.floor(Math.random() * 10) - 5)
      );
      setPagesPerSecond(Math.floor(Math.random() * 8) + 2);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "🖥️",
      title: "Centralized Control",
      description: "Single dashboard for all contest printers",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: "📋",
      title: "Smart Queue",
      description: "Redis-powered reliability and fairness",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: "⚡",
      title: "Real-time Monitoring",
      description: "Live status, progress, and alerts",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: "🔄",
      title: "Auto Recovery",
      description: "Retry failed jobs, reroute to backups",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: "📊",
      title: "Usage Analytics",
      description: "Track printing metrics and history",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <header className="text-center mb-16 space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-full p-4">
                <Image
                  src="/file.svg"
                  alt="ProbablyPrinting logo"
                  width={64}
                  height={64}
                  className="dark:invert"
                />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Probably
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Printing
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            🚀 The{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              ultimate
            </span>{" "}
            printer management system for
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {" "}
              competitive programming contests
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <span className="relative z-10">Get Started 🎯</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400" onClick={() => router.push('/submit')}>
              Live Demo 📱
            </button>
          </div>
        </header>

        {/* Live Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {printersOnline}/5
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                🖨️ Printers Online
              </div>
              <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${(printersOnline / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {jobsInQueue}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                📄 Jobs in Queue
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {jobsInQueue > 30
                  ? "🔥 High Load"
                  : jobsInQueue > 15
                  ? "⚡ Moderate"
                  : "✅ Low Load"}
              </div>
            </div>

            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-xl border border-white/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {pagesPerSecond}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                📊 Pages/sec
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Real-time throughput
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-slate-800 dark:text-white">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ProbablyPrinting
            </span>
            ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/20 hover:border-blue-200 dark:hover:border-blue-800"
              >
                <div
                  className={`text-4xl mb-4 inline-block p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Problem Statement */}
        <section className="mb-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-3xl p-8 sm:p-12 border-2 border-orange-200 dark:border-orange-800">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-orange-800 dark:text-orange-200">
              🚨 The Contest Printing Crisis
            </h3>
            <div className="space-y-4 text-slate-700 dark:text-slate-300">
              <p className="text-lg leading-relaxed">
                During high-stakes programming contests, every second counts.
                But what happens when:
              </p>
              <ul className="space-y-3 text-base sm:text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">💥</span>
                  <span>
                    Printers jam during critical problem statement distribution
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">📚</span>
                  <span>
                    Print jobs pile up and participants wait for clarifications
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">⏰</span>
                  <span>
                    Staff waste precious time troubleshooting instead of
                    managing the contest
                  </span>
                </li>
              </ul>
              <p className="text-lg leading-relaxed font-semibold text-green-700 dark:text-green-300 mt-6">
                💡{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  ProbablyPrinting
                </span>{" "}
                eliminates these headaches with intelligent automation and
                real-time monitoring!
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to revolutionize your contest printing? 🚀
            </h3>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Join the ranks of successful contest organizers who never worry
              about printing again.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Start Printing ✨
              </button>
              <button className="px-8 py-4 bg-blue-800 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-blue-300">
                View Documentation 📖
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 mt-20 py-8 text-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
        <p>
          &copy; {new Date().getFullYear()} ProbablyPrinting. Making contests
          run smoother, one print job at a time. 🖨️✨
        </p>
      </footer>
    </div>
  );
}
