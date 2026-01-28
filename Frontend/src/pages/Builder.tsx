// /* eslint-disable prefer-const */
// import React, { useEffect, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// import { StepsList } from '../components/StepsList';
// import { FileExplorer } from '../components/FileExplorer';
// import { TabView } from '../components/TabView';
// import { CodeEditor } from '../components/CodeEditor';
// import { PreviewFrame } from '../components/PreviewFrame';
// import { Step, FileItem, StepType } from '../types';
// import axios from 'axios';
// import { BACKEND_URL } from '../config';
// import { parseXml } from '../steps';
// import { useWebContainer } from '../hooks/useWebContainer';
// // import { FileNode } from '@webcontainer/api';
// import { Loader } from '../components/Loader';

// const MOCK_FILE_CONTENT = `// This is a sample file content
// import React from 'react';

// function Component() {
//   return <div>Hello World</div>;
// }

// export default Component;`;

// export function Builder() {
//   const location = useLocation();
//   const { prompt } = location.state as { prompt: string };
//   const [userPrompt, setPrompt] = useState("");
//   const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [templateSet, setTemplateSet] = useState(false);
//   const webcontainer = useWebContainer();

//   const [currentStep, setCurrentStep] = useState(1);
//   const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
//   const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
//   const [steps, setSteps] = useState<Step[]>([]);

//   const [files, setFiles] = useState<FileItem[]>([]);

//   useEffect(() => {
//     let originalFiles = [...files];
//     let updateHappened = false;
//     steps.filter(({status}) => status === "pending").map(step => {
//       updateHappened = true;
//       if (step?.type === StepType.CreateFile) {
//         let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
//         let currentFileStructure = [...originalFiles]; // {}
//         let finalAnswerRef = currentFileStructure;
  
//         let currentFolder = ""
//         while(parsedPath.length) {
//           currentFolder =  `${currentFolder}/${parsedPath[0]}`;
//           let currentFolderName = parsedPath[0];
//           parsedPath = parsedPath.slice(1);
  
//           if (!parsedPath.length) {
//             // final file
//             let file = currentFileStructure.find(x => x.path === currentFolder)
//             if (!file) {
//               currentFileStructure.push({
//                 name: currentFolderName,
//                 type: 'file',
//                 path: currentFolder,
//                 content: step.code
//               })
//             } else {
//               file.content = step.code;
//             }
//           } else {
//             /// in a folder
//             let folder = currentFileStructure.find(x => x.path === currentFolder)
//             if (!folder) {
//               // create the folder
//               currentFileStructure.push({
//                 name: currentFolderName,
//                 type: 'folder',
//                 path: currentFolder,
//                 children: []
//               })
//             }
  
//             currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
//           }
//         }
//         originalFiles = finalAnswerRef;
//       }

//     })

//     if (updateHappened) {

//       setFiles(originalFiles)
//       setSteps(steps => steps.map((s: Step) => {
//         return {
//           ...s,
//           status: "completed"
//         }
        
//       }))
//     }
//     console.log(files);
//   }, [steps, files]);

//   useEffect(() => {
//     const createMountStructure = (files: FileItem[]): Record<string, any> => {
//       const mountStructure: Record<string, any> = {};
  
//       const processFile = (file: FileItem, isRootFolder: boolean) => {  
//         if (file.type === 'folder') {
//           // For folders, create a directory entry
//           mountStructure[file.name] = {
//             directory: file.children ? 
//               Object.fromEntries(
//                 file.children.map(child => [child.name, processFile(child, false)])
//               ) 
//               : {}
//           };
//         } else if (file.type === 'file') {
//           if (isRootFolder) {
//             mountStructure[file.name] = {
//               file: {
//                 contents: file.content || ''
//               }
//             };
//           } else {
//             // For files, create a file entry with contents
//             return {
//               file: {
//                 contents: file.content || ''
//               }
//             };
//           }
//         }
  
//         return mountStructure[file.name];
//       };
  
//       // Process each top-level file/folder
//       files.forEach(file => processFile(file, true));
  
//       return mountStructure;
//     };
  
//     const mountStructure = createMountStructure(files);
  
//     // Mount the structure if WebContainer is available
//     console.log(mountStructure);
//     webcontainer?.mount(mountStructure);
//   }, [files, webcontainer]);

//   async function init() {
//     const response = await axios.post(`${BACKEND_URL}/template`, {
//       prompt: prompt.trim()
//     });
//     setTemplateSet(true);
    
//     const {prompts, uiPrompts} = response.data;

//     setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
//       ...x,
//       status: "pending"
//     })));

//     setLoading(true);
//     const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
//       messages: [...prompts, prompt].map(content => ({
//         role: "user",
//         content
//       }))
//     })

//     setLoading(false);

//     setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
//       ...x,
//       status: "pending" as "pending"
//     }))]);

//     setLlmMessages([...prompts, prompt].map(content => ({
//       role: "user",
//       content
//     })));

//     setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
//   }

//   useEffect(() => {
//     init();
//   }, [])

//   return (
//     <div className="min-h-screen bg-gray-900 flex flex-col">
//       <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
//         <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
//         <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
//       </header>
      
//       <div className="flex-1 overflow-hidden">
//         <div className="h-full grid grid-cols-4 gap-6 p-6">
//           <div className="col-span-1 space-y-6 overflow-auto">
//             <div>
//               <div className="max-h-[75vh] overflow-scroll">
//                 <StepsList
//                   steps={steps}
//                   currentStep={currentStep}
//                   onStepClick={setCurrentStep}
//                 />
//               </div>
//               <div>
//                 <div className='flex'>
//                   <br />
//                   {(loading || !templateSet) && <Loader />}
//                   {!(loading || !templateSet) && <div className='flex'>
//                     <textarea value={userPrompt} onChange={(e) => {
//                     setPrompt(e.target.value)
//                   }} className='p-2 w-full'></textarea>
//                   <button onClick={async () => {
//                     const newMessage = {
//                       role: "user" as "user",
//                       content: userPrompt
//                     };

//                     setLoading(true);
//                     const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
//                       messages: [...llmMessages, newMessage]
//                     });
//                     setLoading(false);

//                     setLlmMessages(x => [...x, newMessage]);
//                     setLlmMessages(x => [...x, {
//                       role: "assistant",
//                       content: stepsResponse.data.response
//                     }]);
                    
//                     setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
//                       ...x,
//                       status: "pending" as "pending"
//                     }))]);

//                   }} className='bg-purple-400 px-4'>Send</button>
//                   </div>}
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="col-span-1">
//               <FileExplorer 
//                 files={files} 
//                 onFileSelect={setSelectedFile}
//               />
//             </div>
//           <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
//             <TabView activeTab={activeTab} onTabChange={setActiveTab} />
//             <div className="h-[calc(100%-4rem)]">
//               {activeTab === 'code' ? (
//                 <CodeEditor file={selectedFile} />
//               ) : (
//                 <PreviewFrame webContainer={webcontainer} files={files} />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



/* eslint-disable prefer-const */
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import { StepsList } from '../components/StepsList';
import { FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Loader } from '../components/Loader';

import { Step, FileItem, StepType } from '../types';
import { BACKEND_URL } from '../config';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';

type WebContainerNode =
  | { directory: Record<string, WebContainerNode> }
  | { file: { contents: string } };

export function Builder() {
  const location = useLocation();
  const state = location.state as { prompt?: string } | null;
  const prompt = state?.prompt ?? '';

  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [steps, setSteps] = useState<Step[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const webcontainer = useWebContainer();
  const mountedRef = useRef(false);

  /* ----------------------------------------
     STEP → FILE SYSTEM PROCESSOR
  -----------------------------------------*/
  useEffect(() => {
    if (!steps.some(s => s.status === 'pending')) return;

    setFiles(prevFiles => {
      const newFiles = structuredClone(prevFiles);

      steps
        .filter(s => s.status === 'pending')
        .forEach(step => {
          if (step.type !== StepType.CreateFile || !step.path) return;

          const parts = step.path.split('/');
          let cursor = newFiles;
          let currentPath = '';

          parts.forEach((part, idx) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const isLast = idx === parts.length - 1;

            let node = cursor.find(f => f.path === currentPath);

            if (!node) {
              node = {
                name: part,
                path: currentPath,
                type: isLast ? 'file' : 'folder',
                ...(isLast ? { content: step.code ?? '' } : { children: [] })
              };
              cursor.push(node);
            }

            if (!isLast && node.type === 'folder') {
              cursor = node.children!;
            }

            if (isLast && node.type === 'file') {
              node.content = step.code ?? '';
            }
          });
        });

      return newFiles;
    });

    setSteps(prev =>
      prev.map(step =>
        step.status === 'pending'
          ? { ...step, status: 'completed' as const }
          : step
      )
    );
  }, [steps]);

  /* ----------------------------------------
     WEB CONTAINER MOUNT (ONCE)
  -----------------------------------------*/
  useEffect(() => {
    if (!webcontainer || mountedRef.current || files.length === 0) return;

    const buildMountTree = (items: FileItem[]): Record<string, WebContainerNode> => {
      const tree: Record<string, WebContainerNode> = {};

      items.forEach(item => {
        if (item.type === 'folder') {
          tree[item.name] = {
            directory: buildMountTree(item.children ?? [])
          };
        } else {
          tree[item.name] = {
            file: {
              contents: item.content ?? ''
            }
          };
        }
      });

      return tree;
    };

    webcontainer.mount(buildMountTree(files));
    mountedRef.current = true;
  }, [webcontainer, files]);

  /* ----------------------------------------
     INIT
  -----------------------------------------*/
  useEffect(() => {
    if (!prompt) return;

    const init = async () => {
      try {
        setLoading(true);

        const templateRes = await axios.post(`${BACKEND_URL}/template`, {
          prompt: prompt.trim()
        });

        setTemplateSet(true);

        const { prompts, uiPrompts } = templateRes.data;

        setSteps(
          parseXml(uiPrompts[0]).map(x => ({
            ...x,
            status: 'pending' as const
          }))
        );

        const chatRes = await axios.post(`${BACKEND_URL}/chat`, {
          messages: [...prompts, prompt].map(content => ({
            role: 'user' as const,
            content
          }))
        });

        setSteps(prev => [
          ...prev,
          ...parseXml(chatRes.data.response).map(x => ({
            ...x,
            status: 'pending' as const
          }))
        ]);

        setLlmMessages([
          ...prompts.map((c: string) => ({ role: 'user' as const, content: c })),
          { role: 'assistant' as const, content: chatRes.data.response }
        ]);
      } catch (err) {
        console.error('Init failed:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /* ----------------------------------------
     RENDER
  -----------------------------------------*/
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-100">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-4 gap-6 p-6">
          {/* Steps */}
          <div className="col-span-1 space-y-4 overflow-auto">
            <StepsList
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />

            {(loading || !templateSet) && <Loader />}

            {!loading && templateSet && (
              <div className="flex gap-2">
                <textarea
                  value={userPrompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="p-2 w-full bg-gray-800 text-white"
                />
                <button
                  className="bg-purple-500 px-4"
                  onClick={async () => {
                    const msg = { role: 'user' as const, content: userPrompt };
                    setLoading(true);

                    try {
                      const res = await axios.post(`${BACKEND_URL}/chat`, {
                        messages: [...llmMessages, msg]
                      });

                      setLlmMessages(prev => [
                        ...prev,
                        msg,
                        { role: 'assistant' as const, content: res.data.response }
                      ]);

                      setSteps(prev => [
                        ...prev,
                        ...parseXml(res.data.response).map(x => ({
                          ...x,
                          status: 'pending' as const
                        }))
                      ]);
                    } catch (err) {
                      console.error('Chat failed:', err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>

          {/* File Explorer */}
          <div className="col-span-1">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>

          {/* Editor / Preview */}
          <div className="col-span-2 bg-gray-900 rounded-lg shadow-lg p-4 h-[calc(100vh-8rem)]">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="h-[calc(100%-4rem)]">
              {activeTab === 'code' ? (
                <CodeEditor file={selectedFile} />
              ) : (
                // ✅ Only render if webcontainer exists
                webcontainer && (
                  <PreviewFrame webContainer={webcontainer} files={files} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
