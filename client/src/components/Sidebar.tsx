import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-dark text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">WhisperShard Agent</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <Link href="/">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive("/") ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </a>
            </Link>

            <Link href="/api-endpoints">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive("/api-endpoints") ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                API Endpoints
              </a>
            </Link>

            <Link href="/mongodb">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive("/mongodb") ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                MongoDB
              </a>
            </Link>

            <Link href="/chat">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive("/chat") ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Chat Interface
              </a>
            </Link>

            <Link href="/settings">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive("/settings") ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}>
                <svg className="mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </a>
            </Link>
          </nav>
        </div>
        <div className="flex-shrink-0 flex bg-gray-800 p-4">
          <div className="flex items-center">
            <div>
              <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Developer</p>
              <p className="text-xs font-medium text-gray-300">Replit Environment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
