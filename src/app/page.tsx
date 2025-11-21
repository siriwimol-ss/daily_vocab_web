"use client";

import { useState, useEffect, useCallback } from 'react';
import { Word, Difficulty } from '@/types';
import { ValidateSentenceResponse } from '@/types'; 

//URL Link ของ Backend
const BACKEND_API_URL = 'http://127.0.0.1:8000/api'; 

interface CurrentWord extends Word {
    id: number;
}

export default function Home() {
    const [currentWord, setCurrentWord] = useState<CurrentWord | null>(null);
    const [sentence, setSentence] = useState<string>('');
    const [apiResult, setApiResult] = useState<ValidateSentenceResponse | null>(null);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getRandomWord = useCallback(async () => {
        setIsLoading(true);
       try {
            // ยิงไปที่ http://localhost:8000/api/word (GET)
            const response = await fetch(`${BACKEND_API_URL}/word`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch word');
            }

            const wordData = await response.json();

            // แปลงข้อมูลจาก Database ให้เข้ากับหน้าเว็บ
            setCurrentWord({
                id: wordData.id,
                word: wordData.word,
                meaning: wordData.definition, // ใน DB ชื่อ definition
                difficulty: wordData.difficulty_level as Difficulty // ใน DB ชื่อ difficulty_level
            });
            
            setSentence('');
            setApiResult(null);
            setIsSubmitted(false);
        } catch (error) {
            console.error("Error fetching random word:", error);
            alert("ไม่สามารถดึงคำศัพท์ได้ (เช็คว่า Backend รันอยู่ไหม)");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // เรียกใช้ตอนเปิดหน้าเว็บครั้งแรก
    useEffect(() => {
        getRandomWord();
    }, [getRandomWord]);

    const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSentence(e.target.value);
        if (isSubmitted) {
            setApiResult(null);
            setIsSubmitted(false);
        }
    };

    const handleSubmitSentence = async () => {
        if (!currentWord || !sentence.trim() || isLoading) return;

        setIsLoading(true);
        const payload = {
            word_id: currentWord.id,
            sentence: sentence
        };
        
        try {
            const response = await fetch(`${BACKEND_API_URL}/validate-sentence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`API Error: ${errorData.detail || 'Unknown error'}`);
                return;
            }

            const result: ValidateSentenceResponse = await response.json();
            setApiResult(result);
            setIsSubmitted(true);
            
            // Save history logic (Optional)
            const history = JSON.parse(localStorage.getItem('wordHistory') || '[]');
            history.push({
                word: currentWord.word,
                sentence: sentence,
                score: result.score,
                difficulty: result.level,
                timestamp: new Date().toISOString(),
            });
            localStorage.setItem('wordHistory', JSON.stringify(history));

        } catch (error) {
            console.error("Connect Error:", error);
            alert("เชื่อมต่อ Backend ไม่ได้!");
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number | undefined) => {
        if (score === undefined) return 'text-gray-700';
        if (score >= 8.0) return 'text-success';
        if (score >= 6.0) return 'text-warning';
        return 'text-danger';
    };

    if (!currentWord) return <div className="flex justify-center items-center h-screen">Loading Word...</div>;

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-gray-800">Word Challenge</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-primary">{currentWord.word}</h2>
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${currentWord.difficulty === 'Advanced' ? 'bg-red-200 text-red-800' : currentWord.difficulty === 'Intermediate' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {currentWord.difficulty}
                    </span>
                </div>
                <p className="text-lg text-gray-700 mb-6">{currentWord.meaning}</p>
                
                <div className="mb-6">
                    <textarea
                        className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary outline-none"
                        rows={4}
                        placeholder="แต่งประโยคภาษาอังกฤษโดยใช้คำศัพท์ด้านบน..."
                        value={sentence}
                        onChange={handleSentenceChange}
                        disabled={isSubmitted || isLoading}
                    ></textarea>
                </div>

                {apiResult && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                        <h3 className="text-xl font-bold text-gray-800">ผลการตรวจ:</h3>
                        <p className={`text-3xl font-bold ${getScoreColor(apiResult.score)}`}>
                            {apiResult.score.toFixed(1)} / 10.0
                        </p>
                        <p className="text-gray-700 mt-2"><strong>คำแนะนำ:</strong> {apiResult.suggestion}</p>
                    </div>
                )}

                <button
                    onClick={isSubmitted ? getRandomWord : handleSubmitSentence}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 transition font-bold text-lg shadow-md disabled:opacity-50"
                    disabled={!sentence.trim() || isLoading}
                >
                    {isLoading ? 'Loading...' : (isSubmitted ? 'ฝึกคำต่อไป (Next Word)' : 'ส่งตรวจ (Submit)')}
                </button>
            </div>
        </div>
    );
}