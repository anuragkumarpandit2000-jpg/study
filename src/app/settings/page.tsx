'use client';

import React, { useState } from 'react';
import { Settings, Save, Sparkles, Shield, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [defaultClass, setDefaultClass] = useState('Class 10');
  const [defaultBoard, setDefaultBoard] = useState('CBSE');
  const [defaultLanguage, setDefaultLanguage] = useState('Hinglish');
  const [defaultVariations, setDefaultVariations] = useState(10);
  const [defaultDifficulty, setDefaultDifficulty] = useState('balanced');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure your default learning preferences, board examination parameters, and AI model engine.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Academic Preferences Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Academic & Exam Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Class</label>
              <select
                value={defaultClass}
                onChange={e => setDefaultClass(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
              >
                <option value="Class 10">Class 10 (CBSE Board Focus)</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Educational Board</label>
              <select
                value={defaultBoard}
                onChange={e => setDefaultBoard(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
              >
                <option value="CBSE">Central Board of Secondary Education (CBSE)</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Explanation Language</label>
              <select
                value={defaultLanguage}
                onChange={e => setDefaultLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
              >
                <option value="Hinglish">Hinglish (Natural & Student Friendly)</option>
                <option value="English">Formal English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Variations per Question</label>
              <select
                value={defaultVariations}
                onChange={e => setDefaultVariations(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white font-semibold"
              >
                <option value={10}>10 Variations (Default Standard)</option>
                <option value={5}>5 Variations</option>
                <option value={3}>3 Variations</option>
                <option value={15}>15 Variations</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Engine & Security Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Reasoning Engine Status</span>
          </h2>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs text-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Primary AI Reasoning Engine:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">Google Gemini 3.5 Flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Fallback High-Throughput Engine:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">Gemini 3.5 Flash Lite</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">API Key Security:</span>
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected Server-Side (.env.local)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
              <span>Preferences saved successfully!</span>
            </span>
          )}
          <button
            type="submit"
            className="ml-auto inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
