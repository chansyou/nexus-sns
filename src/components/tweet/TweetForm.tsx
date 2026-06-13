import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { Image, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { Tweet } from '../../types'
import toast from 'react-hot-toast'

interface TweetFormProps {
  parentId?: string
  onSuccess?: (tweet: Tweet) => void
  placeholder?: string
}

const MAX_CHARS = 280

export function TweetForm({ parentId, onSuccess, placeholder = '무슨 일이 일어나고 있나요?' }: TweetFormProps) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('이미지는 5MB 이하여야 합니다'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    const ext = imageFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('tweet-images').upload(path, imageFile)
    if (error) throw new Error('이미지 업로드 실패')
    const { data } = supabase.storage.from('tweet-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      const imageUrl = await uploadImage()
      const { data, error } = await supabase
        .from('tweets')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          parent_id: parentId ?? null,
        })
        .select('*, profile:profiles(*)')
        .single()

      if (error) throw error

      const newTweet = { ...data, is_liked: false } as unknown as Tweet
      onSuccess?.(newTweet)
      setContent('')
      removeImage()
    } catch {
      toast.error('트윗 작성에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex gap-3">
        <Avatar src={user.avatar_url} alt={user.display_name} size="md" />

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-lg resize-none focus:outline-none"
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img src={imagePreview} alt="미리보기" className="rounded-2xl max-h-64 max-w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-full transition-colors"
              >
                <Image size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={`text-sm ${remaining < 20 ? (isOverLimit ? 'text-red-500' : 'text-yellow-500') : 'text-gray-400'}`}>
                  {remaining}
                </span>
              )}
              <Button type="submit" disabled={!canSubmit} isLoading={isSubmitting} size="sm">
                {parentId ? '답글' : '트윗'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
