import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import StatusCard from "@/components/StatusCard";
import ApiEndpoints from "@/components/ApiEndpoints";
import TerminalWindow from "@/components/TerminalWindow";
import TabView from "@/components/TabView";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLegacyUI, setShowLegacyUI] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col w-full md:w-0 md:flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden pl-2 pt-2 bg-dark">
          <div className="flex items-center justify-between pr-2">
            <button 
              type="button" 
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-white hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white">WhisperShard Agent</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-dark">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Sidebar content */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <h1 className="text-xl font-bold text-white">WhisperShard Agent</h1>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {/* Navigation items */}
                  <a href="#" className="bg-gray-800 text-white group flex items-center px-2 py-2 text-base font-medium rounded-md">
                    <svg className="mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </a>
                  <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-base font-medium rounded-md">
                    <svg className="mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Chat
                  </a>
                  <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-base font-medium rounded-md">
                    <svg className="mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Rules
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-3 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-0 mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">WhisperShard Agent v0.6.0 🧙‍♂️</h1>
                <button 
                  onClick={() => setShowLegacyUI(!showLegacyUI)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none border border-gray-300 rounded-md shadow-sm"
                >
                  {showLegacyUI ? "Switch to New UI" : "Switch to Legacy UI"}
                </button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8">
              {showLegacyUI ? (
                <>
                  {/* Legacy UI Components */}
                  <StatusCard />
                  <ApiEndpoints />
                  <TerminalWindow />
                </>
              ) : (
                <>
                  {/* Status Card - Always visible for context */}
                  <StatusCard />
                  
                  {/* New Tabbed Interface */}
                  <div className="mt-4 sm:mt-8">
                    <TabView />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
