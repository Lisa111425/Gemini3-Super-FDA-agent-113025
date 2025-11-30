
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  FLOWER_THEMES, 
  TRANSLATIONS, 
  MOCK_AGENTS_INIT, 
  FOLLOW_UP_QUESTIONS,
  MAGIC_TOOLS
} from './constants';
import { AppState, AgentConfig, AVAILABLE_MODELS, LogEntry, ModelProvider, MagicTool, OcrPage } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WowStatus from './components/WowStatus';
import { Play, FileText, Activity, LayoutDashboard, Sparkles, ArrowRight, Loader2, Key, Flower, Zap, Upload, CheckCircle, Image as ImageIcon, PanelLeft, Download, Eye, Edit3 } from 'lucide-react';

// Declaration for global pdfjsLib added via script tag
declare const pdfjsLib: any;

const App: React.FC = () => {
  // State initialization
  const [showLanding, setShowLanding] = useState(true);
  const [state, setState] = useState<AppState>({
    lang: 'en',
    darkMode: false,
    themeId: 'sakura_breeze',
    apiKeys: { gemini: '', openai: '', anthropic: '' },
    globalTask: '',
    globalPrompt: 'You are a helpful assistant in a floral agentic workflow system.',
    ocrText: '',
    
    isSidebarOpen: true,

    // OCR & PDF Defaults
    pdfPages: [],
    ocrModel: 'gemini-2.5-flash',
    ocrPrompt: 'Analyze this document page. Extract text, identify key entities, and summarize the layout.',
    ocrMaxTokens: 12000,

    // Note Keeper
    noteKeeperText: '',
    noteKeeperTool: 'markdown',
    noteKeeperModel: 'gemini-2.5-flash',
    noteKeeperPrompt: 'Convert the following text into well-structured Markdown.',
    noteKeeperOutput: '',
    noteKeeperViewMode: 'preview',

    mana: 100,
    health: 100,
    xp: 0,
    level: 1,
    stress: 0,
    executionLog: []
  });

  const [agents, setAgents] = useState<AgentConfig[]>(MOCK_AGENTS_INIT);
  const [activeTab, setActiveTab] = useState<'doc' | 'tools' | 'agents' | 'dash'>('doc');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineMode, setPipelineMode] = useState(true); // Sequential execution
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentImportRef = useRef<HTMLInputElement>(null);

  // Derived Values
  const currentTheme = FLOWER_THEMES.find(t => t.id === state.themeId) || FLOWER_THEMES[0];
  const t = (key: keyof typeof TRANSLATIONS) => TRANSLATIONS[key][state.lang];
  const colors = state.darkMode ? currentTheme.dark : currentTheme.light;

  // Effects
  useEffect(() => {
    // Apply body background transition
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.fg;
  }, [colors]);

  // Update default prompt when tool changes
  useEffect(() => {
      let toolPrompt = "";
      switch(state.noteKeeperTool) {
          case 'markdown': toolPrompt = "Convert the following text into well-structured Markdown."; break;
          case 'entities': toolPrompt = "Extract exactly 20 key entities from the text in JSON format."; break;
          case 'mindmap': toolPrompt = "Create a Mermaid.js mindmap syntax for the concepts in this text."; break;
          case 'quiz': toolPrompt = "Generate 5 multiple choice questions based on this text."; break;
          case 'keywords': toolPrompt = "Identify the top 10 keywords."; break;
          default: toolPrompt = "Analyze the text.";
      }
      setState(p => ({ ...p, noteKeeperPrompt: toolPrompt }));
  }, [state.noteKeeperTool]);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
      setState(p => ({
          ...p,
          executionLog: [{
              id: Math.random().toString(36),
              timestamp: new Date().toLocaleTimeString(),
              message: msg,
              type
          }, ...p.executionLog]
      }));
  };

  // --- API CALLING LOGIC (Multimodal Support) ---
  const generateContent = async (
      provider: ModelProvider, 
      model: string, 
      systemPrompt: string, 
      userPrompt: string, 
      temp: number,
      maxTokens: number,
      images?: string[] // Array of Base64 strings (data:image/jpeg;base64,...)
  ): Promise<{text: string, tokens: number}> => {
      
      const apiKey = state.apiKeys[provider];
      
      if (!apiKey) {
          // Mock Fallback if no key provided
          await new Promise(r => setTimeout(r, 1500));
          return {
              text: `[MOCK ${provider.toUpperCase()}] Response to: "${userPrompt.substring(0, 30)}..."\n[Images detected: ${images?.length || 0}]\n\n(Please provide a valid API Key in settings for real responses.)`,
              tokens: 150
          };
      }

      try {
          if (provider === 'gemini') {
              const ai = new GoogleGenAI({ apiKey });
              
              // Prepare contents for Gemini (text + images)
              const parts: any[] = [{ text: systemPrompt + "\n\n" + userPrompt }];
              
              if (images && images.length > 0) {
                  images.forEach(img => {
                      // Gemini expects just the base64 data, stripped of the header
                      const base64Data = img.split(',')[1]; 
                      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
                  });
              }

              const response = await ai.models.generateContent({
                  model: model,
                  contents: [{ role: 'user', parts }],
                  config: {
                      temperature: temp,
                      maxOutputTokens: maxTokens,
                  }
              });
              const text = response.text || "";
              return { text, tokens: text.length / 4 }; // approx tokens
          } 
          
          else if (provider === 'openai') {
              // Prepare contents for OpenAI (text + image_urls)
              const content: any[] = [{ type: "text", text: userPrompt }];
              
              if (images && images.length > 0) {
                  images.forEach(img => {
                      content.push({ type: "image_url", image_url: { url: img } }); // OpenAI accepts data URL directly
                  });
              }

              const res = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                      model: model,
                      messages: [
                          { role: "system", content: systemPrompt },
                          { role: "user", content }
                      ],
                      temperature: temp,
                      max_tokens: maxTokens
                  })
              });
              const data = await res.json();
              if (data.error) throw new Error(data.error.message);
              return {
                  text: data.choices[0].message.content,
                  tokens: data.usage?.total_tokens || 0
              };
          }

          else if (provider === 'anthropic') {
               const messagesContent: any[] = [];
               
               if (images && images.length > 0) {
                   images.forEach(img => {
                        const base64Data = img.split(',')[1];
                        messagesContent.push({
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/jpeg",
                                data: base64Data
                            }
                        });
                   });
               }
               messagesContent.push({ type: "text", text: userPrompt });

               const res = await fetch("https://api.anthropic.com/v1/messages", {
                  method: "POST",
                  headers: {
                      "x-api-key": apiKey,
                      "anthropic-version": "2023-06-01",
                      "content-type": "application/json"
                  },
                  body: JSON.stringify({
                      model: model,
                      system: systemPrompt,
                      messages: [{ role: "user", content: messagesContent }],
                      max_tokens: maxTokens,
                      temperature: temp
                  })
              });
              const data = await res.json();
              if (data.error) throw new Error(data.error.message);
              return {
                  text: data.content[0].text,
                  tokens: data.usage?.output_tokens || 0
              };
          }
      } catch (e: any) {
          console.error(e);
          throw new Error(`API Error: ${e.message}`);
      }

      return { text: "Provider not supported", tokens: 0 };
  };

  // --- PDF HANDLING ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
          addLog("Invalid file type. Please upload a PDF.", "error");
          return;
      }

      setIsProcessing(true);
      addLog(`Loading PDF: ${file.name}...`, 'info');

      try {
          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          const numPages = pdf.numPages;
          const pages: OcrPage[] = [];

          addLog(`PDF Loaded. Rendering ${numPages} pages...`, 'info');

          for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.5 }); // Scale for better OCR quality
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({ canvasContext: context!, viewport }).promise;
              const imageData = canvas.toDataURL('image/jpeg', 0.8);
              
              pages.push({
                  pageNumber: i,
                  image: imageData,
                  selected: i === 1 // Select first page by default
              });
          }

          setState(p => ({ ...p, pdfPages: pages, ocrText: '' }));
          addLog("PDF Rendering Complete.", 'success');

      } catch (error: any) {
          addLog(`PDF Error: ${error.message}`, 'error');
          console.error(error);
      } finally {
          setIsProcessing(false);
      }
  };

  const togglePageSelection = (pageNumber: number) => {
      setState(p => ({
          ...p,
          pdfPages: p.pdfPages.map(page => 
              page.pageNumber === pageNumber ? { ...page, selected: !page.selected } : page
          )
      }));
  };

  const executeRealOCR = async () => {
      const selectedPages = state.pdfPages.filter(p => p.selected);
      
      if (selectedPages.length === 0) {
          addLog("No pages selected for OCR.", "error");
          return;
      }

      if (state.mana < 30) {
          alert("Not enough Mana (Need 30) for OCR!");
          return;
      }

      setIsProcessing(true);
      addLog(`Starting OCR Analysis on ${selectedPages.length} pages...`, 'info');
      setState(p => ({ ...p, mana: p.mana - 30, stress: Math.min(100, p.stress + 5) }));

      try {
          // Determine provider from selected model
          let provider: ModelProvider = 'gemini';
          if (state.ocrModel.startsWith('gpt')) provider = 'openai';
          if (state.ocrModel.startsWith('claude')) provider = 'anthropic';

          const images = selectedPages.map(p => p.image);

          const result = await generateContent(
              provider,
              state.ocrModel,
              "You are an advanced Optical Character Recognition and Document Analysis agent.",
              state.ocrPrompt + "\n\n(Perform analysis on the provided document images)",
              0.2, // Low temp for accuracy
              state.ocrMaxTokens,
              images
          );

          setState(p => ({ 
              ...p, 
              ocrText: result.text, 
              xp: p.xp + 50 
          }));
          addLog("OCR Analysis Completed Successfully.", 'success');

      } catch (error: any) {
          addLog(`OCR Failed: ${error.message}`, 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  // --- AGENT MANAGEMENT ---
  const handleAgentUpdate = (id: string, field: keyof AgentConfig, value: any) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  
  // New: Handle Output update and automatically update NEXT agent's input if Pipeline Mode
  const handleAgentOutputUpdate = (index: number, value: string) => {
      setAgents(prev => {
          const newAgents = [...prev];
          newAgents[index] = { ...newAgents[index], output: value };
          
          // If pipeline mode, update next agent's input
          if (pipelineMode && index < newAgents.length - 1) {
              newAgents[index + 1] = { ...newAgents[index + 1], input: value };
          }
          return newAgents;
      });
  };

  const handleExportAgents = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(agents, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "floral_agents_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    addLog("Agents configuration exported.", 'info');
  };

  const handleImportAgents = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedAgents = JSON.parse(event.target?.result as string);
            if (Array.isArray(importedAgents) && importedAgents.every(a => a.id && a.name)) {
                setAgents(importedAgents);
                addLog("Agents configuration imported successfully.", 'success');
            } else {
                addLog("Invalid agent configuration file.", 'error');
            }
        } catch (err) {
            addLog("Error parsing agent configuration file.", 'error');
        }
    };
    reader.readAsText(file);
    // Reset value so same file can be imported again if needed
    e.target.value = '';
  };

  // Run a SINGLE agent
  const runSingleAgent = async (index: number) => {
      const agent = agents[index];
      
      if (state.mana < 5) {
          alert("Not enough Mana! Need 5.");
          return;
      }

      setIsProcessing(true);
      addLog(`Running Agent: ${agent.name}...`, 'info');

      // Update Agent status to running
      setAgents(prev => prev.map((a, i) => i === index ? { ...a, status: 'running' } : a));
      
      // Determine input: use current agent input, fallback to global/prev if empty (though UI usually handles this)
      let currentInput = agent.input;
      if (!currentInput && index === 0) currentInput = (state.globalTask || "") + "\n" + state.ocrText;
      
      try {
          const result = await generateContent(
              agent.provider,
              agent.model,
              agent.systemPrompt || state.globalPrompt,
              currentInput,
              agent.temperature,
              agent.maxTokens
          );

          // Update this agent output AND next agent input via handleAgentOutputUpdate logic
          // But since handleAgentOutputUpdate is for manual edits, we do manual state update here to be safe
          setAgents(prev => {
              const newAgents = [...prev];
              newAgents[index] = { 
                  ...newAgents[index], 
                  status: 'success', 
                  output: result.text,
                  tokenUsage: result.tokens
              };
              
              if (pipelineMode && index < newAgents.length - 1) {
                  newAgents[index + 1] = { ...newAgents[index + 1], input: result.text };
              }
              return newAgents;
          });

          addLog(`Agent ${agent.name} finished.`, 'success');
           // Costs less mana for single run
          setState(p => ({ 
             ...p, 
             mana: Math.max(0, p.mana - 5),
             xp: p.xp + 5,
             stress: Math.min(100, p.stress + 2)
          }));

      } catch (error: any) {
          setAgents(prev => prev.map((a, i) => i === index ? { 
                ...a, 
                status: 'error', 
                output: `Error: ${error.message}`
            } : a));
            addLog(`Agent ${agent.name} failed: ${error.message}`, 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  const runAgents = async () => {
    if (state.mana < 20) {
        alert("Not enough Mana! Wait for recharge.");
        return;
    }

    setIsProcessing(true);
    setActiveTab('agents');
    addLog(`Starting ${pipelineMode ? 'Sequential' : 'Parallel'} Pipeline Execution...`, 'info');

    // Reduce Mana / Increase XP
    setState(p => ({ 
        ...p, 
        mana: Math.max(0, p.mana - 20),
        xp: p.xp + 15,
        stress: Math.min(100, p.stress + 10)
    }));

    // Reset status
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));

    let previousOutput = (state.globalTask || "") + "\n\n[Context from OCR]:\n" + (state.ocrText || "");

    for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        
        // Pipeline logic
        let currentInput = agent.input;
        if (!currentInput) {
            currentInput = pipelineMode ? previousOutput : state.globalTask;
        }

        // Update UI to show running
        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, input: currentInput, status: 'running' } : a));
        
        try {
            // CALL REAL API
            const result = await generateContent(
                agent.provider,
                agent.model,
                agent.systemPrompt || state.globalPrompt,
                currentInput,
                agent.temperature,
                agent.maxTokens
            );

            setAgents(prev => prev.map(a => a.id === agent.id ? { 
                ...a, 
                status: 'success', 
                output: result.text,
                tokenUsage: result.tokens
            } : a));

            addLog(`Agent ${agent.name} finished. Used ${Math.round(result.tokens)} tokens.`, 'success');
            
            // For next agent in pipeline
            previousOutput = result.text;
            
            // Update next agent's input immediately in UI for visibility
            if (pipelineMode && i < agents.length - 1) {
                 setAgents(prev => prev.map((a, idx) => idx === i + 1 ? { ...a, input: result.text } : a));
            }
            
            // Reduce stress on success
            if (state.stress > 0) setState(p => ({ ...p, stress: Math.max(0, p.stress - 5) }));

        } catch (error: any) {
             setAgents(prev => prev.map(a => a.id === agent.id ? { 
                ...a, 
                status: 'error', 
                output: `Error: ${error.message}`
            } : a));
            addLog(`Agent ${agent.name} failed: ${error.message}`, 'error');
            // Break pipeline on error if sequential
            if (pipelineMode) break;
        }
    }

    setIsProcessing(false);
    addLog("Pipeline Execution Completed.", 'info');
    
    // Level Up Check
    if (state.xp > state.level * 100) {
        setState(p => ({ ...p, level: p.level + 1, health: 100, mana: 100 }));
        addLog("Level Up! Health and Mana restored.", 'success');
    }
  };

  const executeMagicTool = async () => {
      if (!state.noteKeeperText) return;
      
      setIsProcessing(true);
      addLog(`Running Magic Tool: ${state.noteKeeperTool}...`, 'info');
      
      try {
          // Determine provider from selected model
          let provider: ModelProvider = 'gemini';
          if (state.noteKeeperModel.startsWith('gpt')) provider = 'openai';
          if (state.noteKeeperModel.startsWith('claude')) provider = 'anthropic';

          const result = await generateContent(
              provider,
              state.noteKeeperModel, 
              "You are a helpful AI tool assistant.",
              `${state.noteKeeperPrompt}\n\nTEXT:\n${state.noteKeeperText}`,
              0.3,
              2000
          );
          
          setState(p => ({ ...p, noteKeeperOutput: result.text }));
          addLog(`Magic Tool ${state.noteKeeperTool} completed.`, 'success');
      } catch (e: any) {
          addLog(`Magic Tool failed: ${e.message}`, 'error');
          setState(p => ({ ...p, noteKeeperOutput: `Error: ${e.message}` }));
      } finally {
          setIsProcessing(false);
      }
  };

  // Render Helpers
  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 lg:px-6 py-3 rounded-t-xl font-medium flex items-center gap-2 transition-all border-t border-l border-r relative -mb-[1px] text-xs lg:text-sm ${
        activeTab === id 
          ? 'opacity-100 z-10' 
          : 'opacity-60 hover:opacity-80 bg-black/5 dark:bg-white/5 border-transparent'
      }`}
      style={{ 
        backgroundColor: activeTab === id ? colors.surface : 'transparent',
        borderColor: activeTab === id ? colors.border : 'transparent',
        color: activeTab === id ? colors.accent : colors.fg
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  // --- LANDING PAGE ---
  if (showLanding) {
      return (
          <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-1000"
               style={{ backgroundColor: colors.bg, color: colors.fg }}
          >
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30" style={{ backgroundColor: colors.accent }} />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20" style={{ backgroundColor: colors.fg }} />

              <div className="relative z-10 w-full max-w-lg p-8 rounded-2xl border glass-panel shadow-2xl animate-in fade-in zoom-in duration-700"
                   style={{ borderColor: colors.border, backgroundColor: state.darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}
              >
                  <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 shadow-lg"
                           style={{ backgroundColor: colors.accent, color: '#fff' }}
                      >
                          <Flower size={48} className="animate-spin-slow" />
                      </div>
                      <h1 className="text-3xl font-bold mb-2">Floral Agentic Studio</h1>
                      <p className="opacity-60 text-sm">Enter your keys to unlock the garden of intelligence.</p>
                  </div>

                  <div className="space-y-4 mb-8">
                      {['gemini', 'openai', 'anthropic'].map(provider => (
                          <div key={provider} className="relative group">
                              <label className="text-xs font-bold opacity-50 uppercase mb-1 block ml-1">{provider} API Key</label>
                              <div className="relative">
                                  <Key size={16} className="absolute left-3 top-3 opacity-30" />
                                  <input 
                                    type="password"
                                    placeholder={`sk-... (${provider})`}
                                    value={state.apiKeys[provider as keyof typeof state.apiKeys]}
                                    onChange={(e) => setState(p => ({...p, apiKeys: {...p.apiKeys, [provider]: e.target.value}}))}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-black/5 dark:bg-white/5 outline-none focus:ring-2 transition-all"
                                    style={{ 
                                        borderColor: colors.border,
                                        // @ts-ignore
                                        "--tw-ring-color": colors.accent 
                                    }}
                                  />
                              </div>
                          </div>
                      ))}
                  </div>

                  <button 
                    onClick={() => setShowLanding(false)}
                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-transform active:scale-95"
                    style={{ backgroundColor: colors.accent }}
                  >
                      <span>Enter Garden</span>
                      <ArrowRight size={18} />
                  </button>
                  
                  <div className="mt-6 text-center">
                      <p className="text-[10px] opacity-40">Keys are stored in-memory only and never sent to our servers.</p>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN APP ---
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar state={state} setState={setState} currentTheme={currentTheme} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-500">
        {/* Header */}
        <header className="px-8 py-6 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-4">
            {!state.isSidebarOpen && (
                <button 
                    onClick={() => setState(p => ({ ...p, isSidebarOpen: true }))}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <PanelLeft size={20} />
                </button>
            )}
            <div>
                <h2 className="text-2xl font-bold">{t('app_title')}</h2>
                <p className="opacity-60 text-sm mt-1">Orchestrate your floral AI workforce</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 text-xs font-medium bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
                 <span className={pipelineMode ? "text-green-600 dark:text-green-400" : "opacity-50"}>Pipeline</span>
                 <button 
                    onClick={() => setPipelineMode(!pipelineMode)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${pipelineMode ? 'bg-green-500' : 'bg-gray-300'}`}
                 >
                     <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${pipelineMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: pipelineMode ? 'calc(100% - 14px)' : '2px' }} />
                 </button>
                 <span className={!pipelineMode ? "text-green-600 dark:text-green-400" : "opacity-50"}>Parallel</span>
             </div>

             <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full text-xs font-bold text-blue-500">
                 <Zap size={12} fill="currentColor" />
                 <span>{state.mana} Mana</span>
             </div>

            <button 
                onClick={runAgents}
                disabled={isProcessing}
                className="px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95 text-white"
                style={{ backgroundColor: colors.accent }}
            >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                {t('run_agents')}
            </button>
          </div>
        </header>

        {/* Global Inputs Area */}
        <div className="px-8 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            <div className="glass-panel p-4 rounded-xl border" style={{ borderColor: colors.border }}>
                <label className="text-xs font-bold opacity-60 uppercase mb-2 block">{t('global_task')}</label>
                <textarea 
                    value={state.globalTask}
                    onChange={e => setState(p => ({...p, globalTask: e.target.value}))}
                    placeholder="Describe what the agents should do..."
                    className="w-full bg-transparent resize-none outline-none h-20 text-sm placeholder:opacity-30"
                />
            </div>
             <div className="glass-panel p-4 rounded-xl border" style={{ borderColor: colors.border }}>
                <label className="text-xs font-bold opacity-60 uppercase mb-2 block">System Prompt</label>
                <textarea 
                    value={state.globalPrompt}
                    onChange={e => setState(p => ({...p, globalPrompt: e.target.value}))}
                    className="w-full bg-transparent resize-none outline-none h-20 text-sm font-mono opacity-80"
                />
            </div>
        </div>

        {/* Tabs Header */}
        <div className="px-8 flex border-b shrink-0 overflow-x-auto" style={{ borderColor: colors.border }}>
            <TabButton id="doc" icon={FileText} label={t('ocr_section')} />
            <TabButton id="tools" icon={Sparkles} label={t('tools_panel')} />
            <TabButton id="agents" icon={Activity} label={t('agents_panel')} />
            <TabButton id="dash" icon={LayoutDashboard} label={t('dashboard')} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
            
            <WowStatus {...state} currentTheme={currentTheme} darkMode={state.darkMode} />

            {/* DOCUMENT / OCR TAB */}
            {activeTab === 'doc' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    
                    {/* Settings & Upload Bar */}
                    <div className="flex flex-col xl:flex-row gap-6 shrink-0">
                        {/* Upload */}
                        <div 
                            className="flex-1 border-2 border-dashed rounded-xl p-8 text-center transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group flex flex-col items-center justify-center relative"
                            style={{ borderColor: colors.border }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileUpload}
                            />
                            {state.pdfPages.length > 0 ? (
                                <>
                                    <div className="p-3 rounded-full bg-green-100 text-green-600 mb-2">
                                        <CheckCircle size={24} />
                                    </div>
                                    <h3 className="font-medium">PDF Loaded ({state.pdfPages.length} pages)</h3>
                                    <p className="text-xs opacity-50 mt-1">Click to replace</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className="mb-2 opacity-30 group-hover:opacity-60 transition-opacity" />
                                    <h3 className="font-medium text-sm">Upload PDF Document</h3>
                                    <p className="text-xs opacity-50 mt-1">Click to browse</p>
                                </>
                            )}
                        </div>

                        {/* OCR Settings */}
                        <div className="flex-[2] p-6 rounded-xl border glass-panel space-y-4" style={{ borderColor: colors.border }}>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold opacity-60 uppercase mb-1 block">OCR Model</label>
                                    <select 
                                        value={state.ocrModel}
                                        onChange={e => setState(p => ({...p, ocrModel: e.target.value}))}
                                        className="w-full text-xs p-2 rounded border outline-none bg-transparent"
                                        style={{ borderColor: colors.border }}
                                    >
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Max Tokens</label>
                                    <input 
                                        type="number" 
                                        value={state.ocrMaxTokens}
                                        onChange={e => setState(p => ({...p, ocrMaxTokens: parseInt(e.target.value)}))}
                                        className="w-full text-xs p-2 rounded border outline-none bg-transparent"
                                        style={{ borderColor: colors.border }}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={executeRealOCR}
                                        disabled={isProcessing || state.pdfPages.length === 0}
                                        className="w-full py-2 rounded-lg font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: colors.accent }}
                                    >
                                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                        Run OCR Analysis
                                    </button>
                                </div>
                             </div>
                             <div>
                                <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Prompt</label>
                                <textarea 
                                    value={state.ocrPrompt}
                                    onChange={e => setState(p => ({...p, ocrPrompt: e.target.value}))}
                                    className="w-full h-16 text-xs p-2 rounded bg-black/5 dark:bg-white/5 resize-none outline-none border border-transparent focus:border-opacity-50"
                                    style={{ borderColor: colors.accent }}
                                />
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-6 flex-1 min-h-0">
                         {/* Page Preview Grid */}
                         <div className="flex-1 p-4 rounded-xl border glass-panel overflow-y-auto" style={{ borderColor: colors.border }}>
                             <label className="text-xs font-bold opacity-60 uppercase mb-4 block sticky top-0 bg-transparent z-10">
                                 Select Pages for OCR ({state.pdfPages.filter(p => p.selected).length} selected)
                             </label>
                             {state.pdfPages.length === 0 ? (
                                 <div className="h-40 flex items-center justify-center opacity-30 text-sm italic">
                                     Upload a PDF to preview pages
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {state.pdfPages.map((page) => (
                                         <div 
                                            key={page.pageNumber}
                                            onClick={() => togglePageSelection(page.pageNumber)}
                                            className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                                                page.selected ? 'ring-2 ring-offset-1' : 'opacity-60 grayscale'
                                            }`}
                                            style={{ 
                                                borderColor: page.selected ? colors.accent : 'transparent',
                                                // @ts-ignore
                                                "--tw-ring-color": colors.accent
                                            }}
                                         >
                                             <img src={page.image} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                                             <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-[10px] font-bold">
                                                 Page {page.pageNumber}
                                             </div>
                                             {page.selected && (
                                                <div className="absolute top-2 left-2 p-1 rounded-full bg-green-500 text-white">
                                                    <CheckCircle size={12} />
                                                </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         {/* OCR Result */}
                         <div className="flex-1 p-4 rounded-xl border glass-panel flex flex-col" style={{ borderColor: colors.border }}>
                            <label className="text-xs font-bold opacity-60 uppercase mb-2 block">OCR Result</label>
                            <textarea 
                                value={state.ocrText}
                                onChange={e => setState(p => ({...p, ocrText: e.target.value}))}
                                placeholder="Extracted text will appear here..."
                                className="flex-1 bg-black/5 dark:bg-black/20 rounded-lg p-4 font-mono text-xs resize-none outline-none overflow-y-auto border-transparent focus:border-opacity-50 border"
                                style={{ borderColor: colors.accent }}
                            />
                         </div>
                    </div>
                </div>
            )}

            {/* AI TOOLS TAB */}
            {activeTab === 'tools' && (
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-80px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="p-4 rounded-xl border glass-panel flex-1 flex flex-col" style={{ borderColor: colors.border }}>
                            <div className="mb-4">
                                <label className="text-xs font-bold opacity-60 uppercase mb-2 block">Raw Text Input</label>
                                <textarea 
                                    value={state.noteKeeperText}
                                    onChange={e => setState(p => ({...p, noteKeeperText: e.target.value}))}
                                    placeholder="Paste notes, meeting transcripts, or raw data..."
                                    className="w-full bg-transparent resize-none outline-none h-full text-sm font-mono placeholder:opacity-30 min-h-[200px]"
                                />
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                                <div>
                                    <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Magic Tool</label>
                                    <select 
                                        value={state.noteKeeperTool}
                                        onChange={e => setState(p => ({...p, noteKeeperTool: e.target.value as MagicTool}))}
                                        className="w-full text-sm p-2 rounded border outline-none bg-transparent"
                                        style={{ borderColor: colors.border }}
                                    >
                                        {MAGIC_TOOLS.map(tool => (
                                            <option key={tool.id} value={tool.id}>{tool.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                     <div>
                                         <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Model</label>
                                         <select 
                                             value={state.noteKeeperModel}
                                             onChange={e => setState(p => ({...p, noteKeeperModel: e.target.value}))}
                                             className="w-full text-xs p-2 rounded border outline-none bg-transparent opacity-80" 
                                             style={{ borderColor: colors.border }}
                                         >
                                             <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                             <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                             <option value="gpt-4o-mini">GPT-4o Mini</option>
                                             <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Max Tokens</label>
                                         <input type="number" defaultValue={8000} className="w-full text-xs p-2 rounded border outline-none bg-transparent opacity-80" style={{ borderColor: colors.border }} />
                                     </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Tool Prompt</label>
                                    <textarea 
                                        value={state.noteKeeperPrompt}
                                        onChange={e => setState(p => ({...p, noteKeeperPrompt: e.target.value}))}
                                        className="w-full h-16 text-xs p-2 rounded bg-black/5 dark:bg-white/5 resize-none outline-none border border-transparent focus:border-opacity-50"
                                        style={{ borderColor: colors.accent }}
                                    />
                                </div>
                                
                                <button 
                                    onClick={executeMagicTool}
                                    disabled={!state.noteKeeperText || isProcessing}
                                    className="w-full py-2 rounded-lg font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: colors.accent }}
                                >
                                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Run Magic Tool
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="p-4 rounded-xl border glass-panel h-full flex flex-col" style={{ borderColor: colors.border }}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold opacity-60 uppercase block">Output</label>
                                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 gap-1">
                                    <button 
                                        onClick={() => setState(p => ({ ...p, noteKeeperViewMode: 'edit' }))}
                                        className={`p-1.5 rounded ${state.noteKeeperViewMode === 'edit' ? 'bg-white shadow text-black' : 'opacity-50'}`}
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setState(p => ({ ...p, noteKeeperViewMode: 'preview' }))}
                                        className={`p-1.5 rounded ${state.noteKeeperViewMode === 'preview' ? 'bg-white shadow text-black' : 'opacity-50'}`}
                                    >
                                        <Eye size={14} />
                                    </button>
                                </div>
                            </div>

                            {state.noteKeeperViewMode === 'edit' ? (
                                <textarea 
                                    value={state.noteKeeperOutput}
                                    onChange={e => setState(p => ({...p, noteKeeperOutput: e.target.value}))}
                                    placeholder="Result will appear here..."
                                    className="flex-1 bg-black/5 dark:bg-black/20 rounded-lg p-4 font-mono text-xs resize-none outline-none overflow-y-auto border-transparent focus:border-opacity-50 border"
                                    style={{ borderColor: colors.accent }}
                                />
                            ) : (
                                <div className="flex-1 bg-black/5 dark:bg-black/20 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap overflow-y-auto">
                                    {state.noteKeeperOutput || <span className="opacity-30 italic">Result will appear here...</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AGENTS TAB */}
            {activeTab === 'agents' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Agents Config Toolbar */}
                    <div className="flex justify-end gap-3 mb-2">
                        <button 
                            onClick={handleExportAgents}
                            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            style={{ borderColor: colors.border }}
                        >
                            <Download size={14} />
                            Export Settings
                        </button>
                        <div 
                            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden"
                            style={{ borderColor: colors.border }}
                        >
                            <Upload size={14} />
                            Import Settings
                            <input 
                                type="file" 
                                ref={agentImportRef}
                                onChange={handleImportAgents}
                                accept=".json"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {agents.map((agent, idx) => (
                        <div key={agent.id} className="p-5 rounded-xl border glass-panel shadow-sm transition-all relative overflow-hidden group"
                            style={{ 
                                borderColor: agent.status === 'running' ? colors.accent : colors.border,
                                borderWidth: agent.status === 'running' ? 2 : 1
                            }}
                        >
                            {/* Connector Line for Pipeline Mode */}
                            {pipelineMode && idx < agents.length - 1 && (
                                <div className="absolute left-8 bottom-[-30px] h-[40px] w-[2px] z-0 opacity-20" style={{ backgroundColor: colors.fg }} />
                            )}

                            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                {/* Left Config Col */}
                                <div className="flex-1 space-y-4">
                                     <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                agent.status === 'success' ? 'bg-green-500' :
                                                agent.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                agent.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                                            }`} />
                                            <input 
                                                value={agent.name} 
                                                onChange={e => handleAgentUpdate(agent.id, 'name', e.target.value)}
                                                className="font-bold bg-transparent outline-none w-full text-lg"
                                            />
                                            {/* Single Run Button */}
                                            <button 
                                                onClick={() => runSingleAgent(idx)}
                                                disabled={isProcessing}
                                                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs"
                                                title="Run this agent only"
                                            >
                                                <Play size={14} fill="currentColor" />
                                            </button>
                                        </div>
                                        <span className="text-[10px] opacity-40 uppercase tracking-widest">Step {idx + 1}</span>
                                     </div>

                                     <div className="grid grid-cols-2 gap-2">
                                         <select 
                                            value={agent.provider}
                                            onChange={e => handleAgentUpdate(agent.id, 'provider', e.target.value)}
                                            className="text-xs p-2 rounded border outline-none bg-transparent opacity-80"
                                            style={{ borderColor: colors.border }}
                                        >
                                            {Object.keys(AVAILABLE_MODELS).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                        </select>
                                        <select 
                                            value={agent.model}
                                            onChange={e => handleAgentUpdate(agent.id, 'model', e.target.value)}
                                            className="text-xs p-2 rounded border outline-none bg-transparent opacity-80"
                                            style={{ borderColor: colors.border }}
                                        >
                                            {(AVAILABLE_MODELS[agent.provider as ModelProvider] || []).map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                     </div>

                                     <div className="grid grid-cols-2 gap-4 text-xs">
                                         <div>
                                            <div className="opacity-60 mb-1">Max Tokens: {agent.maxTokens}</div>
                                            <input 
                                                type="range" min="1000" max="12000" step="1000"
                                                value={agent.maxTokens}
                                                onChange={e => handleAgentUpdate(agent.id, 'maxTokens', parseInt(e.target.value))}
                                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                style={{ accentColor: colors.accent }}
                                            />
                                         </div>
                                         <div>
                                            <div className="opacity-60 mb-1">Temperature: {agent.temperature}</div>
                                            <input 
                                                type="range" min="0" max="1" step="0.1"
                                                value={agent.temperature}
                                                onChange={e => handleAgentUpdate(agent.id, 'temperature', parseFloat(e.target.value))}
                                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                style={{ accentColor: colors.accent }}
                                            />
                                         </div>
                                     </div>

                                     <div>
                                        <div className="text-[10px] uppercase opacity-40 mb-1 font-bold">System Prompt</div>
                                        <textarea 
                                            value={agent.systemPrompt}
                                            onChange={e => handleAgentUpdate(agent.id, 'systemPrompt', e.target.value)}
                                            className="w-full h-16 text-xs p-2 rounded bg-black/5 dark:bg-white/5 resize-none outline-none border border-transparent focus:border-opacity-50"
                                            style={{ borderColor: colors.accent }}
                                        />
                                     </div>
                                </div>

                                {/* Right Output/Input Col */}
                                <div className="flex-1 border-l pl-0 md:pl-6 space-y-4" style={{ borderColor: colors.border }}>
                                    {pipelineMode && (
                                        <div className="relative">
                                            <div className="text-[10px] uppercase opacity-40 mb-1 font-bold flex justify-between">
                                                <span>Input (Editable)</span>
                                                {idx > 0 && <span className="text-[9px] opacity-60 flex items-center gap-1"><ArrowRight size={10}/> From Prev Output</span>}
                                            </div>
                                            <textarea 
                                                value={agent.input}
                                                onChange={e => handleAgentUpdate(agent.id, 'input', e.target.value)}
                                                placeholder={idx === 0 ? "Uses Global Task..." : "Waiting for previous output..."}
                                                className="w-full h-20 text-xs p-2 rounded bg-black/5 dark:bg-white/5 resize-none outline-none border border-transparent focus:border-opacity-50 font-mono"
                                                style={{ borderColor: colors.accent }}
                                            />
                                        </div>
                                    )}

                                    <div className="relative">
                                         <div className="text-[10px] uppercase opacity-40 mb-1 font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span>Output</span>
                                                {/* Output View Toggles */}
                                                <div className="flex bg-black/5 dark:bg-white/5 rounded p-0.5 gap-0.5">
                                                    <button 
                                                        onClick={() => handleAgentUpdate(agent.id, 'outputViewMode', 'edit')}
                                                        className={`p-1 rounded ${agent.outputViewMode === 'edit' ? 'bg-white shadow text-black' : 'opacity-50'}`}
                                                        title="Edit Output"
                                                    >
                                                        <Edit3 size={10} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAgentUpdate(agent.id, 'outputViewMode', 'preview')}
                                                        className={`p-1 rounded ${agent.outputViewMode === 'preview' ? 'bg-white shadow text-black' : 'opacity-50'}`}
                                                        title="Preview Output"
                                                    >
                                                        <Eye size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                            {agent.tokenUsage > 0 && <span>{Math.round(agent.tokenUsage)} tokens</span>}
                                         </div>
                                         
                                         {/* Conditional Output Render */}
                                         {agent.outputViewMode === 'edit' ? (
                                             <textarea 
                                                value={agent.output}
                                                onChange={e => handleAgentOutputUpdate(idx, e.target.value)}
                                                className={`w-full h-32 text-xs p-2 rounded resize-none outline-none border font-mono ${!agent.output ? 'opacity-30' : ''}`}
                                                style={{ borderColor: colors.accent, backgroundColor: state.darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }}
                                                placeholder="Output text will appear here..."
                                             />
                                         ) : (
                                            <div className={`w-full h-32 text-xs p-2 rounded resize-none border overflow-y-auto font-mono whitespace-pre-wrap ${!agent.output ? 'opacity-30 flex items-center justify-center' : ''}`}
                                                style={{ borderColor: colors.border, backgroundColor: state.darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }}
                                            >
                                                {agent.output || "Waiting for execution..."}
                                            </div>
                                         )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dash' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Dashboard agents={agents} currentTheme={currentTheme} darkMode={state.darkMode} logs={state.executionLog} />

                    {/* Execution Log */}
                    <div className="p-6 rounded-xl border glass-panel" style={{ borderColor: colors.border }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold opacity-80">Execution Logs</h3>
                            <button onClick={() => setState(p => ({...p, executionLog: []}))} className="text-[10px] opacity-50 hover:opacity-100">Clear</button>
                        </div>
                        <div className="font-mono text-xs space-y-1 opacity-80 max-h-60 overflow-y-auto pr-2">
                            {state.executionLog.map((log) => (
                                <div key={log.id} className="flex gap-3 py-1 border-b border-dashed border-opacity-10" style={{ borderColor: colors.fg }}>
                                    <span className="opacity-40 w-16 shrink-0">{log.timestamp}</span>
                                    <span className={`w-2 h-2 mt-1 rounded-full shrink-0 ${
                                        log.type === 'error' ? 'bg-red-500' :
                                        log.type === 'success' ? 'bg-green-500' : 'bg-blue-400'
                                    }`} />
                                    <span className={log.type === 'error' ? 'text-red-500' : ''}>{log.message}</span>
                                </div>
                            ))}
                            {state.executionLog.length === 0 && <div className="opacity-30 italic text-center py-4">No logs yet.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Follow Up Questions */}
            <div className="mt-12 mb-8">
                 <div className="flex items-center gap-2 mb-4 opacity-60">
                     <div className="h-px flex-1 bg-current opacity-20" />
                     <h3 className="text-sm uppercase tracking-widest">{t('follow_up')}</h3>
                     <div className="h-px flex-1 bg-current opacity-20" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {FOLLOW_UP_QUESTIONS.map((q, idx) => (
                         <div key={idx} className="p-3 rounded-lg border text-xs opacity-60 hover:opacity-100 transition-all cursor-help hover:scale-[1.01]"
                            style={{ borderColor: colors.border, backgroundColor: state.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                         >
                             {q}
                         </div>
                     ))}
                 </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;
