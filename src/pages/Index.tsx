import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic2, Activity } from "lucide-react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { FaLungs, FaMicrophone, FaVolumeUp, FaHeadphones, FaPalette } from "react-icons/fa";
import { useState, useEffect } from "react";
import backgroundImage from "./download.jpg";

const motivationalQuotes = [
  { quote: "Speech is power: speech is to persuade, to convert, to compel.", author: "Ralph Waldo Emerson" },
  { quote: "If you want to conquer fear, don't sit home and think about it. Go out and get busy.", author: "Dale Carnegie" },
  { quote: "Your voice has the power to move people's hearts. Use it wisely.", author: "Morgan Freeman" },
  { quote: "The way we communicate with others and with ourselves ultimately determines the quality of our lives.", author: "Tony Robbins" },
  { quote: "Words are, of course, the most powerful drug used by mankind.", author: "Rudyard Kipling" }
];

const tips = [
  { title: "Breathing Exercises", icon: <FaLungs className="text-blue-400" />, description: "Improve airflow and speech clarity with diaphragmatic breathing techniques." },
  { title: "Articulation Drills", icon: <FaMicrophone className="text-green-400" />, description: "Practice precise pronunciation with targeted mouth movement exercises." },
  { title: "Vocal Warmups", icon: <FaVolumeUp className="text-purple-400" />, description: "Strengthen vocal cords with humming and pitch variation exercises." },
  { title: "Auditory Training", icon: <FaHeadphones className="text-orange-400" />, description: "Enhance speech comprehension through active listening practice." },
  { title: "Oral Motor Skills", icon: <FaPalette className="text-red-400" />, description: "Develop mouth muscle control with targeted facial exercises." },
  { title: "Pacing Techniques", icon: <FaMicrophone className="text-yellow-400" />, description: "Improve speech rhythm and fluency with strategic pauses and pacing." }
];

const Index = () => {
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  useEffect(() => {
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  return (
    <div className="relative min-h-screen text-white bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="absolute inset-0 bg-black/50"></div>

      <SignedOut>
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative flex flex-col items-center justify-center h-screen text-center">
          <h1 className="text-5xl font-bold sm:text-6xl mb-6 animate-pulse">Welcome to EchoFlow!!!</h1>
          <p className="mt-4 text-lg leading-8 max-w-2xl">Your AI-powered speech therapy companion. Sign in to start practicing!</p>
          <SignInButton mode="modal">
            <Button className="mt-6 px-6 py-3 text-lg font-semibold bg-white text-indigo-700 rounded-lg shadow-lg hover:bg-indigo-600 hover:text-white transform hover:scale-105">
              Sign In
            </Button>
          </SignInButton>
        </motion.div>
      </SignedOut>

      <SignedIn>
        <div className="relative container px-4 py-16 mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-center">
            <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl sm:text-7xl font-bold text-white text-center uppercase tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] glow-animation">
              Fluency Unlocked
            </motion.h1>
            <p className="mt-6 text-lg leading-8 max-w-2xl mx-auto text-gray-200 italic">"{currentQuote.quote}"</p>
            <p className="text-sm mt-2 text-gray-300">- {currentQuote.author}</p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button onClick={() => navigate("/practices")} className="px-6 py-3 text-lg bg-white text-black rounded-lg shadow-lg hover:bg-purple-800 hover:text-white transform hover:scale-105">
                Start Practice <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button onClick={() => navigate("/voice-assistant")} className="px-6 py-3 text-lg bg-white text-black rounded-lg shadow-lg hover:bg-purple-800 hover:text-white transform hover:scale-105">
                Voice Assistant <Mic2 className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tips.map((tip, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/30 hover:shadow-xl">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 text-3xl">{tip.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{tip.title}</h3>
                  <p className="text-gray-100 leading-6">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default Index;
