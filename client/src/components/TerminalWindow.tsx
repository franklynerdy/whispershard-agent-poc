import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type LogMessage = {
  text: string;
  color?: string;
  isTyping?: boolean;
};

export default function TerminalWindow() {
  const [logs, setLogs] = useState<LogMessage[]>([
    { text: "$ npm start" },
    { text: "> whispershard-agent-poc@1.0.0 start" },
    { text: "> node server/index.js" },
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, color?: string, isTyping: boolean = false) => {
    setLogs(prev => [...prev, { text, color, isTyping }]);
  };

  const clearLogs = () => {
    setLogs([
      { text: "$ npm start" },
      { text: "> whispershard-agent-poc@1.0.0 start" },
      { text: "> node server/index.js" },
    ]);
  };

  // Initial simulation of server startup
  useEffect(() => {
    const simulateStartup = async () => {
      // Wait a bit before showing logs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog("Server listening on port 5000", "text-green-400");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog("Connected to MongoDB database: whispershard", "text-green-400");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog("Loading scripts from database...", "text-yellow-400");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog("Success! Loaded scripts", "text-green-400");
      
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog("OpenAI API key validated", "text-green-400");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog("Ready to process chat requests. API endpoints active.", "text-blue-400", true);
    };
    
    simulateStartup();
  }, []);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Terminal Output</h2>
          <div>
            <Button 
              onClick={clearLogs}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="mt-5">
          <div 
            ref={terminalRef}
            className="terminal overflow-y-auto"
            style={{ 
              backgroundColor: "#1E293B", 
              color: "#E2E8F0",
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: "0.5rem",
              padding: "1rem",
              overflowY: "auto",
              height: "auto",
              maxHeight: "400px"
            }}
          >
            {logs.map((log, index) => (
              <p 
                key={index} 
                className={`${log.color || ''} ${log.isTyping ? 'typewriter' : ''}`}
                style={log.isTyping ? {
                  overflow: 'hidden',
                  borderRight: '.15em solid #10B981',
                  whiteSpace: 'nowrap',
                  margin: '0 auto',
                  animation: 'typing 3.5s steps(40, end), blink-caret .75s step-end infinite'
                } : {}}
              >
                {log.text}
              </p>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #10B981; }
        }
      `}</style>
    </div>
  );
}
