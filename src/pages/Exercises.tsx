import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, StopCircle, Award, Mic2 } from "lucide-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface Exercise {
  id: number;
  phrase: string;
  difficulty: string;
  completed: boolean;
  attempts: number;
  audioURL: string | null;
  transcribedText: string | null;
  accuracy: number | null;
}

const allTongueTwisters = [
  "Peter Piper picked a peck of pickled peppers",
  "She sells seashells by the seashore",
  "How much wood would a woodchuck chuck",
  "I scream, you scream, we all scream for ice cream",
  "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair",
  "Betty bought some butter, but the butter was bitter",
  "A proper copper coffee pot",
  "Toy boat, toy boat, toy boat",
  "Unique New York, Unique New York",
  "Red lorry, yellow lorry",
];

const getRandomExercises = (count = 5) => {
  const shuffled = [...allTongueTwisters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((phrase, index) => ({
    id: index + 1,
    phrase,
    difficulty: ["Easy", "Medium", "Hard"][index % 3],
    completed: false,
    attempts: 0,
    audioURL: null,
    transcribedText: null,
    accuracy: null,
  }));
};

const calculateAccuracy = (original: string, transcribed: string): number => {
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const originalNormalized = normalizeText(original);
  const transcribedNormalized = normalizeText(transcribed);

  if (!transcribedNormalized) return 0;

  const originalWords = originalNormalized.split(" ");
  const transcribedWords = transcribedNormalized.split(" ");

  let matches = 0;
  const total = originalWords.length;

  originalWords.forEach((word, index) => {
    if (transcribedWords[index] === word) {
      matches++;
    } else if (transcribedWords.includes(word)) {
      matches += 0.5;
    }
  });

  const extraWords = Math.max(transcribedWords.length - originalWords.length, 0);
  const accuracy = ((matches - extraWords * 0.2) / total) * 100;
  return Math.max(accuracy, 0);
};

const Exercises = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const recognition = useRef<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const finalTranscript = useRef("");

  useEffect(() => {
    setExercises(getRandomExercises(5));
    initializeSpeechRecognition();
  }, []);

  useEffect(() => {
    const completed = exercises.filter((ex) => ex.completed).length;
    setOverallProgress((completed / exercises.length) * 100);
  }, [exercises]);

  const initializeSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "en-US";

      recognition.current.onresult = (event: any) => {
        const results = Array.from(event.results) as SpeechRecognitionResult[];
        const latestResult = results[results.length - 1];
        
        if (latestResult.isFinal) {
          finalTranscript.current = latestResult[0].transcript;
        }
      };
      recognition.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };
    }
  };

  const startRecording = async (exerciseId: number) => {
    if (!recognition.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setExercises((prev) =>
          prev.map((ex) =>
            ex.id === exerciseId ? { ...ex, audioURL: audioUrl } : ex
          )
        );
      };

      finalTranscript.current = "";
      setCurrentExerciseId(exerciseId);
      mediaRecorder.current.start();
      recognition.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access required. Please enable permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (recognition.current) {
      recognition.current.stop();
      
      recognition.current.onend = () => {
        setExercises(prev => prev.map(ex => {
          if (ex.id !== currentExerciseId) return ex;
          const accuracy = calculateAccuracy(ex.phrase, finalTranscript.current);
          return {
            ...ex,
            attempts: ex.attempts + 1,
            transcribedText: finalTranscript.current,
            accuracy,
            completed: accuracy >= 70
          };
        }));
      };
    }
    setIsRecording(false);
  };

  const resetExercises = () => {
    setExercises(getRandomExercises(5));
    setOverallProgress(0);
    finalTranscript.current = "";
  };

  const getFeedback = (accuracy: number) => {
    if (accuracy >= 90) return "🎉 Perfect! Excellent articulation!";
    if (accuracy >= 75) return "👍 Great job! Almost there!";
    if (accuracy >= 60) return "💪 Good effort, keep practicing!";
    return "❌ Needs improvement. Try again!";
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 to-blue-500">
      <div className="container py-8 space-y-8 relative z-10">
        <h1 className="text-5xl font-extrabold text-white text-center tracking-wide flex items-center justify-center gap-3">
          <Mic2 className="h-10 w-10 text-white" />
          Speech Practice
        </h1>

        <Card className="w-full p-6 bg-white shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Award className="h-6 w-6 text-primary" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={overallProgress}
              className="h-3 rounded-md bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-600"
            />
          </CardContent>
        </Card>

        <Button
          onClick={resetExercises}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700"
        >
          Reset Exercises
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {exercises.map((exercise) => (
            <Card 
              key={exercise.id}
              className={`p-6 shadow-lg rounded-xl ${
                exercise.completed ? "bg-green-50 border-2 border-green-200" : "bg-white"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-primary">
                  {exercise.phrase}
                  <span className="block text-sm text-muted-foreground mt-1">
                    Difficulty: {exercise.difficulty}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Attempts: {exercise.attempts}
                  </span>
                  {exercise.completed && (
                    <span className="text-green-600 font-semibold">
                      Completed!
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-4">
                  {!isRecording || currentExerciseId !== exercise.id ? (
                    <Button
                      onClick={() => startRecording(exercise.id)}
                      disabled={isRecording}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700"
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      {exercise.attempts > 0 ? "Retry" : "Start Recording"}
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700"
                    >
                      <StopCircle className="mr-2 h-5 w-5" />
                      Stop Recording
                    </Button>
                  )}

                  {exercise.audioURL && (
                    <div className="w-full flex justify-center">
                      <audio
                        controls
                        src={exercise.audioURL}
                        className="w-full bg-gray-100 rounded-md shadow-sm"
                      />
                    </div>
                  )}

                  {(exercise.transcribedText || exercise.accuracy !== null) && (
                    <div className="w-full space-y-2">
                      {exercise.transcribedText && (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">You said:</span>{" "}
                            <span className="italic">{exercise.transcribedText}</span>
                          </p>
                        </div>
                      )}

                      {exercise.accuracy !== null && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <p className="text-lg font-semibold text-blue-800">
                            Accuracy: {exercise.accuracy.toFixed(1)}%
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            {getFeedback(exercise.accuracy)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exercises;