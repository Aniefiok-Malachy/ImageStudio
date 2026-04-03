/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Image as ImageIcon, Sparkles, Loader2, Download, RefreshCw, Check, User, UserCircle, Layout, Dumbbell, MapPin, TreePine, Home, Camera, Activity, ZoomIn, View, Accessibility } from 'lucide-react';

// Initialize Gemini AI
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
const STYLES = [
  { 
    id: 'white', 
    name: 'White Studio', 
    preview: 'https://picsum.photos/seed/white-studio/200/200',
    prompt: 'on a clean, minimalist white studio background with soft professional lighting and natural soft shadows' 
  },
  { 
    id: 'marble', 
    name: 'Marble Surface', 
    preview: 'https://picsum.photos/seed/marble/200/200',
    prompt: 'on a premium white marble surface with elegant soft studio lighting and realistic reflections' 
  },
  { 
    id: 'dark', 
    name: 'Dark Moody', 
    preview: 'https://picsum.photos/seed/dark-moody/200/200',
    prompt: 'on a dark charcoal textured background with dramatic spotlighting and deep soft shadows, professional product photography' 
  },
  { 
    id: 'lifestyle', 
    name: 'Lifestyle', 
    preview: 'https://picsum.photos/seed/lifestyle/200/200',
    prompt: 'in a bright, modern lifestyle setting with natural sunlight, soft bokeh background, and professional composition' 
  },
];

const SCENES = [
  { id: 'studio', name: 'Studio', icon: Camera, prompt: 'in a professional photography studio with high-end lighting and a clean backdrop' },
  { id: 'gym', name: 'Gym', icon: Dumbbell, prompt: 'inside a modern, well-equipped gym with fitness equipment and industrial lighting' },
  { id: 'urban', name: 'Urban City', icon: MapPin, prompt: 'on a busy urban city street with modern architecture, street lights, and a vibrant atmosphere' },
  { id: 'nature', name: 'Nature', icon: TreePine, prompt: 'in a beautiful outdoor nature setting with lush greenery, natural sunlight, and soft shadows' },
  { id: 'home', name: 'Home', icon: Home, prompt: 'in a cozy, modern home lifestyle setting with warm interior lighting and a comfortable atmosphere' },
];

const POSES = [
  { id: 'neutral', name: 'Standing / Neutral', icon: Accessibility, prompt: 'in a natural, standing neutral pose' },
  { id: 'action', name: 'Action / In-use', icon: Activity, prompt: 'in an active, dynamic pose showing the product in use naturally' },
  { id: 'closeup', name: 'Close-up Focus', icon: ZoomIn, prompt: 'in a close-up shot focusing on the product details and how it is being held or worn' },
  { id: 'side', name: 'Side-angle Dynamic', icon: View, prompt: 'in a dynamic side-angle pose to show the product profile and form' },
];

const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Grey'];
const HAIRSTYLES = ['Short', 'Medium', 'Long', 'Curly', 'Bald'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'];

type Mode = 'studio' | 'avatar';
type Gender = 'male' | 'female';
type AspectRatio = '1:1' | '16:9' | '4:3';

const ASPECT_RATIOS: { id: AspectRatio; name: string; class: string }[] = [
  { id: '1:1', name: '1:1 Square', class: 'aspect-square' },
  { id: '16:9', name: '16:9 Wide', class: 'aspect-video' },
  { id: '4:3', name: '4:3 Standard', class: 'aspect-[4/3]' },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedScene, setSelectedScene] = useState(SCENES[0]);
  const [selectedPose, setSelectedPose] = useState(POSES[0]);
  const [mode, setMode] = useState<Mode>('studio');
  const [gender, setGender] = useState<Gender>('female');
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);
  const [hairstyle, setHairstyle] = useState(HAIRSTYLES[2]);
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePhoto = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Extract base64 data
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      let prompt = '';
      if (mode === 'studio') {
        prompt = `Keep the product in the image exactly the same. Replace the entire background. Place the product ${selectedStyle.prompt}. Ensure the lighting is professional, shadows are natural, and the overall look is a high-end commercial product photo.`;
      } else {
        prompt = `Generate a realistic ${gender} human avatar with ${skinTone.toLowerCase()} skin tone, ${hairColor.toLowerCase()} ${hairstyle.toLowerCase()} hair, using the product from the image. The product must be kept accurate in shape, color, and details. The avatar should be ${selectedPose.prompt}. Place the product naturally on the ${gender} avatar (either they are wearing it if it's wearable, or holding it naturally if it's a handheld item). The scene should be ${selectedScene.prompt}. This should be a professional lifestyle product photo with lighting and realistic shadows matching the environment. Ensure the product looks naturally worn or used in the scene.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was generated. Please try again.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError("Failed to generate image. Please try a different photo or style.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `product-${mode}-${mode === 'avatar' ? gender : selectedStyle.id}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Photo Production Studio</h1>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
            AI POWERED
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            {/* Mode Selection */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Select Mode</h2>
              <div className="flex p-1 bg-slate-200 rounded-2xl">
                <button
                  onClick={() => setMode('studio')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'studio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Layout className="w-4 h-4" /> Studio
                </button>
                <button
                  onClick={() => setMode('avatar')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all
                    ${mode === 'avatar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UserCircle className="w-4 h-4" /> Avatar
                </button>
              </div>
            </section>

            {/* Aspect Ratio Selection */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Aspect Ratio</h2>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all border
                      ${aspectRatio === ratio.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}
                  >
                    <div className={`w-6 border-2 rounded-sm mb-1 ${ratio.id === '1:1' ? 'h-6' : ratio.id === '16:9' ? 'h-3.5' : 'h-4.5'} ${aspectRatio === ratio.id ? 'border-white' : 'border-slate-300'}`} />
                    {ratio.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">1. Upload Product</h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-200 aspect-square flex flex-col items-center justify-center p-4 overflow-hidden
                  ${selectedImage ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {selectedImage ? (
                  <>
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="absolute inset-0 w-full h-full object-contain p-4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Change Image
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">Click to upload</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {mode === 'studio' ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">2. Select Style</h2>
                <div className="flex flex-wrap gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      title={style.name}
                      className={`relative w-10 h-10 group overflow-hidden rounded-lg border transition-all duration-200
                        ${selectedStyle.id === style.id 
                          ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2 scale-110' 
                          : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      <img 
                        src={style.preview} 
                        alt={style.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`absolute inset-0 bg-black/20 transition-opacity ${selectedStyle.id === style.id ? 'opacity-0' : 'opacity-40 group-hover:opacity-20'}`} />
                      {selectedStyle.id === style.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-500 italic">
                  Selected: <span className="text-indigo-600 font-bold">{selectedStyle.name}</span>
                </p>
              </section>
            ) : (
              <>
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">2. Avatar Appearance</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setGender('female')}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center justify-center gap-2
                          ${gender === 'female' 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                      >
                        <User className="w-4 h-4" /> Female
                      </button>
                      <button
                        onClick={() => setGender('male')}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center justify-center gap-2
                          ${gender === 'male' 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                      >
                        <User className="w-4 h-4" /> Male
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Skin Tone</label>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_TONES.map(tone => (
                          <button
                            key={tone}
                            onClick={() => setSkinTone(tone)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                              ${skinTone === tone ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Hair Color</label>
                        <select 
                          value={hairColor}
                          onChange={(e) => setHairColor(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {HAIR_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Hairstyle</label>
                        <select 
                          value={hairstyle}
                          onChange={(e) => setHairstyle(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {HAIRSTYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">3. Scene Selector</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {SCENES.map((scene) => (
                      <button
                        key={scene.id}
                        onClick={() => setSelectedScene(scene)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-3
                          ${selectedScene.id === scene.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                      >
                        <scene.icon className={`w-4 h-4 ${selectedScene.id === scene.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{scene.name}</span>
                        {selectedScene.id === scene.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">4. Pose Selector</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {POSES.map((pose) => (
                      <button
                        key={pose.id}
                        onClick={() => setSelectedPose(pose)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-3
                          ${selectedPose.id === pose.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                      >
                        <pose.icon className={`w-4 h-4 ${selectedPose.id === pose.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{pose.name}</span>
                        {selectedPose.id === pose.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            <button
              onClick={generatePhoto}
              disabled={!selectedImage || isGenerating}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-xl
                ${!selectedImage || isGenerating 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 shadow-indigo-200'}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  {mode === 'studio' ? 'Generate Studio Photo' : 'Generate Avatar Photo'}
                </>
              )}
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-125 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm font-medium text-slate-600">
                  {mode === 'studio' ? 'Studio Result' : 'Avatar Result'}
                </span>
                {generatedImage && (
                  <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
              </div>
              
              <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [bg-size:20px_20px]">
                <AnimatePresence mode="wait">
                  {generatedImage ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden group ${ASPECT_RATIOS.find(r => r.id === aspectRatio)?.class || 'aspect-square'}`}
                    >
                      <img 
                        src={generatedImage} 
                        alt="Generated Result" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-4"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                        <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">
                          {mode === 'studio' ? 'Creating your studio shot...' : 'Generating your avatar...'}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {mode === 'studio' 
                            ? `Applying ${selectedStyle.name.toLowerCase()} lighting` 
                            : `Modeling in ${selectedScene.name.toLowerCase()} with ${gender} avatar in ${selectedPose.name.toLowerCase()} pose`}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center max-w-sm"
                    >
                      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        {mode === 'studio' ? <ImageIcon className="w-10 h-10 text-slate-300" /> : <UserCircle className="w-10 h-10 text-slate-300" />}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to transform</h3>
                      <p className="text-slate-500">
                        {mode === 'studio' 
                          ? 'Upload a product photo and select a style to see the magic happen.' 
                          : 'Upload a product and select a gender to see it on a realistic avatar.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Tips/Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <h4 className="font-bold text-sm mb-1">Best Results</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Use clear photos with good lighting and a simple background for the best AI transformation.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <h4 className="font-bold text-sm mb-1">Preservation</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Our AI is tuned to keep your product details sharp while completely reimagining the environment.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <h4 className="font-bold text-sm mb-1">
                  {mode === 'studio' ? 'Studio Lighting' : 'Natural Interaction'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {mode === 'studio' 
                    ? 'Each style applies unique light physics to match the selected background perfectly.' 
                    : 'The AI ensures the product is held or worn naturally with matched shadows.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12 text-center">
        <p className="text-sm text-slate-400">© 2026 Product Photo Studio. Powered by Gemini AI.</p>
      </footer>
    </div>
  );
}
