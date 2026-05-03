import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Sprout, Droplet, Leaf, Bug, Calendar } from "lucide-react";
import { motion } from "motion/react";

export function CornGuidePage() {
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, ease: "easeOut" },
  } as const;
  const guideCardClass = "border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.75rem] overflow-hidden";
  const guideHeaderClass = "bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]";
  const guideTitleClass = "flex items-center gap-2 text-[#3d5a36]";
  const guideContentClass = "space-y-5 pt-6";
  const guideBlockClass = "rounded-[1rem] bg-[#f8fdf3] p-5 border border-[#e5ede0]";
  const guideHeadingClass = "font-bold mb-2 text-[#2d3a25]";
  const guideTextClass = "text-[#4f5d46]";
  const guideListClass = "list-disc list-inside text-[#556d4a] space-y-1";
  const guideSubheadingClass = "font-semibold text-[#3d5a36]";

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
            Corn farming essentials
          </motion.span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]">Corn Farming Guide</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/85 leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
            Comprehensive information about corn farming best practices, from soil preparation to harvest
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div className="max-w-5xl mx-auto" {...fadeUp}>
            <Tabs defaultValue="preparation" className="w-full">
              <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 260 }}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-10 bg-[#e8f2e5] shadow-lg rounded-[1rem] p-1">
                  <TabsTrigger value="preparation">Preparation</TabsTrigger>
                  <TabsTrigger value="planting">Planting</TabsTrigger>
                  <TabsTrigger value="fertilization">Fertilization</TabsTrigger>
                  <TabsTrigger value="irrigation">Irrigation</TabsTrigger>
                  <TabsTrigger value="pest">Pest Control</TabsTrigger>
                  <TabsTrigger value="harvest">Harvest</TabsTrigger>
                </TabsList>
              </motion.div>

              <TabsContent value="preparation">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Sprout className="h-6 w-6 text-[#5d8044]" />
                      Land Preparation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Soil Testing</h3>
                      <p className={guideTextClass}>
                        Before planting, conduct soil tests to determine pH levels and nutrient
                        content. Ideal pH for corn is between 6.0 and 7.0.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Field Clearing</h3>
                      <p className={guideTextClass}>
                        Remove all weeds, rocks, and debris from the field. Clear any previous
                        crop residues to prevent disease carry-over.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Plowing and Harrowing</h3>
                      <p className={`${guideTextClass} mb-2`}>
                        Plow the field to a depth of 20-25 cm to loosen the soil and improve
                        aeration:
                      </p>
                      <ul className={guideListClass}>
                        <li>First plowing: 2-3 weeks before planting</li>
                        <li>Harrowing: 1 week before planting to create a fine seedbed</li>
                        <li>Level the field to ensure proper water distribution</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Organic Matter Addition</h3>
                      <p className={guideTextClass}>
                        Incorporate compost or well-rotted manure at 5-10 tons per hectare to
                        improve soil structure and fertility.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Drainage System</h3>
                      <p className={guideTextClass}>
                        Ensure proper drainage by creating furrows and drainage canals to prevent
                        waterlogging during heavy rains.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="planting">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Calendar className="h-6 w-6 text-[#5d8044]" />
                      Planting Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Optimal Planting Time</h3>
                      <p className={`${guideTextClass} mb-2`}>
                        Corn should be planted when soil temperature reaches at least 15°C (60°F):
                      </p>
                      <ul className={guideListClass}>
                        <li>Wet season: June to July</li>
                        <li>Dry season: December to January (with irrigation)</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Seed Selection</h3>
                      <p className={guideTextClass}>
                        Choose certified seeds from reputable suppliers. Select varieties based on:
                      </p>
                      <ul className={`${guideListClass} mt-2`}>
                        <li>Maturity period (90-120 days)</li>
                        <li>Yield potential</li>
                        <li>Disease resistance</li>
                        <li>Local climate adaptability</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Planting Method</h3>
                      <p className={`${guideTextClass} mb-2`}>Recommended planting specifications:</p>
                      <ul className={guideListClass}>
                        <li>Row spacing: 75-80 cm</li>
                        <li>Plant spacing: 20-25 cm within rows</li>
                        <li>Planting depth: 3-5 cm</li>
                        <li>Seed rate: 20-25 kg per hectare</li>
                        <li>Plant population: 50,000-66,000 plants per hectare</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Seed Treatment</h3>
                      <p className={guideTextClass}>
                        Treat seeds with fungicide before planting to protect against soil-borne
                        diseases and improve germination rates.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Planting Technique</h3>
                      <p className={guideTextClass}>
                        Plant 2-3 seeds per hill and thin to one strong seedling after emergence
                        (7-10 days after planting). Ensure even spacing for uniform growth.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="fertilization">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Leaf className="h-6 w-6 text-[#5d8044]" />
                      Fertilization Guidelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Basal Application (At Planting)</h3>
                      <p className={`${guideTextClass} mb-2`}>Apply at planting time:</p>
                      <ul className={guideListClass}>
                        <li>Complete fertilizer (14-14-14): 2-3 bags per hectare</li>
                        <li>Apply in furrows 5-7 cm away from seeds</li>
                        <li>Mix thoroughly with soil</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>First Side Dressing (21-25 Days After Planting)</h3>
                      <p className={`${guideTextClass} mb-2`}>Apply when corn is knee-high:</p>
                      <ul className={guideListClass}>
                        <li>Urea (46-0-0): 2 bags per hectare</li>
                        <li>Apply beside the plants in a band</li>
                        <li>Incorporate into soil and irrigate if needed</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Second Side Dressing (40-45 Days After Planting)</h3>
                      <p className={`${guideTextClass} mb-2`}>Apply before tasseling:</p>
                      <ul className={guideListClass}>
                        <li>Urea (46-0-0): 2 bags per hectare</li>
                        <li>Apply between rows</li>
                        <li>Hill up soil around plants after application</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Micronutrients</h3>
                      <p className={guideTextClass}>
                        Apply foliar fertilizer containing zinc, boron, and other micronutrients
                        at 30 and 50 days after planting for improved growth and yield.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Important Notes</h3>
                      <ul className={guideListClass}>
                        <li>Adjust fertilizer rates based on soil test results</li>
                        <li>Apply fertilizer when soil is moist</li>
                        <li>Avoid direct contact between fertilizer and plant stems</li>
                        <li>Water immediately after application if soil is dry</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="irrigation">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Droplet className="h-6 w-6 text-[#5d8044]" />
                      Irrigation Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Water Requirements</h3>
                      <p className={`${guideTextClass} mb-2`}>
                        Corn requires adequate water throughout its growth cycle:
                      </p>
                      <ul className={guideListClass}>
                        <li>Total water need: 500-800 mm per season</li>
                        <li>Critical periods: germination, tasseling, and grain filling</li>
                        <li>Avoid water stress during flowering (60-70 days after planting)</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Irrigation Schedule</h3>
                      <p className={`${guideTextClass} mb-2`}>Recommended irrigation timing:</p>
                      <ul className={guideListClass}>
                        <li>Germination stage (0-15 days): Keep soil consistently moist</li>
                        <li>Vegetative stage (15-50 days): Irrigate every 7-10 days</li>
                        <li>Flowering stage (50-70 days): Irrigate every 5-7 days</li>
                        <li>Grain filling (70-90 days): Irrigate every 7-10 days</li>
                        <li>Maturity (90+ days): Reduce irrigation, stop 2 weeks before harvest</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Irrigation Methods</h3>
                      <div className="space-y-3">
                        <div>
                          <p className={guideSubheadingClass}>Furrow Irrigation</p>
                          <p className={guideTextClass}>
                            Most common method. Water flows through furrows between crop rows.
                            Efficient for flat to gently sloping fields.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Sprinkler Irrigation</p>
                          <p className={guideTextClass}>
                            Uniform water distribution. Suitable for undulating terrain. Requires
                            initial investment but saves water.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Drip Irrigation</p>
                          <p className={guideTextClass}>
                            Most water-efficient method. Direct water to root zone. Ideal for areas
                            with water scarcity.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Monitoring Soil Moisture</h3>
                      <p className={guideTextClass}>
                        Check soil moisture by digging 15-20 cm deep. Soil should be moist but not
                        waterlogged. If soil crumbles easily, irrigation is needed.
                      </p>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Tips for Efficient Irrigation</h3>
                      <ul className={guideListClass}>
                        <li>Irrigate early morning or late afternoon to reduce evaporation</li>
                        <li>Apply mulch to conserve soil moisture</li>
                        <li>Ensure proper drainage to prevent waterlogging</li>
                        <li>Adjust irrigation based on rainfall and weather conditions</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="pest">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Bug className="h-6 w-6 text-[#5d8044]" />
                      Pest and Disease Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Common Pests</h3>
                      <div className="space-y-3">
                        <div>
                          <p className={guideSubheadingClass}>Corn Borer</p>
                          <p className={guideTextClass}>
                            Larvae bore into stalks and ears. Control: Apply insecticide at
                            whorl stage. Use Bt-based products or chemical insecticides.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Fall Armyworm</p>
                          <p className={guideTextClass}>
                            Feeds on leaves and whorl. Control: Scout regularly, apply insecticide
                            when 10% of plants show damage. Early intervention is critical.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Corn Earworm</p>
                          <p className={guideTextClass}>
                            Damages developing ears. Control: Apply insecticide during silking
                            stage. Focus on ear zone application.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Aphids</p>
                          <p className={guideTextClass}>
                            Suck plant sap and transmit viruses. Control: Use insecticidal soap or
                            systemic insecticides. Encourage natural predators.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Common Diseases</h3>
                      <div className="space-y-3">
                        <div>
                          <p className={guideSubheadingClass}>Corn Leaf Blight</p>
                          <p className={guideTextClass}>
                            Fungal disease causing leaf lesions. Control: Use resistant varieties,
                            apply fungicide at first sign of disease, ensure proper spacing.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Corn Rust</p>
                          <p className={guideTextClass}>
                            Orange pustules on leaves. Control: Apply fungicide preventively,
                            remove infected leaves, use resistant varieties.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Downy Mildew</p>
                          <p className={guideTextClass}>
                            Causes stunting and leaf stripes. Control: Use disease-free seeds,
                            apply fungicide seed treatment, avoid overhead irrigation.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Integrated Pest Management (IPM)</h3>
                      <ul className={guideListClass}>
                        <li>Regular field scouting (twice weekly)</li>
                        <li>Use pheromone traps for monitoring</li>
                        <li>Encourage beneficial insects</li>
                        <li>Rotate crops to break pest cycles</li>
                        <li>Remove and destroy infected plants</li>
                        <li>Use resistant varieties when available</li>
                        <li>Apply pesticides only when threshold levels are reached</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Preventive Measures</h3>
                      <ul className={guideListClass}>
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
                </motion.div>
              </TabsContent>

              <TabsContent value="harvest">
                <motion.div {...fadeUp} whileHover={{ y: -6, scale: 1.01 }}>
                <Card className={guideCardClass}>
                  <CardHeader className={guideHeaderClass}>
                    <CardTitle className={guideTitleClass}>
                      <Calendar className="h-6 w-6 text-[#5d8044]" />
                      Harvest Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={guideContentClass}>
                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Maturity Indicators</h3>
                      <p className={`${guideTextClass} mb-2`}>
                        Corn is ready for harvest when it reaches physiological maturity:
                      </p>
                      <ul className={guideListClass}>
                        <li>Black layer formation at kernel base (100-120 days after planting)</li>
                        <li>Husks turn brown and dry</li>
                        <li>Kernels are hard and dent when pressed</li>
                        <li>Moisture content: 20-25% for grain corn</li>
                        <li>Leaves begin to dry and turn brown</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Harvesting Methods</h3>
                      <div className="space-y-3">
                        <div>
                          <p className={guideSubheadingClass}>Manual Harvesting</p>
                          <p className={guideTextClass}>
                            Suitable for small farms. Harvest by hand-picking ears. Less damage to
                            kernels. More labor-intensive but allows selective harvesting.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Mechanical Harvesting</p>
                          <p className={guideTextClass}>
                            Use corn combine harvester for large fields. Efficient and fast.
                            Requires field to be dry. Best when moisture is 20-22%.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Post-Harvest Handling</h3>
                      <p className={`${guideTextClass} mb-2`}>Proper handling ensures quality and storage life:</p>
                      <ul className={guideListClass}>
                        <li>Dry corn to 14% moisture content for safe storage</li>
                        <li>Remove damaged and diseased kernels</li>
                        <li>Clean and remove debris</li>
                        <li>Store in dry, well-ventilated area</li>
                        <li>Use moisture-proof containers or bags</li>
                        <li>Apply pest control measures in storage</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Drying Methods</h3>
                      <div className="space-y-2">
                        <div>
                          <p className={guideSubheadingClass}>Sun Drying</p>
                          <p className={guideTextClass}>
                            Spread ears or kernels on clean surface under sun. Turn regularly.
                            Takes 3-7 days depending on weather.
                          </p>
                        </div>
                        <div>
                          <p className={guideSubheadingClass}>Mechanical Drying</p>
                          <p className={guideTextClass}>
                            Use grain dryer for faster, uniform drying. Better quality control.
                            Requires investment in equipment.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Harvest Tips</h3>
                      <ul className={guideListClass}>
                        <li>Harvest on dry days to reduce moisture</li>
                        <li>Don't delay harvest - overripe corn is prone to pest damage</li>
                        <li>Check moisture content before storage</li>
                        <li>Handle carefully to minimize kernel damage</li>
                        <li>Store in rodent-proof containers</li>
                        <li>Monitor stored grain regularly for pests and moisture</li>
                      </ul>
                    </div>

                    <div className={guideBlockClass}>
                      <h3 className={guideHeadingClass}>Expected Yield</h3>
                      <p className={guideTextClass}>
                        With proper management, expect yields of 4-8 tons per hectare. Factors
                        affecting yield include variety, weather, pest management, and crop care.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
