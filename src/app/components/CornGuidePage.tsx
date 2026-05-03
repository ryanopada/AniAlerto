import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Sprout, Droplet, Leaf, Bug, Calendar } from "lucide-react";

export function CornGuidePage() {
  return (
    <div className="bg-[#f3faf2]">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden h-[360px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(31, 58, 29, 0.45), rgba(12, 49, 30, 0.45)), url('https://images.unsplash.com/photo-1638114485636-ecff19ec931d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjB3b3JraW5nJTIwY29ybiUyMGZpZWxkfGVufDF8fHx8MTc3MjcxOTYwN3ww&ixlib=rb-4.1.0&q=80&w=1600&utm_source=figma&utm_medium=referral')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />
        <div className="container mx-auto px-4 text-white text-center relative z-10">
          <span className="inline-flex items-center justify-center rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm uppercase tracking-[0.24em] text-white mb-6 shadow-lg shadow-black/10 backdrop-blur-sm">
            Corn farming essentials
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">Corn Farming Guide</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            Comprehensive information about corn farming best practices, from soil preparation to harvest
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="preparation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-10 bg-[#e8f2e5] shadow-lg rounded-[1rem] p-1">
                <TabsTrigger value="preparation">Preparation</TabsTrigger>
                <TabsTrigger value="planting">Planting</TabsTrigger>
                <TabsTrigger value="fertilization">Fertilization</TabsTrigger>
                <TabsTrigger value="irrigation">Irrigation</TabsTrigger>
                <TabsTrigger value="pest">Pest Control</TabsTrigger>
                <TabsTrigger value="harvest">Harvest</TabsTrigger>
              </TabsList>

              <TabsContent value="preparation">
                <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.75rem] overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
                    <CardTitle className="flex items-center gap-2 text-[#3d5a36]">
                      <Sprout className="h-6 w-6 text-[#5d8044]" />
                      Land Preparation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div className="rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]">
                      <h3 className="font-bold mb-2 text-[#2d3a25]">Soil Testing</h3>
                      <p className="text-[#4f5d46]">
                        Before planting, conduct soil tests to determine pH levels and nutrient
                        content. Ideal pH for corn is between 6.0 and 7.0.
                      </p>
                    </div>

                    <div className="rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]">
                      <h3 className="font-bold mb-2 text-[#2d3a25]">Field Clearing</h3>
                      <p className="text-[#4f5d46]">
                        Remove all weeds, rocks, and debris from the field. Clear any previous
                        crop residues to prevent disease carry-over.
                      </p>
                    </div>

                    <div className="rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]">
                      <h3 className="font-bold mb-2 text-[#2d3a25]">Plowing and Harrowing</h3>
                      <p className="text-[#4f5d46] mb-2">
                        Plow the field to a depth of 20-25 cm to loosen the soil and improve
                        aeration:
                      </p>
                      <ul className="list-disc list-inside text-[#556d4a] space-y-1">
                        <li>First plowing: 2-3 weeks before planting</li>
                        <li>Harrowing: 1 week before planting to create a fine seedbed</li>
                        <li>Level the field to ensure proper water distribution</li>
                      </ul>
                    </div>

                    <div className="rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]">
                      <h3 className="font-bold mb-2 text-[#2d3a25]">Organic Matter Addition</h3>
                      <p className="text-[#4f5d46]">
                        Incorporate compost or well-rotted manure at 5-10 tons per hectare to
                        improve soil structure and fertility.
                      </p>
                    </div>

                    <div className="rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]">
                      <h3 className="font-bold mb-2 text-[#2d3a25]">Drainage System</h3>
                      <p className="text-[#4f5d46]">
                        Ensure proper drainage by creating furrows and drainage canals to prevent
                        waterlogging during heavy rains.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="planting">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-[#8acb88]" />
                      Planting Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Optimal Planting Time</h3>
                      <p className="text-gray-600 mb-2">
                        Corn should be planted when soil temperature reaches at least 15°C (60°F):
                      </p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Wet season: June to July</li>
                        <li>Dry season: December to January (with irrigation)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Seed Selection</h3>
                      <p className="text-gray-600">
                        Choose certified seeds from reputable suppliers. Select varieties based on:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                        <li>Maturity period (90-120 days)</li>
                        <li>Yield potential</li>
                        <li>Disease resistance</li>
                        <li>Local climate adaptability</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Planting Method</h3>
                      <p className="text-gray-600 mb-2">Recommended planting specifications:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Row spacing: 75-80 cm</li>
                        <li>Plant spacing: 20-25 cm within rows</li>
                        <li>Planting depth: 3-5 cm</li>
                        <li>Seed rate: 20-25 kg per hectare</li>
                        <li>Plant population: 50,000-66,000 plants per hectare</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Seed Treatment</h3>
                      <p className="text-gray-600">
                        Treat seeds with fungicide before planting to protect against soil-borne
                        diseases and improve germination rates.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Planting Technique</h3>
                      <p className="text-gray-600">
                        Plant 2-3 seeds per hill and thin to one strong seedling after emergence
                        (7-10 days after planting). Ensure even spacing for uniform growth.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fertilization">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-6 w-6 text-[#8acb88]" />
                      Fertilization Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Basal Application (At Planting)</h3>
                      <p className="text-gray-600 mb-2">Apply at planting time:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Complete fertilizer (14-14-14): 2-3 bags per hectare</li>
                        <li>Apply in furrows 5-7 cm away from seeds</li>
                        <li>Mix thoroughly with soil</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">First Side Dressing (21-25 Days After Planting)</h3>
                      <p className="text-gray-600 mb-2">Apply when corn is knee-high:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Urea (46-0-0): 2 bags per hectare</li>
                        <li>Apply beside the plants in a band</li>
                        <li>Incorporate into soil and irrigate if needed</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Second Side Dressing (40-45 Days After Planting)</h3>
                      <p className="text-gray-600 mb-2">Apply before tasseling:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Urea (46-0-0): 2 bags per hectare</li>
                        <li>Apply between rows</li>
                        <li>Hill up soil around plants after application</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Micronutrients</h3>
                      <p className="text-gray-600">
                        Apply foliar fertilizer containing zinc, boron, and other micronutrients
                        at 30 and 50 days after planting for improved growth and yield.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Important Notes</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Adjust fertilizer rates based on soil test results</li>
                        <li>Apply fertilizer when soil is moist</li>
                        <li>Avoid direct contact between fertilizer and plant stems</li>
                        <li>Water immediately after application if soil is dry</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="irrigation">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplet className="h-6 w-6 text-[#8acb88]" />
                      Irrigation Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Water Requirements</h3>
                      <p className="text-gray-600 mb-2">
                        Corn requires adequate water throughout its growth cycle:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Total water need: 500-800 mm per season</li>
                        <li>Critical periods: germination, tasseling, and grain filling</li>
                        <li>Avoid water stress during flowering (60-70 days after planting)</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Irrigation Schedule</h3>
                      <p className="text-gray-600 mb-2">Recommended irrigation timing:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Germination stage (0-15 days): Keep soil consistently moist</li>
                        <li>Vegetative stage (15-50 days): Irrigate every 7-10 days</li>
                        <li>Flowering stage (50-70 days): Irrigate every 5-7 days</li>
                        <li>Grain filling (70-90 days): Irrigate every 7-10 days</li>
                        <li>Maturity (90+ days): Reduce irrigation, stop 2 weeks before harvest</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Irrigation Methods</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-gray-700">Furrow Irrigation</p>
                          <p className="text-gray-600">
                            Most common method. Water flows through furrows between crop rows.
                            Efficient for flat to gently sloping fields.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Sprinkler Irrigation</p>
                          <p className="text-gray-600">
                            Uniform water distribution. Suitable for undulating terrain. Requires
                            initial investment but saves water.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Drip Irrigation</p>
                          <p className="text-gray-600">
                            Most water-efficient method. Direct water to root zone. Ideal for areas
                            with water scarcity.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Monitoring Soil Moisture</h3>
                      <p className="text-gray-600">
                        Check soil moisture by digging 15-20 cm deep. Soil should be moist but not
                        waterlogged. If soil crumbles easily, irrigation is needed.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Tips for Efficient Irrigation</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Irrigate early morning or late afternoon to reduce evaporation</li>
                        <li>Apply mulch to conserve soil moisture</li>
                        <li>Ensure proper drainage to prevent waterlogging</li>
                        <li>Adjust irrigation based on rainfall and weather conditions</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pest">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-6 w-6 text-[#8acb88]" />
                      Pest and Disease Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-bold mb-2">Common Pests</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-gray-700">Corn Borer</p>
                          <p className="text-gray-600">
                            Larvae bore into stalks and ears. Control: Apply insecticide at
                            whorl stage. Use Bt-based products or chemical insecticides.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Fall Armyworm</p>
                          <p className="text-gray-600">
                            Feeds on leaves and whorl. Control: Scout regularly, apply insecticide
                            when 10% of plants show damage. Early intervention is critical.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Corn Earworm</p>
                          <p className="text-gray-600">
                            Damages developing ears. Control: Apply insecticide during silking
                            stage. Focus on ear zone application.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Aphids</p>
                          <p className="text-gray-600">
                            Suck plant sap and transmit viruses. Control: Use insecticidal soap or
                            systemic insecticides. Encourage natural predators.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Common Diseases</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-gray-700">Corn Leaf Blight</p>
                          <p className="text-gray-600">
                            Fungal disease causing leaf lesions. Control: Use resistant varieties,
                            apply fungicide at first sign of disease, ensure proper spacing.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Corn Rust</p>
                          <p className="text-gray-600">
                            Orange pustules on leaves. Control: Apply fungicide preventively,
                            remove infected leaves, use resistant varieties.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Downy Mildew</p>
                          <p className="text-gray-600">
                            Causes stunting and leaf stripes. Control: Use disease-free seeds,
                            apply fungicide seed treatment, avoid overhead irrigation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Integrated Pest Management (IPM)</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Regular field scouting (twice weekly)</li>
                        <li>Use pheromone traps for monitoring</li>
                        <li>Encourage beneficial insects</li>
                        <li>Rotate crops to break pest cycles</li>
                        <li>Remove and destroy infected plants</li>
                        <li>Use resistant varieties when available</li>
                        <li>Apply pesticides only when threshold levels are reached</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Preventive Measures</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Plant at recommended spacing for good air circulation</li>
                        <li>Remove weeds that harbor pests</li>
                        <li>Practice crop rotation</li>
                        <li>Use clean, certified seeds</li>
                        <li>Maintain field sanitation</li>
                        <li>Monitor weather conditions for disease outbreaks</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="harvest">
                <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.75rem] overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
                    <CardTitle className="flex items-center gap-2 text-[#3d5a36]">
                      <Calendar className="h-6 w-6 text-[#5d8044]" />
                      Harvest Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    <div>
                      <h3 className="font-bold mb-2">Maturity Indicators</h3>
                      <p className="text-gray-600 mb-2">
                        Corn is ready for harvest when it reaches physiological maturity:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Black layer formation at kernel base (100-120 days after planting)</li>
                        <li>Husks turn brown and dry</li>
                        <li>Kernels are hard and dent when pressed</li>
                        <li>Moisture content: 20-25% for grain corn</li>
                        <li>Leaves begin to dry and turn brown</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Harvesting Methods</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-gray-700">Manual Harvesting</p>
                          <p className="text-gray-600">
                            Suitable for small farms. Harvest by hand-picking ears. Less damage to
                            kernels. More labor-intensive but allows selective harvesting.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Mechanical Harvesting</p>
                          <p className="text-gray-600">
                            Use corn combine harvester for large fields. Efficient and fast.
                            Requires field to be dry. Best when moisture is 20-22%.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Post-Harvest Handling</h3>
                      <p className="text-gray-600 mb-2">Proper handling ensures quality and storage life:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Dry corn to 14% moisture content for safe storage</li>
                        <li>Remove damaged and diseased kernels</li>
                        <li>Clean and remove debris</li>
                        <li>Store in dry, well-ventilated area</li>
                        <li>Use moisture-proof containers or bags</li>
                        <li>Apply pest control measures in storage</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Drying Methods</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-gray-700">Sun Drying</p>
                          <p className="text-gray-600">
                            Spread ears or kernels on clean surface under sun. Turn regularly.
                            Takes 3-7 days depending on weather.
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Mechanical Drying</p>
                          <p className="text-gray-600">
                            Use grain dryer for faster, uniform drying. Better quality control.
                            Requires investment in equipment.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Harvest Tips</h3>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Harvest on dry days to reduce moisture</li>
                        <li>Don't delay harvest - overripe corn is prone to pest damage</li>
                        <li>Check moisture content before storage</li>
                        <li>Handle carefully to minimize kernel damage</li>
                        <li>Store in rodent-proof containers</li>
                        <li>Monitor stored grain regularly for pests and moisture</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold mb-2">Expected Yield</h3>
                      <p className="text-gray-600">
                        With proper management, expect yields of 4-8 tons per hectare. Factors
                        affecting yield include variety, weather, pest management, and crop care.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
