import React, { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "react-tooltip";

const ProgressPage = ({ userId }) => {
  const [progressData, setProgressData] = useState([]);
  const [stats, setStats] = useState({});
  const [goalExercises, setGoalExercises] = useState(10);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [timeRange, setTimeRange] = useState("week");
  const [heatmapData, setHeatmapData] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress/${userId}`);
        const data = await res.json();
        setProgressData(data.progress);
        setStats(data.stats || {});
        setCompletedExercises(data.stats?.completedExercises || 0);

        // 🔹 Process streaks
        const streaks = data.streaks || [];
        const formattedStreaks = streaks.map(entry => ({
          date: entry.date, // Ensure MongoDB returns in YYYY-MM-DD format
          count: entry.count, // Number of exercises completed that day
        }));

        setHeatmapData(formattedStreaks);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };
    fetchProgress();
  }, [userId]);

  const fetchAIAnalysis = async () => {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, progress: progressData }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
    }
  };

  useEffect(() => {
    fetchAIAnalysis();
  }, [progressData]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Your Progress</h2>

      {/* Streak Heatmap */}
      <div>
        <h3 className="text-lg font-semibold">Streak Tracker</h3>
        <CalendarHeatmap
          startDate={new Date(new Date().setDate(new Date().getDate() - 30))}
          endDate={new Date()}
          values={heatmapData}
          classForValue={(value) => {
            if (!value) return "color-empty";
            return `color-scale-${Math.min(value.count, 4)}`;
          }}
          tooltipDataAttrs={(value) => ({
            "data-tooltip-id": "tooltip",
            "data-tooltip-content": `${value.date}: ${value.count} exercises completed`,
          })}
        />
        <Tooltip id="tooltip" />
      </div>

      {/* Goal Progress */}
      <div>
        <h3 className="text-lg font-semibold">Goal Progress</h3>
        <Progress value={(completedExercises / goalExercises) * 100} />
        <p>{completedExercises} / {goalExercises} exercises completed</p>
      </div>

      {/* Time Range Selector */}
      <div>
        <h3 className="text-lg font-semibold">Compare Progress</h3>
        <select
          onChange={(e) => setTimeRange(e.target.value)}
          value={timeRange}
          className="p-2 border rounded"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      {/* AI Feedback */}
      <div>
        <h3 className="text-lg font-semibold">Personalized AI Feedback</h3>
        <p>{feedback || "Analyzing your progress..."}</p>
      </div>
    </div>
  );
};

export default ProgressPage;
