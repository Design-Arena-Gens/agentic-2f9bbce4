'use client';

import { useState } from 'react';

type GenerationType = 'text-to-image' | 'text-to-video' | 'image-to-image';

export default function Home() {
  const [generationType, setGenerationType] = useState<GenerationType>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('30');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && generationType !== 'image-to-image') {
      setError('Please enter a prompt');
      return;
    }

    if (generationType === 'image-to-image' && !imageFile) {
      setError('Please upload an image');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const formData = new FormData();
      formData.append('type', generationType);
      formData.append('prompt', prompt);

      if (generationType === 'text-to-video') {
        formData.append('duration', duration);
      }

      if (imageFile && generationType === 'image-to-image') {
        formData.append('image', imageFile);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">AI Visual Generator</h1>
        <p className="text-gray-400 text-center mb-8">Generate high-quality images and videos with AI</p>

        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-3">Generation Type</label>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setGenerationType('text-to-image')}
              className={`p-3 rounded-lg font-medium transition-colors ${
                generationType === 'text-to-image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              Text → Image
            </button>
            <button
              onClick={() => setGenerationType('text-to-video')}
              className={`p-3 rounded-lg font-medium transition-colors ${
                generationType === 'text-to-video'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              Text → Video
            </button>
            <button
              onClick={() => setGenerationType('image-to-image')}
              className={`p-3 rounded-lg font-medium transition-colors ${
                generationType === 'image-to-image'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
              }`}
            >
              Image → Image
            </button>
          </div>

          {generationType === 'image-to-image' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Upload Reference Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700 file:cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg" />
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              {generationType === 'image-to-image' ? 'Modification Instructions' : 'Prompt'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                generationType === 'text-to-image'
                  ? 'e.g., A photorealistic portrait of a woman in cinematic lighting'
                  : generationType === 'text-to-video'
                  ? 'e.g., A realistic video of a woman walking forward naturally at night'
                  : 'e.g., Make it photorealistic, keep everything else the same'
              }
              className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24 resize-none"
            />
          </div>

          {generationType === 'text-to-video' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Video Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 seconds</option>
                <option value="20">20 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            {generationType === 'text-to-video' ? (
              <video
                src={result}
                controls
                className="w-full rounded-lg"
                autoPlay
                loop
              />
            ) : (
              <img
                src={result}
                alt="Generated"
                className="w-full rounded-lg"
              />
            )}
            <a
              href={result}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
