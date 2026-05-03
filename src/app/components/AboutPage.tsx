import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Target, Lightbulb, Users, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

export function AboutPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" },
  } as const;

  return (
    <div className="bg-[#f3faf0] text-[#243723] min-h-screen">
      <section className="relative overflow-hidden bg-[#556b2f] text-white py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute right-12 bottom-10 h-72 w-72 rounded-full bg-[#91b554]/20 blur-3xl" />

        <motion.div
          className="container mx-auto relative z-10 px-6 sm:px-8 lg:px-12 text-center"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <motion.span
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm tracking-[0.24em] uppercase text-white/80 mb-6 shadow-lg shadow-black/10"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            Designed for stronger farm coordination
          </motion.span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]">
            About AniAlerto
          </h1>
          <p className="mx-auto max-w-3xl text-lg md:text-xl leading-relaxed text-white/85">
            Revolutionizing corn farm management through SMS-based communication and task automation that helps teams stay aligned and productive.
          </p>
        </motion.div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_0.95fr] items-center">
            <motion.div className="space-y-6" {...fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eff7ed] px-4 py-2 text-sm font-semibold text-[#3d5a36] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#91b554]" />
                Mission-led farm automation
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
              <p className="text-[#4f5d46] leading-relaxed text-lg">
                AniAlerto is committed to transforming corn farm management by bridging the communication gap between farm heads and workers. Our SMS-based advisory system ensures that critical farming activities are completed on time, improving overall farm productivity and crop yields.
              </p>
              <p className="text-[#4f5d46] leading-relaxed text-lg">
                We understand the challenges faced by farm managers in coordinating multiple tasks across large agricultural operations. AniAlerto provides a simple yet powerful solution that leverages mobile technology to keep everyone informed and accountable.
              </p>
            </motion.div>
            <motion.div className="relative" {...fadeUp} transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}>
              <div className="absolute inset-x-0 top-8 h-48 rounded-[2.5rem] bg-[#91b554]/15 blur-3xl" />
              <div className="relative rounded-[2rem] border border-[#dce8d6] bg-white p-8 shadow-2xl shadow-[#1d3a1a]/10">
                <div className="grid gap-5 md:grid-cols-2">
                  <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 260 }}>
                  <Card className="h-full border-[#e5eddc] shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <Target className="h-10 w-10 text-[#556b2f] mb-3" />
                      <CardTitle>Our Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#4f5d46]">
                        Improve communication between farm heads and workers, ensuring that irrigation, fertilization, pest prevention, and harvesting are completed on time and with precision.
                      </p>
                    </CardContent>
                  </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 260 }}>
                  <Card className="h-full border-[#e5eddc] shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <Lightbulb className="h-10 w-10 text-[#556b2f] mb-3" />
                      <CardTitle>Our Approach</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#4f5d46]">
                        Use SMS technology to deliver timely reminders and track worker responses, making farm management accessible even in areas with limited internet connectivity.
                      </p>
                    </CardContent>
                  </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 260 }}>
                  <Card className="h-full border-[#e5eddc] shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <Users className="h-10 w-10 text-[#556b2f] mb-3" />
                      <CardTitle>Empowering Workers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#4f5d46]">
                        Workers can easily respond to task notifications with DONE, DELAY, or HELP, enabling quick communication and problem resolution.
                      </p>
                    </CardContent>
                  </Card>
                  </motion.div>

                  <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: "spring", stiffness: 260 }}>
                  <Card className="h-full border-[#e5eddc] shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <TrendingUp className="h-10 w-10 text-[#556b2f] mb-3" />
                      <CardTitle>Improving Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#4f5d46]">
                        Automate reminders and track completion rates so farm heads can focus on strategy while operations stay consistent.
                      </p>
                    </CardContent>
                  </Card>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 bg-[#eaf6e1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.4),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(56,89,24,0.15),_transparent_35%)]" />
        <div className="container mx-auto relative z-10 px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-4xl mx-auto text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">Contributing to Sustainable Development Goals</h2>
            <p className="text-[#3e5035] mt-4 leading-relaxed text-lg">
              AniAlerto supports sustainable agriculture by improving productivity, strengthening rural infrastructure, and making digital farm operations accessible to more communities.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
            <Card className="h-full border-l-8 border-[#91b554] bg-white p-8 shadow-xl shadow-[#92b56d]/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#556b2f] text-xl font-bold text-white">
                  2
                </div>
                <div>
                  <CardTitle className="text-2xl">SDG 2: Zero Hunger</CardTitle>
                  <p className="text-sm text-[#566a48]">End hunger, achieve food security</p>
                </div>
              </div>
              <CardContent>
                <p className="text-[#4c5f3c] mb-4">
                  AniAlerto directly contributes to food security by improving corn production efficiency and crop yields.
                </p>
                <ul className="space-y-3 text-[#4c5f3c]">
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Increase crop productivity through optimized farm management.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Reduce post-harvest losses with timely interventions.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Enhance sustainable agricultural practices for long-term production.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Support smallholder farmers in improving income and livelihoods.</li>
                </ul>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.01 }}>
            <Card className="h-full border-l-8 border-[#91b554] bg-white p-8 shadow-xl shadow-[#92b56d]/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#556b2f] text-xl font-bold text-white">
                  9
                </div>
                <div>
                  <CardTitle className="text-2xl">SDG 9: Industry, Innovation and Infrastructure</CardTitle>
                  <p className="text-sm text-[#566a48]">Build resilient infrastructure, promote innovation</p>
                </div>
              </div>
              <CardContent>
                <p className="text-[#4c5f3c] mb-4">
                  Our SMS platform brings innovation to agricultural workflows and supports farm resilience.
                </p>
                <ul className="space-y-3 text-[#4c5f3c]">
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Leverage mobile technology for agricultural innovation.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Provide infrastructure that works in low-connectivity areas.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Enable digital transformation in the agricultural sector.</li>
                  <li className="flex gap-2"><span className="text-[#91b554] font-bold">•</span> Create scalable solutions for sustainable growth.</li>
                </ul>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-4xl mx-auto text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">How AniAlerto Works</h2>
            <p className="text-[#4f5d46] mt-4 leading-relaxed text-lg">
              A simple, reliable workflow designed to keep teams aligned and crops on schedule.
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                title: "Admin Setup",
                text: "Farm heads enter batch details, crop schedules, and worker contacts into the dashboard so the system starts with the right data.",
              },
              {
                title: "Configure the System",
                text: "Workers are grouped, SMS templates are defined, and reminders are aligned with the farm's operational calendar.",
              },
              {
                title: "System Computes Crop Stage",
                text: "AniAlerto calculates crop day and growth stage automatically based on planting dates for precise task timing.",
              },
              {
                title: "Check Due Tasks",
                text: "The system continuously monitors the crop calendar and flags the tasks that are due for the current schedule.",
              },
              {
                title: "Generate and Send SMS",
                text: "When a task is due, the platform selects the right advisory, builds the message, queues it, and sends it through the SMS gateway.",
              },
              {
                title: "Log Everything",
                text: "Delivery results are recorded automatically so farm managers can monitor success rates and troubleshoot issues.",
              },
              {
                title: "Optional Two-Way Replies",
                text: "Workers can reply with DONE, DELAY, or HELP, and AniAlerto updates task status for real-time visibility.",
              },
            ].map((step, index) => (
              <motion.div
                key={step.title}
                className="group rounded-[1.75rem] border border-[#d9e7d3] bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-2xl"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.01 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#91b554] text-lg font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-[#243723]">{step.title}</h3>
                </div>
                <p className="text-[#556d4a] leading-relaxed">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#eff8ed]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-4xl mx-auto text-center mb-10" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">Benefits of Using AniAlerto</h2>
            <p className="text-[#4f5d46] mt-4 leading-relaxed text-lg">
              Built for strong teams, better decisions, and higher crop performance.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Improved Communication",
                text: "Ensure clear, timely coordination between management and workers.",
              },
              {
                title: "Increased Productivity",
                text: "Reduce delays and missed tasks using automated reminders and visibility.",
              },
              {
                title: "Better Crop Management",
                text: "Execute farming activities at optimal times for healthier yields.",
              },
              {
                title: "Easy to Use",
                text: "SMS-based interaction works without smartphones or constant internet.",
              },
              {
                title: "Accountability",
                text: "Track task completion and worker responses for better oversight.",
              },
              {
                title: "Data-Driven Decisions",
                text: "Use logs and reports to optimize farm operations over time.",
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="rounded-[1.75rem] border border-[#d9e7d3] bg-white p-6 shadow-lg"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                whileHover={{ y: -5, scale: 1.01 }}
              >
                <h3 className="text-xl font-semibold text-[#273930] mb-3">{benefit.title}</h3>
                <p className="text-[#556d4a] leading-relaxed">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
