import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Users, Leaf, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function FarmTourPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" },
  } as const;

  const farmStats = [
    { icon: MapPin, title: "50 Hectares", text: "Total farm area" },
    { icon: Users, title: "25 Workers", text: "Dedicated team" },
    { icon: Leaf, title: "12 Batches", text: "Active crops" },
    { icon: Calendar, title: "Year-Round", text: "Continuous operation" },
  ];

  const dailySchedule = [
    {
      time: "6 AM",
      title: "Morning Briefing",
      text: "Workers receive SMS notifications for the day's tasks. The farm head reviews the dashboard to prioritize activities based on weather conditions and crop development stages.",
    },
    {
      time: "9 AM",
      title: "Field Operations",
      text: "Teams disperse across the farm to carry out irrigation, fertilization, or pest monitoring activities. Workers send status updates via SMS as they complete each task.",
    },
    {
      time: "2 PM",
      title: "Monitoring & Inspection",
      text: "The farm head inspects completed work and addresses any DELAY or HELP responses from workers. Data is logged in the system for tracking and reporting.",
    },
    {
      time: "5 PM",
      title: "End of Day Review",
      text: "Task completion rates are reviewed, and plans for the next day are prepared. The system automatically schedules tomorrow's advisory messages based on batch schedules.",
    },
  ];

  return (
    <div className="bg-[#f3faf2] text-[#243723]">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden h-[360px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(31, 58, 29, 0.45), rgba(12, 49, 30, 0.45)), url('https://images.unsplash.com/photo-1758414076901-bb430a9a0beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JuJTIwZmFybSUyMGZpZWxkJTIwYWdyaWN1bHR1cmFsfGVufDF8fHx8MTc3MjcyNzY5OXww&ixlib=rb-4.1.0&q=80&w=1600&utm_source=figma&utm_medium=referral')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />
        <motion.div
          className="container mx-auto px-6 sm:px-8 lg:px-12 text-white text-center relative z-10"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <motion.span
            className="inline-flex items-center justify-center rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.24em] text-white mb-6 shadow-lg shadow-black/10 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            Farm demonstration
          </motion.span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">Get to Know Our Farm</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            Discover the heart of AniAlerto - where innovation meets tradition in corn farming
          </p>
        </motion.div>
      </section>

      {/* Farm Overview */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-5xl mx-auto rounded-[2rem] bg-white p-10 shadow-2xl shadow-[#a4c692]/20 border border-[#d9ead6]" {...fadeUp}>
            <h2 className="text-3xl font-bold mb-6 text-[#3d5a36]">Welcome to Our Farm</h2>
            <p className="text-[#4f5d46] mb-6 text-lg leading-relaxed">
              Our demonstration farm serves as the proving ground for the AniAlerto system.
              Located in the heart of corn country, this farm showcases modern agricultural
              practices combined with cutting-edge SMS-based management technology.
            </p>
            <p className="text-[#4f5d46] mb-8 text-lg leading-relaxed">
              We believe that successful farming requires not just fertile soil and favorable
              weather, but also effective communication and precise timing. Our farm embodies
              this philosophy, demonstrating how technology can enhance traditional farming
              wisdom to achieve exceptional yields.
            </p>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {farmStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                  >
                    <Card className="h-full text-center border border-[#e5ede0] shadow-lg shadow-[#a4c692]/15">
                      <CardContent className="pt-6">
                        <Icon className="h-12 w-12 text-[#5d8044] mx-auto mb-3" />
                        <h3 className="font-bold mb-2 text-[#3d5a36]">{stat.title}</h3>
                        <p className="text-sm text-[#556d4a]">{stat.text}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Farm Practices Section */}
      <section className="py-20 bg-gradient-to-br from-[#ecf7e7] via-[#f3faf2] to-[#eff7eb]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]" {...fadeUp}>Our Farming Practices</motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div className="overflow-hidden rounded-[1.75rem] border border-[#d9ead6] bg-white shadow-xl shadow-[#a4c692]/20" {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-32 bg-[#91b554]/10" />
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758533696874-587c4e62940c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjB3b3JraW5nJTIwY29ybiUyMGNyb3B8ZW58MXx8fHwxNzcyNzI3NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Farmer working in corn field"
                    className="w-full h-56 object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-semibold mb-4 text-[#3d5a36]">Sustainable Methods</h3>
                  <p className="text-[#556d4a] leading-relaxed">
                    We employ sustainable farming techniques including crop rotation, integrated
                    pest management, and precision irrigation to protect the environment while
                    maximizing yields.
                  </p>
                </div>
              </motion.div>

              <motion.div className="overflow-hidden rounded-[1.75rem] border border-[#d9ead6] bg-white shadow-xl shadow-[#a4c692]/20" {...fadeUp} transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.01 }}>
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-32 bg-[#91b554]/10" />
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1664604655363-f6050b3ca4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBsYW5kc2NhcGUlMjBmYXJtaW5nfGVufDF8fHx8MTc3MjcyNzcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Agricultural landscape"
                    className="w-full h-56 object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-semibold mb-4 text-[#3d5a36]">Technology Integration</h3>
                  <p className="text-[#556d4a] leading-relaxed">
                    Our farm leverages the AniAlerto SMS system to coordinate all farming
                    activities, ensuring tasks are completed on schedule and workers stay
                    informed throughout the growing season.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Life Section */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]" {...fadeUp}>A Day on the Farm</motion.h2>

            <div className="space-y-6">
              {dailySchedule.map((item, index) => (
                <motion.div
                  key={item.time}
                  className="flex gap-4 items-start rounded-[1.5rem] border border-[#d9ead6] bg-white/80 p-5 shadow-lg shadow-[#a4c692]/10"
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  whileHover={{ y: -5, scale: 1.01 }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#5d8044] rounded-full flex items-center justify-center text-white font-bold">
                      {item.time}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 text-[#3d5a36]">{item.title}</h3>
                    <p className="text-[#556d4a]">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location & Map Section */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]" {...fadeUp}>Find Us</motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <motion.div className="rounded-[1.75rem] border border-[#d9ead6] bg-white p-8 shadow-2xl shadow-[#a4c692]/20" {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <div className="flex items-start gap-4">
                  <MapPin className="h-10 w-10 text-[#5d8044] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-3 text-[#3d5a36]">Farm Location</h3>
                    <p className="text-[#556d4a] mb-4">
                      Our farm is located in the agricultural heartland of Central Luzon,
                      known for its rich soil and ideal climate for corn cultivation.
                    </p>
                    <div className="space-y-2">
                      <p className="text-[#3d5a36]">
                        <strong>Address:</strong>
                      </p>
                      <p className="text-[#556d4a]">
                        Mapandan, Pangasinan<br />
                        Philippines
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div className="bg-white rounded-[1.75rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 p-8" {...fadeUp} transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }} whileHover={{ y: -6, scale: 1.01 }}>
                <h3 className="font-bold text-xl mb-4 text-[#3d5a36]">Getting There</h3>
                <div className="space-y-3 text-[#556d4a]">
                  <p>
                    <strong className="text-[#3d5a36]">By Car:</strong> Approximately 4 hours
                    from Manila via TPLEX
                  </p>
                  <p>
                    <strong className="text-[#3d5a36]">By Bus:</strong> Take a bus to Dagupan
                    City, then a local jeepney to Mapandan
                  </p>
                  <p>
                    <strong className="text-[#3d5a36]">Nearest City:</strong> Dagupan City
                    (15 minutes away)
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Embedded Map */}
            <motion.div className="rounded-[1.75rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 border border-[#d9ead6]" {...fadeUp}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d61601.89847771334!2d120.40537967910156!3d16.02486699999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3393e95ead03ca29%3A0xbd0f89bea6e8e91d!2sMapandan%2C%20Pangasinan!5e0!3m2!1sen!2sph!4v1234567890123"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Farm location in Mapandan, Pangasinan"
              ></iframe>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
