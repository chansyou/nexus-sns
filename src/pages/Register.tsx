import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

export function Register() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!displayName.trim()) newErrors.displayName = '이름을 입력해주세요'
    else if (displayName.trim().length < 2) newErrors.displayName = '이름은 2자 이상이어야 합니다'
    if (!email) newErrors.email = '이메일을 입력해주세요'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다'
    if (!password) newErrors.password = '비밀번호를 입력해주세요'
    else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
        },
      })
      if (error) throw error
      toast.success('회원가입이 완료되었습니다!')
      navigate('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다'
      toast.error(message === 'User already registered' ? '이미 가입된 이메일입니다' : message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-sky-500 text-5xl mb-4">✦</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NexusSNS 가입하기</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이름"
            type="text"
            placeholder="표시될 이름"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.displayName}
          />
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
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            가입하기
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-sky-500 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
