import { GoogleGenAI, Type, GenerateContentResponse, Operation } from "@google/genai";
import type { JournalEntry, GanttTask, PresentationSlide } from '../types';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });


export const summarizeAndTag = async (content: string): Promise<{ summary: string, tags: string[] }> => {
  if (!content.trim()) return { summary: '', tags: [] };
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `為這段專案日誌內容生成一個簡短的摘要和最多5個相關的標籤。日誌內容如下：\n\n"${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: '專案日誌的簡短摘要。' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: '最多5個與日誌內容相關的標籤。' },
          },
          required: ["summary", "tags"],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error summarizing and tagging:", error);
    throw new Error("無法生成摘要和標籤。");
  }
};

export const describeImage = async (base64: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: { parts: [{ inlineData: { mimeType, data: base64 } }, { text: "請用繁體中文簡要描述這張圖片的內容，作為專案日誌的圖片說明。" }] },
    });
    return response.text;
  } catch (error) {
    console.error("Error describing image:", error);
    throw new Error("無法生成圖片描述。");
  }
};

export const generatePresentationContent = async (entries: JournalEntry[]): Promise<{ title: string, slides: PresentationSlide[] }> => {
    try {
        const ai = getAiClient();
        const simplifiedEntries = entries.map(e => `日期: ${e.date}, 標題: ${e.title}, 摘要: ${e.summary}`).join('\n');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `根據以下專案日誌紀錄，生成一份PowerPoint簡報內容。請包含一個主標題投影片和數張內容投影片。每張內容投影片需要一個標題、3-5個重點條列(bullet points)，以及可選的講者備忘稿。\n\n日誌紀錄：\n${simplifiedEntries}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "簡報的主標題" },
                        slides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "此張投影片的標題" },
                                    points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "重點條列" },
                                    speakerNotes: { type: Type.STRING, description: "給講者的備忘稿 (可選)" },
                                },
                                required: ["title", "points"],
                            },
                        },
                    },
                    required: ["title", "slides"],
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating presentation content:", error);
        throw new Error("無法生成簡報內容。");
    }
};

export const generateGanttChartData = async (entries: JournalEntry[]): Promise<GanttTask[]> => {
    try {
        const ai = getAiClient();
        const simplifiedEntries = entries.map(e => `日期: ${e.date}, 標題: ${e.title}, 內容: ${e.summary || e.content.substring(0,100)}`).join('\n\n');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `根據以下專案日誌，分析出主要的任務，並為每個任務估計開始與結束日期，格式為YYYY-MM-DD。請提供最重要的5到10個任務。\n\n日誌：\n${simplifiedEntries}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "任務的唯一ID" },
                            name: { type: Type.STRING, description: "任務的名稱" },
                            start: { type: Type.STRING, description: "任務開始日期 (YYYY-MM-DD)" },
                            end: { type: Type.STRING, description: "任務結束日期 (YYYY-MM-DD)" },
                        },
                        required: ["id", "name", "start", "end"],
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating Gantt chart data:", error);
        throw new Error("無法生成甘特圖資料。");
    }
};


export const generateVideoSummary = async (
    projectTitle: string,
    entries: JournalEntry[], 
    onProgress: (message: string) => void
): Promise<string> => {
    
    let ai: GoogleGenAI;
    
    // Veo requires API key selection
    onProgress("正在檢查 API 金鑰...");
    if (!(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
    }
    // Fix: Re-initialize the client after key selection to ensure the new key is used, preventing API errors.
    ai = getAiClient();


    onProgress("正在生成影片腳本...");
    const simplifiedEntries = entries.map(e => `在 ${e.date}, 我們完成了 "${e.title}", 主要內容是 ${e.summary}.`).join(' ');
    const scriptResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `為一個名為 "${projectTitle}" 的專案撰寫一段不超過150字的影片旁白腳本。腳本需要總結以下專案日誌的進展。請讓語氣聽起來專業且鼓舞人心。\n\n日誌內容：\n${simplifiedEntries}`,
    });
    const script = scriptResponse.text;

    onProgress("腳本已生成，正在啟動影片渲染...");
    
    let operation: Operation;
    try {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: script,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });
    } catch (e: any) {
         if (e.message?.includes("Requested entity was not found.")) {
             throw new Error("API 金鑰似乎無效，請重新選擇。");
         }
         throw e;
    }

    onProgress("影片正在處理中，這可能需要幾分鐘...");
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      try {
        operation = await ai.operations.getVideosOperation({operation: operation});
      } catch (e: any) {
        console.error("Error polling video operation:", e);
        // Don't throw here, just log and continue polling
      }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("影片生成失敗，未收到下載連結。");
    }
    
    onProgress("正在獲取影片數據...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    
    return URL.createObjectURL(videoBlob);
};
