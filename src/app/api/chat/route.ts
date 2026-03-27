import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { callAI } from '@/lib/ai/openrouter'
import { pipeline } from '@xenova/transformers'

class EmbeddingPipeline {
  static task: any = 'feature-extraction';
  static model: string = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { quantized: true });
    }
    return await this.instance;
  }
}

export async function POST(req: Request) {
  try {
    const { message, sessionId, grade, subject } = await req.json()
    const supabase = createRouteClient()
    
    // Xác thực người dùng
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // [MỚI] Lấy thông tin hồ sơ người dùng để cá nhân hóa
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, grade_level, school_name')
      .eq('id', session.user.id)
      .single()

    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession, error: createError } = await supabase.from('chat_sessions').insert({
        user_id: session.user.id,
        title: message.substring(0, 50)
      }).select().single()
      currentSessionId = newSession?.id
      if (!currentSessionId) return NextResponse.json({ error: 'Failed to create session: ' + createError?.message }, { status: 500 })
    }

    let uniqueMatches: any[] = [];
    let ragContext = '';

    // [MỚI] Tự động học và mở rộng từ viết tắt từ DB
    const { data: abbs } = await supabase.from('abbreviations').select('short_form, full_form')
    let expandedInput = message
    if (abbs) {
      abbs.forEach(a => {
        // Sử dụng regex để thay thế chính xác từ (không thay thế một phần của từ khác)
        const regex = new RegExp(`\\b${a.short_form}\\b`, 'gi')
        expandedInput = expandedInput.replace(regex, a.full_form)
      })
    }

    // [BỔ SUNG] Danh sách các từ hỏi không được phép học làm nghĩa đầy đủ
    const questioningWords = ['gì', 'nào', 'sao', 'đâu', 'chi', 'thế nào', 'gì vậy', 'gì thế']

    // [MỚI] Hỗ trợ hỏi đáp về từ viết tắt: "Từ gv là gì?", "gv có nghĩa là gì?", "gv bạn hiểu là gì?"
    // Đặt lên trước Learning để tránh nhầm lẫn
    const queryRegex = /(?:từ\s+)?([^\s\.,!?]+)\s+(?:bạn\s+)?(?:hiểu\s+|nghĩa\s+)?(?:là\s+gì|là\s+chi|thế\s+nào|như\s+thế\s+nào|ntn|là\s+gì\s+vậy|là\s+gì\s+thế)/i
    const queryMatch = message.toLowerCase().match(queryRegex)
    if (queryMatch) {
      const target = queryMatch[1].trim().toLowerCase()
      const foundAbb = abbs?.find(a => a.short_form === target)
      if (foundAbb) {
        const queryReply = `Từ "${target}" tôi hiểu là "${foundAbb.full_form}".`
        return NextResponse.json({ reply: queryReply, source: 'system', sessionId: currentSessionId })
      }
      // Nếu không phải là từ viết tắt đã học, hệ thống tiếp tục tìm kiếm bằng Vector Search bên dưới.
    }

    // [MỚI] Cải thiện logic "Học từ mới" thông minh hơn
    const learningRegex = /(?:thêm\s+từ\s+)?([^\s\.,!?]+)\s+(?:là|thì sẽ là|thì là|nghĩa là|=)\s+([^\s\.,!?]+)/i
    const learningMatch = message.match(learningRegex)
    
    if (learningMatch) {
      let word1 = learningMatch[1].trim().toLowerCase()
      let word2 = learningMatch[2].trim().toLowerCase()
      
      // Nếu là câu hỏi (chứa từ hỏi) thì bỏ qua không học
      const isQuestion = questioningWords.some(q => word2.includes(q) || message.toLowerCase().includes('là gì'))
      
      if (!isQuestion) {
        // Thông minh: Tự xác định đâu là từ viết tắt (thường ngắn hơn)
        let short = word1.length <= word2.length ? word1 : word2
        let full = word1.length <= word2.length ? word2 : word1

        if (word1.length === word2.length) {
          short = word1; full = word2;
        }

        if (short.length > 0 && short.length < 10 && full.length > 0) {
          await supabase.from('abbreviations').upsert({ 
            short_form: short, 
            full_form: full 
          }, { onConflict: 'short_form' })
          
          const learnReply = `Vâng! Tôi đã học thêm từ mới: "${short}" sẽ được hiểu là "${full}". Cám ơn bạn đã giúp tôi thông minh hơn!`
          
          await supabase.from('messages').insert([
            { session_id: currentSessionId, role: 'user', content: message, source: 'system' },
            { session_id: currentSessionId, role: 'assistant', content: learnReply, source: 'ai' }
          ])

          return NextResponse.json({ reply: learnReply, source: 'system', sessionId: currentSessionId })
        }
      }
    }

    // [MỚI] Kiểm tra tin nhắn chào hỏi dựa trên đầu vào đã mở rộng
    const lowerExpanded = expandedInput.trim().toLowerCase()
    const greetingKeywords = ['xin chào', 'chào', 'hi', 'helo', 'hilu', 'hello']
    if (greetingKeywords.some(k => lowerExpanded === k || lowerExpanded.startsWith(k + ' '))) {
      const name = profile?.full_name || 'bạn'
      const gradeInfo = grade || profile?.grade_level || 'tiểu học'
      const subjectInfo = subject || 'các môn học'
      
      const greeting = `Xin chào ${name}, tôi có thể giúp gì được cho bạn? Tôi là chatbot được sinh ra để giúp đỡ bạn về môn ${subjectInfo} và lớp ${gradeInfo} mà bạn yêu cầu.`
      
      // Lưu tin nhắn
      await supabase.from('messages').insert([
        { session_id: currentSessionId, role: 'user', content: message, source: 'system' },
        { session_id: currentSessionId, role: 'assistant', content: greeting, source: 'ai' }
      ])

      return NextResponse.json({
        reply: greeting,
        source: 'ai',
        sessionId: currentSessionId
      })
    }

    // [Bước 1] Lưu tin nhắn của người dùng ngay lập tức
    await supabase.from('messages').insert({
      session_id: currentSessionId,
      role: 'user',
      content: message,
      original_input: message,
      source: 'system'
    })

    // [Bước 2] Tìm kiếm Kiến thức (RAG)
    try {
      // 2.1 Tìm kiếm theo từ khóa (Keyword Search) - Ưu tiên độ chính xác tuyệt đối
      const { data: keywordMatches } = await supabase.rpc('search_knowledge_base', {
        query_text: message.trim(),
        match_count: 2,
        filter_grade: grade === 'Chung' ? null : (grade || null),
        filter_subject: subject === 'Chung' || subject === 'Phần chung' ? null : (subject || null)
      });

      // 2.2 Tìm kiếm theo Vector (Semantic Search) - Tìm theo ý nghĩa
      console.log('Generating embedding for query:', message.trim());
      const extractor = await EmbeddingPipeline.getInstance();
      const output = await extractor(message.trim(), { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(output.data);

      const { data: vectorMatches } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.60, // Giảm ngưỡng một chút để bao quát hơn
        match_count: 2,
        filter_grade: grade === 'Chung' ? null : (grade || null),
        filter_subject: subject === 'Chung' || subject === 'Phần chung' ? null : (subject || null)
      });

      // Kết hợp kết quả, ưu tiên Keyword Search lên trước
      const allMatches = [...(keywordMatches || []), ...(vectorMatches || [])];
      
      // Loại bỏ trùng lặp
      uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

      if (uniqueMatches.length > 0) {
        ragContext = uniqueMatches.map((doc: any, i: number) => 
          `[TÀI LIỆU THÀNH PHẦN ${i + 1}]:\nHỏi: ${doc.question}\nĐáp: ${doc.answer}\n(Môn: ${doc.subject || 'Chung'}, Lớp: ${doc.grade || 'Chung'})\n---\n`
        ).join('');
      } else {
        // 2.3.1 Thử tìm toàn cục bằng Keyword Search trước
        const { data: globalKeywordMatches } = await supabase.rpc('search_knowledge_base', {
          query_text: message.trim(),
          match_count: 1,
          filter_grade: null,
          filter_subject: null
        });

        // 2.3.2 Thử tìm toàn cục bằng Vector Search nếu Keyword không ra
        let globalMatches = globalKeywordMatches || [];
        if (globalMatches.length === 0) {
          const { data: globalVectorMatches } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.50, // Ngưỡng rộng hơn cho tìm kiếm toàn cục
            match_count: 1,
            filter_grade: null,
            filter_subject: null
          });
          globalMatches = globalVectorMatches || [];
        }

        if (globalMatches && globalMatches.length > 0) {
          const doc = globalMatches[0];
          const displayGrade = doc.grade ? (doc.grade.includes('Lớp') ? doc.grade : `lớp ${doc.grade}`) : 'Chung';
          const displaySubject = doc.subject || 'Chung';
          
          return NextResponse.json({ 
            reply: `Phần này được mình tìm thấy ở môn **${displaySubject}** ${displayGrade.toLowerCase()}. Bạn có thể chỉnh về đúng lớp và môn này giúp mình, mình sẽ giải đáp câu hỏi giúp bạn ngay nhé! ✨`, 
            source: 'system', 
            sessionId: currentSessionId 
          });
        }

        // Nếu vẫn không tìm thấy bất kỳ dữ liệu liên quan nào trong toàn bộ DB
        return NextResponse.json({ 
          reply: "Hiện tại mình chưa có dữ liệu về phần này, bạn có thể giúp mình gửi nội dung này cho đội phát triển (dev) được không? Cám ơn bạn rất nhiều! 🙏", 
          source: 'system', 
          sessionId: currentSessionId 
        })
      }
    } catch (searchErr) {
      console.error('RAG Search Error:', searchErr);
    }

    // [MỚI] Hỗ trợ xem danh sách từ đã học
    if (lowerExpanded === 'danh sách từ' || lowerExpanded === 'các từ đã học') {
      const list = abbs?.map(a => `${a.short_form}: ${a.full_form}`).join('\n') || 'Chưa có từ nào.'
      const reply = `Đây là các từ viết tắt tôi đã học được:\n${list}`
      return NextResponse.json({ reply, source: 'system', sessionId: currentSessionId })
    }
    // --- [TẬM THỜI] CHẾ ĐỘ PHẢN HỒI TRỰC TIẾP TỪ DATABASE ---
    // Nếu tìm thấy khớp 100% trong DB cho môn/lớp này, trả về luôn để tránh lỗi AI (429/404)
    if (uniqueMatches.length > 0) {
      const bestMatch = uniqueMatches[0];
      
      // Lưu tin nhắn vào DB
      await supabase.from('messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: bestMatch.answer,
        source: 'database'
      });

      return NextResponse.json({
        reply: bestMatch.answer,
        source: 'database',
        sessionId: currentSessionId
      });
    }

    // --- 3.1 Nhận diện ý định (Intent Detection) ---
    const detectIntent = (msg: string) => {
      if (/soạn|giáo án|kế hoạch bài dạy/i.test(msg)) return 'soan_bai';
      if (/đề kiểm tra|câu hỏi|bài tập/i.test(msg))   return 'de_kiem_tra';
      if (/là gì|giải thích|khái niệm/i.test(msg))     return 'tra_cuu';
      if (/giải|tính|tìm x|nghĩa của/i.test(msg))      return 'giai_dap';
      return 'default';
    }
    const intent = detectIntent(message);
    const TEMPERATURE_MAP: Record<string, number> = {
      tra_cuu: 0.1, soan_bai: 0.6, de_kiem_tra: 0.4, giai_dap: 0.2, default: 0.3
    };
    const temperature = TEMPERATURE_MAP[intent] || 0.3;

    // --- 3.2 System Prompt (EduAI) ---
    const systemPrompt = `Bạn là EduAI — một người bạn đồng hành, trợ lý AI siêu thân thiện và am hiểu, chuyên hỗ trợ giáo viên tiểu học Việt Nam.
## VAI TRÒ & TÂM THẾ
- Bạn không chỉ là một công cụ, bạn là một **người đồng nghiệp ấm áp**, luôn sẵn sàng lắng nghe và chia sẻ khó khăn với giáo viên.
- Bạn am hiểu sâu sắc chương trình GDPT 2018 và tâm lý học sinh lớp 1-5.
- Giáo viên này đang cần hỗ trợ về môn **${subject || 'Chung'}** lớp **${grade || 'Chung'}**.

## VĂN PHONG GIAO TIẾP
- Sử dụng ngôn ngữ **thân thiện, gần gũi**: Dùng "mình/bạn", "tôi/thầy/cô", "anh/chị" linh hoạt và chân thành.
- Câu trả lời cần có **năng lượng tích cực**, khích lệ tinh thần giáo viên.
- Trình bày rõ ràng bằng Markdown, sử dụng icon phù hợp.

## NGUYÊN TẮC TRẢ LỜI
1. **Xác nhận nguồn gốc**: Khi có [TÀI LIỆU THÀNH PHẦN], hãy LUÔN bắt đầu câu trả lời bằng việc nêu rõ thông tin này thuộc **Môn nào** và **Lớp mấy** (Ví dụ: "Dựa trên dữ liệu môn Toán lớp 3, mình xin giải đáp như sau...").
2. **Ưu tiên kiến thức hệ thống**: Dùng tài liệu làm gốc, giải thích lại một cách sư phạm, sinh động.
3. **Tính ứng dụng cao**: Đưa ra ví dụ, trò chơi hoặc mẹo giảng dạy thực tế.

${ragContext ? `\n[TÀI LIỆU THÀNH PHẦN TỪ HỆ THỐNG]:\n${ragContext}` : ''}`;

    // --- 3.3 Truy xuất Lịch sử Trò chuyện ---
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: false })
      .limit(6);

    const chatHistory = (historyData || []).reverse().map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    if (chatHistory.length === 0 || chatHistory[chatHistory.length - 1].content !== message) {
      chatHistory.push({ role: 'user', content: message });
    }

    const aiResponse = await callAI(supabase, chatHistory as any, systemPrompt, temperature)

    // [Bước 4] Lưu phản hồi AI vào bảng messages
    const { data: aiMsg } = await supabase.from('messages').insert({
      session_id: currentSessionId,
      role: 'assistant',
      content: aiResponse.content,
      model_used: aiResponse.model,
      source: 'ai'
    }).select().single()

    return NextResponse.json({
      reply: aiResponse.content,
      source: 'ai',
      modelUsed: aiResponse.model,
      messageId: aiMsg?.id,
      sessionId: currentSessionId
    })
  } catch (error: any) {
    console.error('CHAT API ERROR:', error)
    return NextResponse.json({ 
      reply: "Rất tiếc, dường như có một lỗi nhỏ xảy ra khi tôi đang xử lý câu hỏi này. Bạn thử hỏi lại lần nữa được không? (Lỗi: " + error.message + ")",
      error: error.message,
      source: 'error'
    }, { status: 200 })
  }
}
