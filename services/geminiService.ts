import { GoogleGenAI, Type } from "@google/genai";
import type { JournalEntry, GanttTask, PresentationSlide } from '../types';

// ===================================================================================
//  ★★★ 唯一需要您手動修改的地方 ★★★
//
//  請在下面的引號中，貼上您從 Google AI Studio 建立的「新的」、「安全的」API 金鑰
//  範例: const API_KEY = "AIzaSyABC...您的新金鑰...XYZ";
//
// ===================================================================================
const API_KEY = "AIzaSyC9jbimaZnvvkcvn5pjz3yYw0DvaGdsV3g";

const getAiClient = () => {
    if (API_KEY === "請在這裡貼上您新的、安全的API金鑰") {
        throw new Error("API 金鑰尚未設定。請修改 services/geminiService.ts 檔案並填入您的金鑰。");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};


/**
 * A centralized error handler to provide user-friendly messages for common API issues.
 * @param error The original error object.
 * @param functionName The name of the function where the error occurred, for logging.
 * @throws An `Error` with a user-friendly message.
 */
const handleApiError = (error: any, functionName: string): never => {
    console.error(`Error in ${functionName}:`, error);
    let userMessage = "發生未知的 AI 服務錯誤。";

    const errorMessage = String(error?.message || '').toLowerCase();

    if (errorMessage.includes('api key not valid') || errorMessage.includes('invalid api key')) {
        userMessage = "API 金鑰無效。請前往 Google AI Studio 產生一組新的金鑰，並更新至程式碼中。";
    } else if (errorMessage.includes('billing') || errorMessage.includes('quota')) {
        userMessage = "專案計費問題或已達配額上限。請確認您的 Google Cloud 專案已啟用計費功能，這對於使用進階模型是必要的。";
    } else if (errorMessage.includes('permission denied') || errorMessage.includes('access forbidden')) {
        userMessage = "權限不足。您的 API 金鑰可能沒有權限使用此 AI 模型。";
    } else if (errorMessage.includes('requested entity was not found')) {
        userMessage = "找不到請求的資源。這通常代表您的 API 金鑰或其關聯的專案設定有誤。";
    } else if (errorMessage.includes('fetch failed') || errorMessage.includes('network error')) {
        userMessage = "網路連線錯誤，無法連接至 Google AI 服務。請檢查您的網路連線。";
    } else {
        userMessage = `AI 服務回報錯誤：${error.message || '未知錯誤'}`;
    }
    
    throw new Error(userMessage);
};


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
    handleApiError(error, 'summarizeAndTag');
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
    handleApiError(error, 'describeImage');
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
        handleApiError(error, 'generatePresentationContent');
    }
};

export const generateGanttChartData = async (entries: JournalEntry[]): Promise<GanttTask[]> => {
    try {
        const ai = getAiClient();
        const simplifiedEntries = entries.map(e => `日期: ${e.date}, 標題: ${e.title}, 內容: ${e.content}`).join('\n\n');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `根據以下專案日誌，分析出主要的任務，並為每個任務提供「任務名稱」、「預計完成日期」(格式為YYYY-MM-DD) 和「進度狀態」(例如：已如期完成、進行中、尚未開始)。請提供最重要的5到10個任務。\n\n日誌：\n${simplifiedEntries}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "任務的唯一ID" },
                            name: { type: Type.STRING, description: "任務的名稱" },
                            deadline: { type: Type.STRING, description: "任務的預計完成日期 (YYYY-MM-DD)" },
                            status: { type: Type.STRING, description: "任務的進度狀態，例如: 已如期完成, 進行中, 尚未開始" },
                        },
                        required: ["id", "name", "deadline", "status"],
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        handleApiError(error, 'generateGanttChartData');
    }
};


export const generateVideoSummary = async (
    projectTitle: string,
    entries: JournalEntry[], 
    onProgress: (message: string) => void
): Promise<string> => {
    
    try {
        const ai = getAiClient();

        onProgress("正在生成影片腳本...");
        const simplifiedEntries = entries.map(e => `在 ${e.date}, 我們完成了 "${e.title}", 主要內容是 ${e.summary}.`).join(' ');
        const scriptResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `為一個名為 "${projectTitle}" 的專案撰寫一段不超過150字的影片旁白腳本。腳本需要總結以下專案日誌的進展。請讓語氣聽起來專業且鼓舞人心。\n\n日誌內容：\n${simplifiedEntries}`,
        });
        const script = scriptResponse.text;

        onProgress("腳本已生成，正在啟動影片渲染...");
        
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: script,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        onProgress("影片正在處理中，這可能需要幾分鐘...");
        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          try {
            operation = await ai.operations.getVideosOperation({operation: operation});
          } catch (pollingError) {
            console.warn("Polling video operation failed, but will continue:", pollingError);
          }
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("影片生成失敗，未收到下載連結。");
        }
        
        onProgress("正在獲取影片數據...");
        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`下載影片失敗，伺服器狀態碼: ${response.status}`);
        }
        const videoBlob = await response.blob();
        
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        handleApiError(error, 'generateVideoSummary');
    }
};