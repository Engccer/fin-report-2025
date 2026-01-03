"use client";

import { useState } from "react";
import { analyzeFinancialData } from "@/actions/ai";
import { Sparkles, Send } from "lucide-react";

export function AIAnalysis({ contextData }: { contextData: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeFinancialData(contextData, question);
      setAnswer(result);
    } catch (e) {
      setAnswer("죄송합니다. 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
            <Sparkles className="text-primary w-5 h-5" />
            <h3 className="text-lg font-semibold text-primary">AI 재정 분석 및 질문</h3>
        </div>
        <button className="text-sm text-primary hover:underline">
            {isOpen ? "접기" : "펼치기"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700">이 보고서에 대해 궁금한 점을 물어보세요. (예: "가장 큰 지출 항목은 무엇인가요?", "지난달 대비 수입 변화는?")</p>

            <div className="flex gap-2">
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="질문을 입력하세요..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
            />
            <button
                onClick={handleAsk}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
                {loading ? "분석 중..." : <Send className="w-4 h-4" />}
            </button>
            </div>

            {answer && (
            <div className="bg-white p-4 rounded-md border border-gray-200 mt-4">
                <p className="text-gray-800 whitespace-pre-wrap">{answer}</p>
            </div>
            )}
        </div>
      )}
    </div>
  );
}
