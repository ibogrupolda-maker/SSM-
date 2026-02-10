
import React, { useState } from 'react';
import { Wand2, Download, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { generateImage, editImageWithPrompt } from '../services/geminiService';

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');

  const handleAction = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      let result;
      if (mode === 'generate') {
        result = await generateImage(prompt);
      } else if (image) {
        result = await editImageWithPrompt(image, prompt);
      }
      if (result) setImage(result);
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setMode('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-8 p-6 md:p-10 overflow-y-auto custom-scrollbar">
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="text-yellow-400" />
            Image Studio
          </h1>
          <p className="text-gray-400">Transform your ideas into high-fidelity visuals using Gemini 2.5.</p>
        </div>

        <div className="glass rounded-3xl p-6 space-y-6">
          <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
            <button 
              onClick={() => setMode('generate')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'generate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setMode('edit')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'edit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              Edit Image
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'generate' ? "A futuristic city floating in the clouds, cyberpunk style..." : "Add a robot companion next to the person..."}
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-gray-100 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleAction}
              disabled={loading || !prompt.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/40"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
              {mode === 'generate' ? 'Generate Visual' : 'Apply Edit'}
            </button>

            <label className="bg-white/5 hover:bg-white/10 text-white p-4 rounded-2xl cursor-pointer transition-all border border-white/10">
              <Upload size={24} />
              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
            </label>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[450px] flex flex-col gap-4">
        <div className="flex-1 glass rounded-[2.5rem] overflow-hidden flex items-center justify-center relative group aspect-square">
          {image ? (
            <>
              <img src={image} alt="Generated" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <a 
                  href={image} 
                  download="aura-creation.png"
                  className="bg-white text-gray-900 p-3 rounded-full hover:scale-110 transition-transform shadow-2xl"
                >
                  <Download size={24} />
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-gray-600 p-10 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-2">
                <ImageIcon size={40} className="text-gray-700" />
              </div>
              <p className="text-lg font-medium text-gray-500">Canvas awaits your imagination</p>
              <p className="text-sm">Generated images will appear here</p>
            </div>
          )}
        </div>
        
        {image && (
          <div className="glass rounded-2xl p-4 flex items-center justify-between border-l-4 border-indigo-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Visual Ready</p>
                <p className="text-xs text-gray-400">1024x1024 • PNG format</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageStudio;
