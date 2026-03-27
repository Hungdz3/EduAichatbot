'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Send, Lightbulb, MessageSquare } from 'lucide-react'

export default function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [featureRequest, setFeatureRequest] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  const submitEvaluation = async () => {
    if (rating === 0) return alert('Vui lòng chọn số sao đánh giá.')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('service_evaluations').insert({
        user_id: user?.id,
        rating,
        comment
      })
      setSubmitted(true)
    } catch (err) {
      alert('Lỗi khi gửi đánh giá.')
    } finally {
      setLoading(false)
    }
  }

  const submitFeature = async () => {
    if (!featureRequest.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('feature_requests').insert({
        user_id: user?.id,
        content: featureRequest
      })
      alert('Cảm ơn bạn! Yêu cầu của bạn đã được ghi nhận.')
      setFeatureRequest('')
    } catch (err) {
      alert('Lỗi khi gửi yêu cầu.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full text-center p-8 bg-white shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10 text-green-600 fill-current" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Cảm ơn bạn!</h2>
          <p className="text-slate-600 mb-8">Đánh giá của bạn giúp chúng tôi hoàn thiện EduAI tốt hơn mỗi ngày.</p>
          <Button onClick={() => setSubmitted(false)} className="bg-indigo-600 hover:bg-indigo-700">Gửi thêm góp ý</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10 space-y-10 max-w-4xl mx-auto w-full">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Góp Ý & Đánh Giá</h1>
        <p className="text-slate-500 text-lg">Chia sẻ trải nghiệm của bạn để giúp EduAI phát triển mạnh mẽ hơn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Đánh giá dịch vụ */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="bg-indigo-600 text-white">
            <CardTitle className="flex items-center text-lg">
              <Star className="w-5 h-5 mr-3" /> Đánh Giá Dịch Vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6 flex-1">
            <div className="flex flex-col items-center space-y-4">
              <p className="font-medium text-slate-700 text-center">Bạn hài lòng với chất lượng trả lời của chatbot EduAI chứ?</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`transition-all duration-200 ${
                      (hover || rating) >= star ? 'scale-125' : 'scale-100 text-slate-300'
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star className={`w-8 h-8 ${(hover || rating) >= star ? 'text-yellow-400 fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500 italic">
                {rating === 1 && "Rất không hài lòng"}
                {rating === 2 && "Không hài lòng"}
                {rating === 3 && "Bình thường"}
                {rating === 4 && "Hài lòng"}
                {rating === 5 && "Rất hài lòng"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Lời nhắn (không bắt buộc)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="EduAI có thể cải thiện điều gì cho bạn?"
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700"
              ></textarea>
            </div>

            <Button 
              onClick={submitEvaluation} 
              disabled={loading || rating === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200"
            >
              Gửi Đánh Giá
            </Button>
          </CardContent>
        </Card>

        {/* Yêu cầu thêm chatbot */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden flex flex-col">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="flex items-center text-lg">
              <Lightbulb className="w-5 h-5 mr-3" /> Yêu Cầu Tính Năng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl flex items-start">
                <MessageSquare className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed font-medium">Bạn muốn chatbot có thêm chức năng gì? Hay cần hỗ trợ thêm môn học nào? Hãy cho chúng tôi biết!</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nội dung góp ý thêm</label>
                <textarea
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="Ví dụ: Thêm chức năng tạo bài kiểm tra nhanh theo file PDF..."
                  className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-slate-700"
                ></textarea>
              </div>
            </div>

            <Button 
              onClick={submitFeature} 
              disabled={loading || !featureRequest.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-200"
            >
              <Send className="w-4 h-4 mr-2" /> Gửi Yêu Cầu
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
