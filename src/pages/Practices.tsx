import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquareText, Trophy, Brain, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import backgroundImage from "./download.jpg";

const Practices = () => {
  const navigate = useNavigate();

  const practiceModules = [
    {
      title: "ScenarioTalks",
      icon: <MessageSquareText className="h-12 w-12 text-white mb-4" />,
      description: "Immerse yourself in real-world scenarios and practice dynamic conversations",
      route: "/ScenarioTalks"
    },
    {
      title: "Fun Exercises",
      icon: <Trophy className="h-12 w-12 text-white mb-4" />,
      description: "Practice with engaging, gamified exercises designed for your needs",
      route: "/exercises"
    },
    {
      title: "Test Your Memory",
      icon: <Brain className="h-12 w-12 text-white mb-4" />,
      description: "Memory-based word repetition game to enhance speech recognition",
      route: "/wordrepition"
    }
  ];

  return (
    <div 
      className="relative min-h-screen text-white bg-cover bg-center" 
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative container px-4 py-16 mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-8 text-gray-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6 drop-shadow-lg">
            Practice Modules
          </h1>
          <p className="mt-6 text-lg leading-8 max-w-2xl mx-auto text-gray-200 italic">
            Choose your practice mode and elevate your communication skills
          </p>
        </motion.div>

        {/* Modules Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {practiceModules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => navigate(module.route)}
                className="bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-xl cursor-pointer group"
              >
                <CardContent className="p-8 flex flex-col items-center text-center h-64">
                  <div className="mb-6 text-4xl transition-transform group-hover:scale-110">
                    {module.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-white">
                    {module.title}
                  </h3>
                  <p className="text-gray-100 leading-6">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Practices;
