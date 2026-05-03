import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MessageSquare, Bell, Users, BarChart, MapPin, Leaf, Calendar } from "lucide-react";

export function HomePage() {
  return (
    <div className="bg-[#F1F5F2] min-h-screen font-sans">
      {/* Hero Section */}
      <section
        className="relative h-[600px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1758414076901-bb430a9a0beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')`,
        }}
      >
        <div className="container mx-auto px-4 text-white text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">Welcome to AniAlerto</h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed opacity-90">
            An SMS-based advisory system designed to assist corn farm workers by sending timely
            reminders for irrigation, fertilization, pest prevention, and harvesting.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/about">
              <Button size="lg" className="bg-[#556B2F] hover:bg-[#91b554] text-white px-8 transition-colors">
                Learn More
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white text-[#556B2F] hover:bg-gray-100 border-white px-8">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-[#F1F5F2]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-[#2C2C2C]">About AniAlerto</h2>
            <p className="text-[#555] text-lg mb-6 leading-relaxed">
              AniAlerto is designed to improve communication between farm heads and workers while
              ensuring that important farming activities are completed on time.
            </p>
            <p className="text-[#555] text-lg leading-relaxed">
              By leveraging mobile technology, we make it easier for farm managers to coordinate
              with their teams, track task completion, and ensure optimal crop management
              practices are followed.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Using Navbar Color as Background Accent */}
      <section className="py-20 bg-[#97ae5f]/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-[#2C2C2C]">System Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: MessageSquare, title: "SMS Reminders", desc: "Automated notifications for irrigation and fertilization." },
              { icon: Bell, title: "Task Alerts", desc: "Schedule reminders based on crop growth stages." },
              { icon: Users, title: "Response Tracking", desc: "Monitor worker status via DONE, DELAY, or HELP keywords." },
              { icon: BarChart, title: "Reports", desc: "Generate compliance and farm activity history reports." }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-md bg-white">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-[#556B2F] mb-4" />
                  <CardTitle className="text-[#2C2C2C] text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#777] text-base">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Farm Stats Section */}
      <section className="py-20 bg-[#F1F5F2]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center text-[#2C2C2C]">Farm Overview</h2>
            <div className="grid md:grid-cols-4 gap-8 mb-16">
              {[
                { icon: MapPin, label: "50 Hectares", sub: "Total area" },
                { icon: Users, label: "25 Workers", sub: "Dedicated team" },
                { icon: Leaf, label: "12 Batches", sub: "Active crops" },
                { icon: Calendar, label: "Year-Round", sub: "Operation" }
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <stat.icon className="h-12 w-12 text-[#97ae5f] mx-auto mb-4" />
                  <h3 className="font-bold text-2xl text-[#2C2C2C] mb-1">{stat.label}</h3>
                  <p className="text-[#777] font-medium uppercase text-xs tracking-widest">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/farm-tour">
                <Button className="bg-[#556B2F] hover:bg-[#91b554] text-white px-10 py-6 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
                  Explore Our Farm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Solid Dark Olive */}
      <section className="py-24 bg-[#556B2F] text-white overflow-hidden relative">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Optimize Your Harvest?</h2>
          <p className="text-xl mb-10 opacity-80 max-w-xl mx-auto">
            Access the administrative dashboard to manage your farm operations and workers.
          </p>
          <Link to="/login">
            <Button size="lg" variant="outline" className="bg-white text-[#556B2F] hover:bg-[#F1F5F2] border-white px-12 py-7 text-xl font-bold transition-all">
              Access Admin Dashboard
            </Button>
          </Link>
        </div>
        {/* Subtle decorative background icon */}
        <Leaf className="absolute -bottom-10 -right-10 h-64 w-64 text-white opacity-5 rotate-12" />
      </section>
    </div>
  );
}