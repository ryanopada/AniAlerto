import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { MapPin, Users, Leaf, Calendar } from "lucide-react";

export function FarmTourPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-96 bg-gray-900">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1758414076901-bb430a9a0beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JuJTIwZmFybSUyMGZpZWxkJTIwYWdyaWN1bHR1cmFsfGVufDF8fHx8MTc3MjcyNzY5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Corn farm field"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4">Get to Know Our Farm</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Discover the heart of AniAlerto - where innovation meets tradition in corn farming
            </p>
          </div>
        </div>
      </section>

      {/* Farm Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Welcome to Our Farm</h2>
            <p className="text-gray-600 mb-6">
              Our demonstration farm serves as the proving ground for the AniAlerto system.
              Located in the heart of corn country, this farm showcases modern agricultural
              practices combined with cutting-edge SMS-based management technology.
            </p>
            <p className="text-gray-600 mb-8">
              We believe that successful farming requires not just fertile soil and favorable
              weather, but also effective communication and precise timing. Our farm embodies
              this philosophy, demonstrating how technology can enhance traditional farming
              wisdom to achieve exceptional yields.
            </p>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <MapPin className="h-12 w-12 text-[#8acb88] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">50 Hectares</h3>
                  <p className="text-sm text-gray-600">Total farm area</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="h-12 w-12 text-[#8acb88] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">25 Workers</h3>
                  <p className="text-sm text-gray-600">Dedicated team</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Leaf className="h-12 w-12 text-[#8acb88] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">12 Batches</h3>
                  <p className="text-sm text-gray-600">Active crops</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Calendar className="h-12 w-12 text-[#8acb88] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Year-Round</h3>
                  <p className="text-sm text-gray-600">Continuous operation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Practices Section */}
      <section className="py-16 bg-[#e4fde1]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Farming Practices</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758533696874-587c4e62940c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjB3b3JraW5nJTIwY29ybiUyMGNyb3B8ZW58MXx8fHwxNzcyNzI3NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Farmer working in corn field"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3">Sustainable Methods</h3>
                  <p className="text-gray-600">
                    We employ sustainable farming techniques including crop rotation, integrated
                    pest management, and precision irrigation to protect the environment while
                    maximizing yields.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1664604655363-f6050b3ca4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyYWwlMjBsYW5kc2NhcGUlMjBmYXJtaW5nfGVufDF8fHx8MTc3MjcyNzcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Agricultural landscape"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3">Technology Integration</h3>
                  <p className="text-gray-600">
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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">A Day on the Farm</h2>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold">
                    6 AM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Morning Briefing</h3>
                  <p className="text-gray-600">
                    Workers receive SMS notifications for the day's tasks. The farm head reviews
                    the dashboard to prioritize activities based on weather conditions and crop
                    development stages.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold">
                    9 AM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Field Operations</h3>
                  <p className="text-gray-600">
                    Teams disperse across the farm to carry out irrigation, fertilization, or pest
                    monitoring activities. Workers send status updates via SMS as they complete
                    each task.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold">
                    2 PM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Monitoring & Inspection</h3>
                  <p className="text-gray-600">
                    The farm head inspects completed work and addresses any DELAY or HELP
                    responses from workers. Data is logged in the system for tracking and
                    reporting.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold">
                    5 PM
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">End of Day Review</h3>
                  <p className="text-gray-600">
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Find Us</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 text-[#8acb88] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-3">Farm Location</h3>
                    <p className="text-gray-600 mb-4">
                      Our farm is located in the agricultural heartland of Central Luzon,
                      known for its rich soil and ideal climate for corn cultivation.
                    </p>
                    <div className="space-y-2">
                      <p className="text-gray-800">
                        <strong>Address:</strong>
                      </p>
                      <p className="text-gray-600">
                        Mapandan, Pangasinan<br />
                        Philippines
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-xl mb-4">Getting There</h3>
                <div className="space-y-3 text-gray-600">
                  <p>
                    <strong className="text-gray-800">By Car:</strong> Approximately 4 hours
                    from Manila via TPLEX
                  </p>
                  <p>
                    <strong className="text-gray-800">By Bus:</strong> Take a bus to Dagupan
                    City, then a local jeepney to Mapandan
                  </p>
                  <p>
                    <strong className="text-gray-800">Nearest City:</strong> Dagupan City
                    (15 minutes away)
                  </p>
                </div>
              </div>
            </div>

            {/* Embedded Map */}
            <div className="rounded-lg overflow-hidden shadow-lg">
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
