import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Users, Leaf, Calendar } from "lucide-react";

export function FarmTourPage() {
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
        <div className="container mx-auto px-4 text-white text-center relative z-10">
          <span className="inline-flex items-center justify-center rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.24em] text-white mb-6 shadow-lg shadow-black/10 backdrop-blur-sm">
            Farm demonstration
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">Get to Know Our Farm</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            Discover the heart of AniAlerto - where innovation meets tradition in corn farming
          </p>
        </div>
      </section>

      {/* Farm Overview */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto rounded-[2rem] bg-white p-10 shadow-2xl shadow-[#a4c692]/20 border border-[#d9ead6]">
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
              <Card className="text-center border border-[#e5ede0] shadow-lg shadow-[#a4c692]/15">
                <CardContent className="pt-6">
                  <MapPin className="h-12 w-12 text-[#5d8044] mx-auto mb-3" />
                  <h3 className="font-bold mb-2 text-[#3d5a36]">50 Hectares</h3>
                  <p className="text-sm text-[#556d4a]">Total farm area</p>
                </CardContent>
              </Card>

              <Card className="text-center border border-[#e5ede0] shadow-lg shadow-[#a4c692]/15">
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-[#5d8044] mx-auto mb-3" />
                  <h3 className="font-bold mb-2 text-[#3d5a36]">25 Workers</h3>
                  <p className="text-sm text-[#556d4a]">Dedicated team</p>
                </CardContent>
              </Card>

              <Card className="text-center border border-[#e5ede0] shadow-lg shadow-[#a4c692]/15">
                <CardContent className="pt-6">
                  <Leaf className="h-12 w-12 text-[#5d8044] mx-auto mb-3" />
                  <h3 className="font-bold mb-2 text-[#3d5a36]">12 Batches</h3>
                  <p className="text-sm text-[#556d4a]">Active crops</p>
                </CardContent>
              </Card>

              <Card className="text-center border border-[#e5ede0] shadow-lg shadow-[#a4c692]/15">
                <CardContent className="pt-6">
                  <Calendar className="h-12 w-12 text-[#5d8044] mx-auto mb-3" />
                  <h3 className="font-bold mb-2 text-[#3d5a36]">Year-Round</h3>
                  <p className="text-sm text-[#556d4a]">Continuous operation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Practices Section */}
      <section className="py-20 bg-gradient-to-br from-[#ecf7e7] via-[#f3faf2] to-[#eff7eb]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]">Our Farming Practices</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="overflow-hidden rounded-[1.75rem] border border-[#d9ead6] bg-white shadow-xl shadow-[#a4c692]/20">
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
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-[#d9ead6] bg-white shadow-xl shadow-[#a4c692]/20">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Life Section */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]">A Day on the Farm</h2>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#5d8044] rounded-full flex items-center justify-center text-white font-bold">
                    6 AM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-[#3d5a36]">Morning Briefing</h3>
                  <p className="text-[#556d4a]">
                    Workers receive SMS notifications for the day's tasks. The farm head reviews
                    the dashboard to prioritize activities based on weather conditions and crop
                    development stages.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#5d8044] rounded-full flex items-center justify-center text-white font-bold">
                    9 AM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-[#3d5a36]">Field Operations</h3>
                  <p className="text-[#556d4a]">
                    Teams disperse across the farm to carry out irrigation, fertilization, or pest
                    monitoring activities. Workers send status updates via SMS as they complete
                    each task.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#5d8044] rounded-full flex items-center justify-center text-white font-bold">
                    2 PM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-[#3d5a36]">Monitoring & Inspection</h3>
                  <p className="text-[#556d4a]">
                    The farm head inspects completed work and addresses any DELAY or HELP
                    responses from workers. Data is logged in the system for tracking and
                    reporting.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#5d8044] rounded-full flex items-center justify-center text-white font-bold">
                    5 PM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-[#3d5a36]">End of Day Review</h3>
                  <p className="text-[#556d4a]">
                    Task completion rates are reviewed, and plans for the next day are prepared.
                    The system automatically schedules tomorrow's advisory messages based on
                    batch schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Map Section */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-[#3d5a36]">Find Us</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="rounded-[1.75rem] border border-[#d9ead6] bg-white p-8 shadow-2xl shadow-[#a4c692]/20">
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
              </div>

              <div className="bg-white rounded-[1.75rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 p-8">
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
              </div>
            </div>

            {/* Embedded Map */}
            <div className="rounded-[1.75rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 border border-[#d9ead6]">
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
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
