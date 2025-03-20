import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Scenario {
  prompt: string;
  wordLimit: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

interface AnalysisResult {
  scenario: string; // Scenario prompt
  difficulty: string;
  word_limit: number;
  response: string; // AI-processed response
  feedback: string;
  timestamp?: string; // Optional timestamp
}


const sampleScenarios: Scenario[] = [
  {
    prompt: "You're at a networking event and need to introduce yourself and your profession in under a minute.",
    wordLimit: 100,
    difficulty: "Beginner",
  },
  {
    prompt: "Explain the plot of your favorite movie to someone who has never seen it before.",
    wordLimit: 150,
    difficulty: "Beginner",
  },
  {
    prompt: "You're in a job interview and the interviewer asks, 'Where do you see yourself in five years?'",
    wordLimit: 120,
    difficulty: "Intermediate",
  },
  {
    prompt: "Convince your friend to start eating healthy by explaining its long-term benefits.",
    wordLimit: 130,
    difficulty: "Intermediate",
  },
  {
    prompt: "You are a travel vlogger describing the beauty and attractions of your favorite city.",
    wordLimit: 200,
    difficulty: "Intermediate",
  },
  {
    prompt: "Debate why artificial intelligence is beneficial or harmful for society.",
    wordLimit: 180,
    difficulty: "Advanced",
  },
  {
    prompt: "You are pitching a new eco-friendly product to a panel of investors.",
    wordLimit: 160,
    difficulty: "Advanced",
  },
  {
    prompt: "Describe a historical event as if you were a news reporter covering it live.",
    wordLimit: 175,
    difficulty: "Advanced",
  },
  {
    prompt: "You are explaining the rules of your favorite sport to someone who has never played it before.",
    wordLimit: 140,
    difficulty: "Beginner",
  },
  {
    prompt: "Give a short motivational speech to inspire someone going through a tough time.",
    wordLimit: 150,
    difficulty: "Intermediate",
  },
];

export default function ScenarioTalks() {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [userResponse, setUserResponse] = useState("");
  const [feedback, setFeedback] = useState<AnalysisResult | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognition = useRef<any>(null);
  const { user } = useUser();                // ✅ Clerk hook to get the user
  const userId = user?.id;                   // ✅ Unique user ID
  const [userProgress, setUserProgress] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!userId) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/progress/${userId}`);
        setUserProgress(response.data.progress || []);
      } catch (error) {
        console.error("Error fetching user progress:", error);
      }
    };
  
    fetchUserProgress();
  }, [userId]);
  

  const analyzeResponse = async () => {
    if (!currentScenario || !userResponse.trim() || !userId) return;

    try {
      setLoadingFeedback(true);
      setError(null);
      const response = await axios.post<AnalysisResult>(
        "http://localhost:5000/api/analyze",
        {
          user_id: userId,                // ✅ Sending user_id to Flask
          scenario: currentScenario,
          response: userResponse.trim(),
        }
      );
      setFeedback(response.data);
    } catch (error) {
      setError("Failed to analyze response. Please try again.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const generateScenario = () => {
    const randomScenario =
      sampleScenarios[Math.floor(Math.random() * sampleScenarios.length)];
    setCurrentScenario(randomScenario);
    setUserResponse("");
    setFeedback(null);
  };

  const toggleRecording = () => {
    if (listening) {
      recognition.current.stop();
      setListening(false);
    } else {
      recognition.current = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.current.continuous = true;
      recognition.current.interimResults = false;
      recognition.current.onresult = (event: any) => {
        setUserResponse((prev) =>
          prev + " " + event.results[event.results.length - 1][0].transcript
        );
      };
      recognition.current.start();
      setListening(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 text-white flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-300/20 to-white opacity-40"></div>
      
      {/* Main Content Wrapper */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-xl p-8 max-w-3xl w-full text-black">
        
        <div className="flex justify-between mb-6">
          <Button 
            onClick={generateScenario} 
            className="px-6 py-3 text-lg bg-white text-indigo-700 rounded-lg shadow-lg transition hover:bg-indigo-600 hover:text-white transform hover:scale-105"
          >
            Generate Scenario
        </Button>
        <Button 
          onClick={toggleRecording} 
          className={`px-6 py-3 text-lg rounded-lg shadow-lg transition hover:scale-105 ${
            listening ? "bg-red-500 text-white" : "bg-indigo-500 text-white"
          }`}
        >
          {listening ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>


        {currentScenario && (
          <div className="mb-6 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-white">{currentScenario.prompt}</h2>
            <p className="text-gray-300 mt-2">Word Limit: {currentScenario.wordLimit}</p>
            <p className="text-gray-300">Difficulty: {currentScenario.difficulty}</p>
          </div>
        )}

        <Textarea
          value={userResponse}
          placeholder="Recording in progress..."
          className="w-full h-32 border p-2 rounded-lg"
          disabled
        />

        <div className="flex justify-end gap-4 mt-4">
          <Button onClick={analyzeResponse} disabled={!userResponse.trim() || loadingFeedback}>
            {loadingFeedback ? "Analyzing..." : "Get AI Feedback"}
            </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {feedback && (
          <div className="mt-6 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-black mb-3">AI Analysis</h3>
            <p className="text-blue-800"><strong>Scenario:</strong> {feedback.scenario}</p>
            <p className="text-blue-800"><strong>Difficulty:</strong> {feedback.difficulty}</p>
            <p className="text-blue-800"><strong>Word Limit:</strong> {feedback.word_limit}</p>
            <p className="text-blue-800"><strong>Your Response:</strong> {feedback.response}</p>
            <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
              <strong className="text-blue-800">Feedback:</strong>
              <pre className="whitespace-pre-wrap text-black">
                {feedback.feedback}
              </pre>
            </div>
          </div>

        )}
        {userProgress.length > 0 && (
        <div className="mt-6 p-6 bg-green-100/20 backdrop-blur-md rounded-lg shadow-lg border border-green-300/50 max-w-3xl">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Your Progress</h3>
          {userProgress.slice().reverse().map((entry, index) => (
            <div key={index} className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20 shadow-md">
              <p><strong className="text-blue-800">Scenario:</strong> {entry.scenario ? entry.scenario : "N/A"}</p>
              <p><strong className="text-blue-800">Difficulty:</strong> {entry.difficulty ? entry.difficulty : "N/A"}</p>
              <p><strong className="text-blue-800">Response:</strong> {entry.response ? entry.response : "N/A"}</p>
              <div className="mt-2 p-3 bg-white/5 rounded-lg">
              <strong className="text-blue-800">Feedback:</strong> {/* Changed text color to black */}
                <pre className="whitespace-pre-wrap text-black">
                  {entry.feedback ? entry.feedback : "No feedback available"}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
}