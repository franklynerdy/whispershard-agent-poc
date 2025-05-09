import { useState, useRef } from "react";
import ChatWindow from "./ChatWindow";
import RuleTab from "./RuleTab";
import ScriptsPanel from "./ScriptsPanel";
import ImageCarousel from "./ImageCarousel";

type Tab = "chat" | "rules" | "scripts" | "images";

export default function TabView() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleScriptSelect = (content: string) => {
    // Set content to input and switch to chat tab
    if (inputRef.current) {
      inputRef.current.value = content;
      // Focus the input
      inputRef.current.focus();
    }
    setActiveTab("chat");
  };

  // Helper function to set search term for images
  const setImageSearchTerm = (term: string) => {
    setSearchTerm(term);
    setActiveTab("images");
  };

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabChange("chat")}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <svg className="h-5 w-5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Chat
          </button>

          <button
            onClick={() => handleTabChange("rules")}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <svg className="h-5 w-5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Rules
          </button>

          <button
            onClick={() => handleTabChange("scripts")}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === "scripts"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <svg className="h-5 w-5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Scripts
          </button>

          <button
            onClick={() => handleTabChange("images")}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === "images"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <svg className="h-5 w-5 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Images
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "chat" && <ChatWindow setImageSearchTerm={setImageSearchTerm} />}
        {activeTab === "rules" && <RuleTab />}
        {activeTab === "scripts" && <ScriptsPanel onSelectScript={handleScriptSelect} searchTerm="combat" />}
        {activeTab === "images" && <ImageCarousel searchTerm={searchTerm} />}
      </div>
    </div>
  );
}