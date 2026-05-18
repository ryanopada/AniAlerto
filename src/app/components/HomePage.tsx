import { Link, useOutletContext } from "react-router";
import { Button } from "./ui/button";
import { MessageSquare, Bell, Users, BarChart, MapPin, Leaf, Calendar } from "lucide-react";
import { motion } from "motion/react";
import type { PublicOutletContext } from "./PublicLayout";

export function HomePage() {
  const { openLoginModal } = useOutletContext<PublicOutletContext>();
  const featureItems = [
    { icon: MessageSquare, title: "SMS Reminders", desc: "Automated notifications for irrigation and fertilization." },
    { icon: Bell, title: "Task Alerts", desc: "Schedule reminders based on crop growth stages." },
    { icon: Users, title: "Response Tracking", desc: "Monitor worker status via DONE, DELAY, or HELP keywords." },
    { icon: BarChart, title: "Reports", desc: "Generate compliance and farm activity history reports." }
  ];

  const stats = [
    { icon: MapPin, label: "50 Hectares", sub: "Total area" },
    { icon: Users, label: "25 Workers", sub: "Dedicated team" },
    { icon: Leaf, label: "12 Batches", sub: "Active crops" },
    { icon: Calendar, label: "Year-Round", sub: "Operation" }
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" },
  } as const;

  return (
    <div className="bg-gradient-to-br from-[#eef5ea] via-[#f7faf6] to-[#eff7ff] min-h-screen font-sans text-[#2C2C2C]">
      <section
        className="relative overflow-hidden h-[680px]"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(17, 59, 26, 0.45), rgba(12, 49, 30, 0.45)), url('https://images.unsplash.com/photo-1758414076901-bb430a9a0beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_30%)]" />
        <div className="absolute -left-16 top-24 w-40 h-40 rounded-full bg-[#90b274]/40 blur-3xl" />
        <div className="absolute right-10 top-32 w-56 h-56 rounded-full bg-[#5c8c4a]/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f8faf7]/40 blur-2xl" />

        <div className="container mx-auto relative z-10 h-full flex flex-col justify-center px-6 sm:px-8 lg:px-12">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
          >
            <motion.span
              className="inline-flex items-center justify-center rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.24em] text-white mb-6 backdrop-blur-sm shadow-lg"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              Farm operations powered by timely alerts
            </motion.span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-white drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">
              AniAlerto brings every farm reminder together.
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed mb-10">
              Seamlessly coordinate irrigation, fertilization, pest prevention, and harvesting through easy SMS workflows built for farm teams.
            </p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <Link to="/about">
                <Button size="lg" className="bg-[#556B2F] hover:bg-[#91b554] text-white px-8 transition-colors shadow-2xl shadow-[#263c1f]/15">
                  Learn More
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={openLoginModal}
                className="bg-white/90 text-[#2C2C2C] hover:bg-white border-white px-8 shadow-lg"
              >
                Admin Login
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.65 }}
          >
            <motion.div whileHover={{ y: -6, scale: 1.02 }} className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4">Instant Alerts</p>
              <h3 className="text-2xl font-semibold text-white mb-2">Irrigation & Feeding</h3>
              <p className="text-sm leading-relaxed text-white/80">
                Keep teams aligned with reminders exactly when the fields need care.
              </p>
            </motion.div>
            <motion.div whileHover={{ y: -6, scale: 1.02 }} className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4">Worker Response</p>
              <h3 className="text-2xl font-semibold text-white mb-2">Track Status Fast</h3>
              <p className="text-sm leading-relaxed text-white/80">
                Monitor DONE, DELAY, or HELP replies to keep daily operations moving.
              </p>
            </motion.div>
            <motion.div whileHover={{ y: -6, scale: 1.02 }} className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80 mb-4">Harvest Ready</p>
              <h3 className="text-2xl font-semibold text-white mb-2">Actionable Insight</h3>
              <p className="text-sm leading-relaxed text-white/80">
                Use SMS as the bridge between planning and the field, every season.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <motion.div className="space-y-8" {...fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#556B2F]/10 px-4 py-2 text-sm font-medium text-[#425c33] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#556B2F]" />
                Farm-ready communication for every team
              </div>
              <h2 className="text-4xl font-bold max-w-2xl">A complete field companion for your farm crew.</h2>
              <p className="text-lg text-[#4b5348] leading-relaxed max-w-3xl">
                AniAlerto helps managers deliver precise guidance to workers, removing the lag from manual coordination and turning SMS into a reliable operations channel.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-[#dbe7d6] bg-white p-6 shadow-lg">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#7b8b6e] mb-3">Simplified</p>
                  <p className="font-semibold text-[#2c3a25]">Fast setup with familiar SMS workflows.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="rounded-3xl border border-[#dbe7d6] bg-white p-6 shadow-lg">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#7b8b6e] mb-3">Reliable</p>
                  <p className="font-semibold text-[#2c3a25]">Clear alerts, confirmed responses, and visible task status.</p>
                </motion.div>
              </div>
            </motion.div>
            <motion.div className="relative" {...fadeUp} transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}>
              <div className="absolute inset-x-0 top-8 h-36 rounded-[2rem] bg-[#91b554]/15 blur-3xl" />
              <div className="relative rounded-[2rem] border border-[#d4e2c7] bg-gradient-to-br from-white to-[#f6fbf4] p-8 shadow-2xl">
                <div className="grid gap-5">
                  {featureItems.map((feature, i) => (
                    <motion.div
                      key={i}
                      className="group rounded-[1.5rem] border border-[#e7efe2] bg-white/90 p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl"
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.45, delay: i * 0.08 }}
                      whileHover={{ y: -6, scale: 1.01 }}
                    >
                      <feature.icon className="h-11 w-11 text-[#556B2F] mb-4 transition-colors duration-300 group-hover:text-[#91b554]" />
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-[#5f6a55]">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#f8fbf7]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-5xl mx-auto text-center mb-16" {...fadeUp}>
            <h2 className="text-4xl font-bold mb-4">Farm Overview</h2>
            <p className="text-lg text-[#556b41] max-w-2xl mx-auto leading-relaxed">
              Track progress across land, labor, and active crops with clear operational metrics.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="relative overflow-hidden rounded-[1.75rem] border border-[#e6efdf] bg-white p-8 shadow-lg"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[#91b554]/10" />
                <stat.icon className="h-12 w-12 text-[#91b554] mb-4" />
                <h3 className="text-3xl font-semibold mb-2">{stat.label}</h3>
                <p className="text-sm uppercase tracking-[0.3em] text-[#77916e]">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
          <motion.div className="mt-16 text-center" {...fadeUp}>
            <Link to="/farm-tour">
              <Button className="bg-[#556B2F] hover:bg-[#91b554] text-white px-10 py-6 text-lg rounded-full shadow-2xl transition-transform hover:-translate-y-1">
                Explore Our Farm
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative py-24 bg-[#556B2F] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.1),_transparent_30%)]" />
        <motion.div className="container mx-auto relative z-10 px-6 sm:px-8 lg:px-12 text-center" {...fadeUp}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Optimize Your Harvest?</h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Access the administrative dashboard to manage your farm operations and workers.
          </p>
          <button onClick={openLoginModal} className="inline-block">
            <Button size="lg" variant="outline" className="bg-white text-[#556B2F] hover:bg-[#f1f5ee] border-white px-12 py-7 text-xl font-bold transition-all shadow-2xl">
              Access Admin Dashboard
            </Button>
          </button>
        </motion.div>
        <Leaf className="absolute -bottom-10 -right-10 h-64 w-64 text-white opacity-10 rotate-12" />
      </section>
    </div>
  );
}
