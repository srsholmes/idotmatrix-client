import { useState } from "react";
import { DeviceProvider } from "./hooks/useDevice";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { MainContent } from "./components/layout/MainContent";

export default function App() {
  const [activePanel, setActivePanel] = useState("screen");

  return (
    <DeviceProvider>
      <div className="flex h-screen bg-gray-950 text-gray-100">
        <Sidebar activePanel={activePanel} onSelectPanel={setActivePanel} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <MainContent activePanel={activePanel} />
        </div>
      </div>
    </DeviceProvider>
  );
}
