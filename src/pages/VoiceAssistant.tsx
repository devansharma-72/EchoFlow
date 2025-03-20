import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Conversation {
  user_text: string;
  ai_response: string;
  timestamp: string;
}

export default function VoiceAssistant() {
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [listening, setListening] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognition = useRef<any>(null);
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      fetchConversationHistory();
    }
  }, [userId]);

  const fetchConversationHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/voice-assistant/history/${userId}`);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversation history:", error);
    }
  };

  const startListening = () => {
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    recognition.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      sendToAI(transcript);
    };
    recognition.current.start();
    setListening(true);
  };

  const stopListening = () => {
    recognition.current?.stop();
    setListening(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const sendToAI = async (text: string) => {
    if (!userId) return;

    try {
      const response = await axios.post("http://localhost:5000/api/voice-assistant", {
        user_id: userId,
        text: text
      });
      
      setAiResponse(response.data.response);
      setIsSpeaking(true);
      fetchConversationHistory();
    } catch (error) {
      console.error("Error communicating with AI:", error);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: "url('/back.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1 }}
        className="relative bg-white/90 shadow-lg rounded-xl p-6 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">AI Voice Assistant</h2>
        
        <div className="flex gap-4 mb-4 justify-center">
          <Button 
            onClick={startListening} 
            disabled={listening || !userId}
            className="bg-black hover:bg-purple-800"
          >
            🎤 {listening ? "Listening..." : "Start Speaking"}
          </Button>
          <Button 
            onClick={stopListening} 
            disabled={!listening}
            variant="secondary"
          >
            ⏹ Stop Recording
          </Button>
          {isSpeaking && (
            <Button 
              onClick={stopSpeaking}
              variant="destructive"
            >
              🔇 Stop AI Speech
            </Button>
          )}
        </div>

        <Textarea
          value={userInput}
          placeholder="Your speech will appear here..."
          className="w-full h-24 mb-4 bg-white/90 text-gray-900"
          readOnly
        />

        {aiResponse && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900">AI Response</h3>
            <p className="text-gray-800">{aiResponse}</p>
          </div>
        )}

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Conversations</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversations.slice(-3).reverse().map((conv, index) => (
                <div key={index} className="bg-white/80 p-3 rounded-lg">
                  <p className="text-gray-900"><strong>You:</strong> {conv.user_text}</p>
                  <p className="text-purple-800"><strong>AI:</strong> {conv.ai_response}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}