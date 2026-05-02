import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Target, Lightbulb, Users, TrendingUp } from "lucide-react";

export function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#8acb88] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About AniAlerto</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Revolutionizing corn farm management through SMS-based communication and task automation
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              AniAlerto is committed to transforming corn farm management by bridging the
              communication gap between farm heads and workers. Our SMS-based advisory system
              ensures that critical farming activities are completed on time, improving overall
              farm productivity and crop yields.
            </p>
            <p className="text-gray-600 mb-8">
              We understand the challenges faced by farm managers in coordinating multiple tasks
              across large agricultural operations. AniAlerto provides a simple yet powerful
              solution that leverages mobile technology to keep everyone informed and accountable.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <Target className="h-10 w-10 text-[#8acb88] mb-2" />
                  <CardTitle>Our Goal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    To improve communication between farm heads and workers, ensuring that
                    important farming activities such as irrigation, fertilization, pest
                    prevention, and harvesting are completed on time and with precision.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Lightbulb className="h-10 w-10 text-[#8acb88] mb-2" />
                  <CardTitle>Our Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We use SMS technology to deliver timely reminders and track worker responses,
                    making farm management accessible even in areas with limited internet
                    connectivity.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-[#8acb88] mb-2" />
                  <CardTitle>Empowering Workers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Workers can easily respond to task notifications using simple keywords (DONE,
                    DELAY, HELP), enabling quick communication and problem resolution.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 text-[#8acb88] mb-2" />
                  <CardTitle>Improving Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    By automating task reminders and tracking completion rates, farm heads can
                    focus on strategic decision-making while ensuring operational excellence.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SDG Contribution Section */}
      <section className="py-16 bg-[#e4fde1]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-center">
              Contributing to Sustainable Development Goals
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              AniAlerto is committed to supporting the United Nations Sustainable Development Goals
              through innovative agricultural technology and sustainable farming practices.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white border-2 border-[#8acb88]">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      2
                    </div>
                    <div>
                      <CardTitle className="text-xl">SDG 2: Zero Hunger</CardTitle>
                      <p className="text-sm text-gray-600">End hunger, achieve food security</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    AniAlerto directly contributes to food security by improving corn production
                    efficiency and crop yields. By ensuring timely execution of critical farming
                    activities, we help farmers:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Increase crop productivity through optimized farm management</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Reduce post-harvest losses with timely interventions</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Enhance sustainable agricultural practices for long-term food production</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Support smallholder farmers in improving their income and livelihoods</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-[#8acb88]">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#8acb88] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      9
                    </div>
                    <div>
                      <CardTitle className="text-xl">SDG 9: Industry, Innovation and Infrastructure</CardTitle>
                      <p className="text-sm text-gray-600">Build resilient infrastructure, promote innovation</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Our SMS-based platform represents innovation in agricultural technology,
                    making modern farm management accessible to all. We advance SDG 9 by:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Leveraging mobile technology for agricultural innovation</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Providing infrastructure that works in low-connectivity areas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Enabling digital transformation in the agricultural sector</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#8acb88] font-bold">•</span>
                      <span>Creating scalable solutions for sustainable agricultural development</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">How AniAlerto Works</h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Admin Setup</h3>
                  <p className="text-gray-600">
                    The farm head or admin accesses the web dashboard to input essential farm information
                    including batch or farm area details, crop specifications, planting dates, and workers'
                    contact numbers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Configure the System</h3>
                  <p className="text-gray-600">
                    The admin assigns workers into groups and configures the crop calendar schedule,
                    IF-THEN rules, and SMS templates to ensure reminders align with the farm's
                    operational routine.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">System Computes Crop Stage</h3>
                  <p className="text-gray-600">
                    Once saved, AniAlerto stores the data in its database and automatically calculates
                    the crop day and growth stage based on the planting date, enabling precise
                    task scheduling.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Check Due Tasks</h3>
                  <p className="text-gray-600">
                    The system continuously monitors the crop calendar to identify tasks that are due
                    for the current schedule, ensuring nothing is overlooked.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    5
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Generate and Send SMS</h3>
                  <p className="text-gray-600">
                    When a task is due, AniAlerto selects the appropriate advisory using configured rules,
                    generates the SMS from the template, queues it for delivery, and sends it through
                    the SMS gateway to the assigned workers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    6
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Log Everything</h3>
                  <p className="text-gray-600">
                    After delivery, AniAlerto automatically records the delivery result (sent or failed)
                    in the system logs for comprehensive monitoring and accountability.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#8acb88] text-white rounded-full flex items-center justify-center font-bold">
                    7
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Optional Two-Way Replies</h3>
                  <p className="text-gray-600">
                    If two-way SMS is enabled, workers can respond using structured keywords such as
                    DONE, DELAY, or HELP. The system automatically updates and logs the task status
                    for real-time tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Benefits of Using AniAlerto</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Improved Communication</h3>
                <p className="text-gray-600">
                  Ensure clear, timely communication between farm management and workers
                </p>
              </div>

              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Increased Productivity</h3>
                <p className="text-gray-600">
                  Reduce delays and missed tasks through automated reminders and tracking
                </p>
              </div>

              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Better Crop Management</h3>
                <p className="text-gray-600">
                  Execute farming activities at optimal times for improved crop health and yields
                </p>
              </div>

              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Easy to Use</h3>
                <p className="text-gray-600">
                  Simple SMS-based interface requires no smartphones or internet connection
                </p>
              </div>

              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Accountability</h3>
                <p className="text-gray-600">
                  Track task completion and worker responses for better farm oversight
                </p>
              </div>

              <div className="border-l-4 border-[#8acb88] pl-4">
                <h3 className="font-bold mb-2">Data-Driven Decisions</h3>
                <p className="text-gray-600">
                  Generate reports and analytics to optimize farm operations over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
