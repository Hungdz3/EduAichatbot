import OpenAI from 'openai'
// import { createServerComponentClientResilient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

// Kiểm tra cấu hình OpenRouter
const apiKey = process.env.OPENROUTER_API_KEY
const baseURL = process.env.OPENROUTER_BASE_URL

if (!apiKey) console.error('CRITICAL: OPENROUTER_API_KEY is missing!')
if (!baseURL) console.error('CRITICAL: OPENROUTER_BASE_URL is missing!')

// OpenRouter dùng cùng interface với OpenAI — chỉ đổi baseURL
const openrouter = new OpenAI({
  baseURL: baseURL || 'https://openrouter.ai/api/v1',
  apiKey: apiKey || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'EduAI',
  },
})

// Lấy model đang active từ DB (Admin có thể đổi qua trang /admin/ai-config)
async function getActiveModel(supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_config')
      .select('model_id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.warn('Error fetching active model from DB, using fallback:', error.message)
      return process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini'
    }
    
    return data?.model_id || process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini'
  } catch (err) {
    console.error('Exception in getActiveModel:', err)
    return process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini'
  }
}

// Danh sách các model dự phòng miễn phí "kinh điển" thường ít bị gỡ (Cập nhật 2026)
const FALLBACK_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free'
]

export async function callAI(
  supabase: any,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  systemPrompt?: string,
  temperature?: number
): Promise<{ content: string; model: string }> {

  const activeModel = await getActiveModel(supabase)
  
  // Tạo danh sách các model để thử, bắt đầu từ model active
  const modelsToTry = [activeModel, ...FALLBACK_MODELS.filter(m => m !== activeModel)]

  const fullMessages = [
    {
      role: 'system' as const,
      content: systemPrompt ?? `Bạn là trợ lý AI chuyên hỗ trợ giáo viên tiểu học Việt Nam.
Trả lời bằng tiếng Việt, ngắn gọn, thực tế và phù hợp với chương trình GDPT 2018.`,
    },
    ...messages,
  ]

  let lastError: any = null

  for (const model of modelsToTry) {
    try {
      console.log(`>>> [AI_CALL] Đang thử model: ${model}`)
      const response = await openrouter.chat.completions.create({
        model,
        messages: fullMessages as any,
        max_tokens: 1500,
        temperature: temperature !== undefined ? temperature : 0.7,
      })

      console.log(`<<< [AI_SUCCESS] Model ${model} phản hồi thành công!`)
      return {
        content: response.choices[0].message.content ?? '',
        model,
      }
    } catch (err: any) {
      lastError = err
      // Log chi tiết lỗi để debug
      console.warn(`!!! [AI_FAILED] Model ${model} thất bại. Lỗi: ${err.message || err}`)
      if (err.status) console.warn(`HTTP Status: ${err.status}`)
      if (err.response?.data) console.warn('Response data:', JSON.stringify(err.response.data))
      
      // Nếu lỗi là 401 (Unauthenticated) thì dừng luôn vì lỗi key
      if (err.status === 401) {
        throw new Error('API Key của OpenRouter không hợp lệ hoặc đã hết hạn.')
      }
      continue
    }
  }

  // Nếu tất cả các model đều thất bại
  console.error('CRITICAL: Tất cả các fallback model đều thất bại.')
  throw new Error(`AI Request Failed: ${lastError?.message || 'Tất cả các model đều không phản hồi'}`)
}
