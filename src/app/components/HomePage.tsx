import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, Bell, Users, BarChart, MapPin, Leaf, Calendar } from "lucide-react";

export function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[500px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1758414076901-bb430a9a0beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JuJTIwZmFybSUyMGZpZWxkJTIwYWdyaWN1bHR1cmV8ZW58MXx8fHwxNzcyNzE5NjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
        }}
      >
        <div className="container mx-auto px-4 text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to AniAlerto</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            An SMS-based advisory system designed to assist corn farm workers by sending timely
            reminders for farm activities such as irrigation, fertilization, pest prevention, and
            harvesting.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/about">
              <Button size="lg" className="bg-[#8acb88] hover:bg-[#648381]">
                Learn More
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white text-[#575761] hover:bg-gray-100">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About AniAlerto</h2>
            <p className="text-gray-600 mb-4">
              AniAlerto is designed to improve communication between farm heads and workers while
              ensuring that important farming activities are completed on time. Our system helps
              you manage your corn farm more efficiently through automated SMS notifications and
              task tracking.
            </p>
            <p className="text-gray-600">
              By leveraging mobile technology, we make it easier for farm managers to coordinate
              with their teams, track task completion, and ensure optimal crop management
              practices are followed throughout the growing season.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#e4fde1]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">System Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-[#8acb88] mb-2" />
                <CardTitle>Automated SMS Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Send timely SMS notifications to workers for irrigation, fertilization, pest
                  control, and harvesting activities.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-[#8acb88] mb-2" />
                <CardTitle>Task Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Schedule and manage task reminders based on crop batch planting dates and growth
                  stages.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-[#8acb88] mb-2" />
                <CardTitle>Worker Response Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor worker responses through simple SMS keywords: DONE, DELAY, or HELP for
                  each task.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart className="h-10 w-10 text-[#8acb88] mb-2" />
                <CardTitle>Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate comprehensive reports on task completion, worker compliance, and farm
                  activity history.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Farm Overview Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Get to Know Our Farm</h2>
            <p className="text-gray-600 mb-6 text-center max-w-2xl mx-auto">
              Our demonstration farm serves as the proving ground for the AniAlerto system.
              Located in the heart of corn country, this farm showcases modern agricultural
              practices combined with cutting-edge SMS-based management technology.
            </p>
            <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">
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

            <div className="text-center">
              <Link to="/farm-tour">
                <Button className="bg-[#8acb88] hover:bg-[#648381]">
                  Explore Our Farm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Where We're Located</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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

      {/* Corn Farming Information Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Corn Farming Best Practices</h2>
              <p className="text-gray-600 mb-4">
                Access comprehensive information about corn farming practices, including land
                preparation, planting schedules, fertilization guidelines, irrigation practices,
                and pest management strategies.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-[#8acb88] rounded-full"></div>
                  Land preparation techniques
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-[#8acb88] rounded-full"></div>
                  Optimal planting schedules
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-[#8acb88] rounded-full"></div>
                  Fertilization and irrigation guidelines
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-[#8acb88] rounded-full"></div>
                  Pest and disease management
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-[#8acb88] rounded-full"></div>
                  Harvest timing and techniques
                </li>
              </ul>
              <Link to="/corn-guide">
                <Button className="bg-[#8acb88] hover:bg-[#648381]">
                  Read Farming Guide
                </Button>
              </Link>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1769258958976-8852440011b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3JuJTIwY3JvcHMlMjBncm93aW5nJTIwZ3JlZW58ZW58MXx8fHwxNzcyNzE5NjA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Corn crops"
                className="rounded-lg shadow-lg w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#8acb88] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">
            Access the administrative dashboard to manage your farm operations
          </p>
          <Link to="/login">
            <Button size="lg" variant="outline" className="bg-white text-[#8acb88] hover:bg-[#e4fde1] border-white">
              Access Admin Dashboard
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
