import { WorkspaceWelcome } from "@/components/ui/welcome";
import { Scissors, Video, Signal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Scissors className="h-4 w-4 text-purple-500" />,
      label: "Draft Legal Document",
      onClick: () => navigate("/draft"),
    },
    {
      icon: <Video className="h-4 w-4 text-red-500" />,
      label: "Track Client Case",
      onClick: () => navigate("/track"),
    },
    {
      icon: <Signal className="h-4 w-4 text-blue-500" />,
      label: "Start Legal Research",
      isBeta: true,
      onClick: () => navigate("/research"),
    },
  ];

  return (
    <div className="flex min-h-screen pt-24 pb-6 w-full items-center justify-center bg-[#09090B] px-4 md:px-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full flex justify-center">
        <WorkspaceWelcome
          userName={user?.name || "Counsel"}
          actions={actions}
          videoThumbnail="/lawyer.png"
          videoSrc="/WhatsApp%20Video%202026-05-06%20at%201.39.10%20PM.mp4"
          videoTitle="LegalForge Product Walkthrough"
          videoDescription="See how LegalForge streamlines legal research, draft generation, and case tracking in one workspace."
        />
      </div>
    </div>
  );
}
