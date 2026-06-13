import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = '이메일을 입력해주세요'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다'
    if (!password) newErrors.password = '비밀번호를 입력해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다'
      toast.error(message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다' : message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-sky-500 text-5xl mb-4">✦</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NexusSNS에 로그인</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            로그인
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-sky-500 hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
