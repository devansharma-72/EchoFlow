import { useState, useEffect, useRef } from "react";  
import { Button } from "@/components/ui/button";  
import { useNavigate } from "react-router-dom";  
import { Brain, Mic, Volume2, Timer, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";


// Declare global types for SpeechRecognition  
declare global {  
  interface Window {  
    SpeechRecognition: any;  
    webkitSpeechRecognition: any;  
  }  
}  

// Medium difficulty words  
const mediumWords = [  
  "Mountain", "Forest", "Castle", "Notebook", "Balloon", "Bicycle", "Planet",  
  "Lighthouse", "Horizon", "Butterfly", "Adventure", "Beautiful", "Celebrate",  
  "Discovery", "Elephant", "Fantastic", "Generous", "Happiness", "Important",  
  "Journey", "Knowledge", "Language", "Memories", "Nutrition", "Original",  
  "Peaceful", "Question", "Remember", "Surprise", "Tomorrow", "Universe",  
  "Vacation", "Wonderful", "Yourself", "Afternoon",
];  

// Difficult words  
const difficultWords = [  
  "Ephemeral", "Mellifluous", "Euphoria", "Ineffable", "Oscillate", "Nocturnal",  
  "Garrulous", "Vestigial", "Pernicious", "Wanderlust", "Vernacular", "Loquacious",  
  "Incandescent", "Sublime", "Axiom", "Effervescent", "Quiddity", "Nebulous",  
  "Limerence", "Fandangle", "Bombastic"     
];  

// Get 5 words: 2 difficult and 3 medium  
const getRandomWords = (): string[] => {  // ✅ Explicitly set return type
  const randomMediumWords: string[] = [];
  const randomDifficultWords: string[] = [];

  for (let i = 0; i < 3; i++) {
    const randomMediumWord = mediumWords[Math.floor(Math.random() * mediumWords.length)];
    randomMediumWords.push(randomMediumWord);
  }

  for (let i = 0; i < 2; i++) {
    const randomDifficultWord = difficultWords[Math.floor(Math.random() * difficultWords.length)];
    randomDifficultWords.push(randomDifficultWord);
  }

  return [...randomDifficultWords, ...randomMediumWords];  // ✅ This will now be recognized as string[]
};



const WordRepetitionGame = () => {
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null); 
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);  
  const [isMemorizing, setIsMemorizing] = useState(true);  
  const [timeLeft, setTimeLeft] = useState(6);
  const recognitionRef = useRef<any>(null);  
  const navigate = useNavigate();  
  const { user } = useUser();
  const userId = user?.id;
  const [speechResult, setSpeechResult] = useState("");  

  // Initialize SpeechRecognition  
  useEffect(() => {  
    const SpeechRecognition =  
      window.SpeechRecognition || window.webkitSpeechRecognition;  

    if (!SpeechRecognition) {  
      alert("Speech Recognition is not supported in this browser.");  
      return;  
    }  

    recognitionRef.current = new SpeechRecognition();  
    recognitionRef.current.continuous = false;  
    recognitionRef.current.interimResults = false;  
    recognitionRef.current.lang = "en-US";  

    recognitionRef.current.onresult = (event: any) => {
      let speechResult = "";
      
      // Capture all recognized words in case of multiple results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        speechResult += event.results[i][0].transcript + " ";
      }
    
      speechResult = speechResult.trim();
      setSpeechResult(speechResult);  
    
      setFeedback({ message: `You said: "${speechResult}"`, type: "success" });
    
      const userWords = speechResult.toLowerCase().split(" ");
      let correctCount = 0;
    
      targetWords.forEach((word) => {
        if (userWords.includes(word.toLowerCase())) {
          correctCount++;
        }
      });
    
      const accuracy = Math.round((correctCount / targetWords.length) * 100);
    
      setTimeout(() => {
        setFeedback({
          message: `You said: "${speechResult}"\nAccuracy: ${accuracy}% (${correctCount}/${targetWords.length} words correct)`,
          type: accuracy >= 70 ? "success" : "error",
        });
        saveProgress(accuracy, speechResult);  
      }, 1500);
    };
    
    recognitionRef.current.onerror = (event: any) => {  
      console.error("Speech recognition error:", event.error);  
      setFeedback({ message: "Sorry, there was an error with speech recognition.", type: 'error' });  
    };  

    recognitionRef.current.onend = () => {  
      setIsRecording(false);  
    }; 
  }, [targetWords]);  

  // Timer effect for memorization
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMemorizing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMemorizing, timeLeft]);

  // Fetch User Progress on Component Mount
  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    }
  }, [userId]);

  const startRecording = () => {  
    if (!isRecording) {  
      recognitionRef.current?.start();  
      setIsRecording(true);  
      setIsMemorizing(false);  
    }  
  };  

  const stopRecording = () => {  
    if (isRecording) {  
      recognitionRef.current?.stop();  
      setIsRecording(false);  
    }  
  };  

  const startNewRound = () => {  
    const randomWords: string[] = getRandomWords();
    setTargetWords(randomWords);  
    setFeedback(null);  
    setIsRecording(false);  
    setIsMemorizing(true);  
    setTimeLeft(6);
  
    setTimeout(() => {  
      setIsMemorizing(false);  
    }, 6000);  
  };  

  const fetchUserProgress = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/word-repetition/progress/${userId}`);
      setUserProgress(response.data.progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };
  
  const saveProgress = async (accuracy: number, speechResult: string) => {
    try {
      await axios.post("http://localhost:5000/api/word-repetition/progress", {
        user_id: userId,
        accuracy: accuracy,
        words_attempted: targetWords.length,
        correct_words: accuracy >= 70 ? targetWords.length : Math.round((accuracy / 100) * targetWords.length),
        user_speech: speechResult, 
        target_words: targetWords,
        timestamp: new Date().toISOString(),
      });
  
      fetchUserProgress();  
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  return (  
    <div 
      className="relative min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: 'url(/back.jpg)' }} // Add your image path here
    >
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-300/10 to-white opacity-10"></div>

      <div className="relative container px-4 py-16 mx-auto flex flex-col items-center text-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-10"
        >
          <Brain size={56} className="text-white" />
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Memory Challenge
          </h1>
        </motion.div>

        {/* Main Content */}
        <div className="w-full max-w-2xl space-y-8">
          {/* Memorization Section */}
          {isMemorizing && targetWords.length > 0 && (  
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Timer className="text-purple-300" />
                  Memorize These Words
                </h2>
                <span className="text-xl font-mono text-purple-300">{timeLeft}s</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {targetWords.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 text-center bg-white/5 rounded-lg border border-white/10"
                  >
                    <span className="text-lg font-medium text-purple-100">{word}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Practice Controls */}
          <div className="space-y-6">
            {/* Recording Status */}
            {isRecording && (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center gap-2 text-purple-200 animate-pulse"
              >
                <Mic className="h-6 w-6" />
                <span className="text-lg">Listening...</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "h-16 text-lg gap-2 transition-all",
                  isRecording ? "bg-red-500/90 hover:bg-red-400" : "bg-purple-500/90 hover:bg-purple-400"
                )}
              >
                {isRecording ? (
                  <>
                    <Volume2 className="h-5 w-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Start Practice
                  </>
                )}
              </Button>

              <Button 
                onClick={startNewRound}
                variant="secondary"
                className="h-16 text-lg gap-2 bg-white/10 hover:bg-white/20"
              >
                <RotateCw className="h-5 w-5" />
                New Challenge
              </Button>
            </div>
            {/* Feedback */}
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border-l-4",
                  feedback.type === 'success' 
                    ? "bg-green-100/20 border-green-400"
                    : "bg-red-100/20 border-red-400"
                )}
              >
                <p className={cn(
                  "text-lg flex items-center gap-2",
                  feedback.type === 'success' ? "text-green-300" : "text-red-300"
                )}>
                  {feedback.type === 'success' ? '🎉' : '⚠️'}
                  {feedback.message}
                </p>
              </motion.div>
            )}
            {userProgress.length > 0 && (
              <div className="mt-6 p-4 bg-green-100/20 backdrop-blur-md rounded-lg shadow-md border border-green-300/50">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Your Progress</h3>
                {[...userProgress].reverse().map((entry, index) => (
                  <div key={index} className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                    <p className="text-purple-100">
                      <strong>Target Words:</strong> {entry.target_words?.join(", ") || "No target words"}
                    </p>
                    <p className="text-purple-100">
                      <strong>Your Speech:</strong> {entry.user_speech || "No speech recorded"}
                    </p>
                    <p className="text-purple-100">
                      <strong>Accuracy:</strong> {entry.accuracy ?? "N/A"}%
                    </p>
                    <p className="text-purple-100">
                      <strong>Date:</strong> {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "No date"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default WordRepetitionGame;