import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Bot, User, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

const SAMBANOVA_API_KEY = "0c7a5721-dd2d-412e-add2-ebfd1cf0a9de";

interface RatedMessage {
  role: "user" | "assistant";
  content: string;
  rating?: number;
}

export function AIChat() {
  const [messages, setMessages] = useState<RatedMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your HCI tutor powered by SambaNova. I can help you understand Human-Computer Interaction concepts, answer your questions, and provide learning suggestions. What would you like to learn about today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiKeyMissing = !SAMBANOVA_API_KEY || SAMBANOVA_API_KEY.length < 5;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Suggested starter questions
  const suggestedQuestions = [
    "What are the key principles of HCI?",
    "Explain user-centered design",
    "apa itu Ujian Kebolehgunaan?",
    "Bagaimanakah cara saya mencipta antara muka pengguna yang berkesan?",
  ];


  const StarRating = ({ index }: { index: number }) => {
  const msg = messages[index];
  const [showThankYou, setShowThankYou] = useState(false);
  const [isRating, setIsRating] = useState(false);

  if (msg.role !== "assistant") return null;

  const handleClick = (value: number) => {
    // Only allow rating once
    if (msg.rating) return;
    
    setIsRating(true);
    setMessages((prev) => {
      const updated = [...prev];
      updated[index].rating = value;
      return updated;
    });

    // Start animation sequence
    setTimeout(() => {
      setIsRating(false);
      setShowThankYou(true);
      
      // Hide thank you message after 2 seconds
      setTimeout(() => {
        setShowThankYou(false);
      }, 2000);
    }, 500); // Wait for stars to fade
  };

  return (
    <div className="mt-1 h-7 relative">
      {/* Stars */}
      <div 
        className={`flex gap-1 cursor-pointer transition-opacity duration-500 ${
          isRating || showThankYou ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            onClick={() => handleClick(n)}
            className={`text-lg transition ${
              msg.rating && msg.rating >= n
                ? "text-yellow-500" // ⭐ Active star
                : "text-gray-300"   // ☆ Inactive star
            } hover:scale-110 ${msg.rating ? 'cursor-default' : 'cursor-pointer'}`}
          >
            ★
          </span>
        ))}
      </div>
      
      {/* Thank you message */}
      {showThankYou && (
        <div 
          className="absolute inset-0 flex items-center animate-in fade-in duration-300"
        >
          <p className="text-sm text-indigo-600 italic">Thank you for rating us! ✨</p>
        </div>
      )}
    </div>
  );
};

  // ⭐ Clean API Call — safe JSON fallbacks
  const callSambaNova = async (chatMessages: any[]) => {
    const payload = {
      model: "Meta-Llama-3.1-8B-Instruct",
      messages: chatMessages,
      stream: false,
    };

    const response = await fetch(
      "https://api.sambanova.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    let data;

    // Attempt JSON parsing
    try {
      data = await response.json();
    } catch (err) {
      // If JSON fails, read raw text
      const text = await response.text();
      throw new Error(`API returned non-JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || "SambaNova API error.");
    }

    return (
      data?.choices?.[0]?.message?.content ||
      "I'm sorry — I couldn't generate a response."
    );
  };

  // ⭐ Send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const fullHistory = [
        { role: "system", content: "You are a helpful HCI tutor." },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];

      const reply = await callSambaNova(fullHistory);

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      const msg = err?.message || "Unknown error occurred.";

      toast.error(msg);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enter key → send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl text-gray-900">AI Tutor</h2>
        <p className="text-gray-600">Get instant help and personalized learning suggestions</p>
      </div>

      {/* API KEY WARNING */}
      {apiKeyMissing && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <p className="text-sm">
              <strong>Missing SambaNova API Key:</strong>  
              Add your key at the top of <code>AIChat.tsx</code>.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" /> HCI Learning Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx}>
                  <div
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Bot className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "user" && (
                      <div className="bg-indigo-600 p-2 rounded-full">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Ratings for assistant messages */}
                  {msg.role === "assistant" && <StarRating index={idx} />}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div className="bg-gray-100 rounded-lg p-3 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: ".1s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: ".2s" }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t">
              <p className="text-xs text-gray-600 mb-2">Try asking:</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Ask me anything about HCI..."
              value={input}
              disabled={apiKeyMissing || loading}
              onKeyPress={handleKeyPress}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading || apiKeyMissing}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}