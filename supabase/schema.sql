-- NexusSNS Database Schema
-- Supabase SQL Editor에서 실행하세요

-- ==========================================
-- 테이블 생성
-- ==========================================

-- 프로필 테이블 (auth.users 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  tweets_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 트윗 테이블
CREATE TABLE IF NOT EXISTS public.tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  image_url TEXT,
  parent_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tweet_id)
);

-- 팔로우 테이블
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ==========================================
-- 인덱스
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON public.tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_parent_id ON public.tweets(parent_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON public.tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_tweet_id ON public.likes(tweet_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "프로필 공개 읽기" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "회원가입 시 프로필 생성" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- tweets 정책
CREATE POLICY "트윗 공개 읽기" ON public.tweets FOR SELECT USING (true);
CREATE POLICY "본인 트윗 작성" ON public.tweets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 트윗 삭제" ON public.tweets FOR DELETE USING (auth.uid() = user_id);

-- likes 정책
CREATE POLICY "좋아요 공개 읽기" ON public.likes FOR SELECT USING (true);
CREATE POLICY "본인 좋아요 추가" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 좋아요 취소" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- follows 정책
CREATE POLICY "팔로우 공개 읽기" ON public.follows FOR SELECT USING (true);
CREATE POLICY "본인 팔로우 추가" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "본인 팔로우 취소" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ==========================================
-- 트리거: 자동 카운터 업데이트
-- ==========================================

-- 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tweets SET likes_count = likes_count + 1 WHERE id = NEW.tweet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tweets SET likes_count = likes_count - 1 WHERE id = OLD.tweet_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_likes_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.tweets SET comments_count = comments_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.tweets SET comments_count = comments_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_comments_count
AFTER INSERT OR DELETE ON public.tweets
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- 팔로우 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_follow_counts
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 트윗 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_tweets_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE public.profiles SET tweets_count = tweets_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    UPDATE public.profiles SET tweets_count = tweets_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_tweets_count
AFTER INSERT OR DELETE ON public.tweets
FOR EACH ROW EXECUTE FUNCTION update_tweets_count();

-- ==========================================
-- 트리거: 신규 회원 프로필 자동 생성
-- ==========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTR(NEW.id::text, 1, 6),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- Storage 버킷 생성
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tweet-images', 'tweet-images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT DO NOTHING;

-- Storage 정책
CREATE POLICY "아바타 공개 읽기" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "아바타 업로드" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "아바타 수정" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "아바타 삭제" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "트윗이미지 공개 읽기" ON storage.objects FOR SELECT USING (bucket_id = 'tweet-images');
CREATE POLICY "트윗이미지 업로드" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tweet-images' AND auth.role() = 'authenticated');
CREATE POLICY "트윗이미지 삭제" ON storage.objects FOR DELETE USING (bucket_id = 'tweet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "커버이미지 공개 읽기" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "커버이미지 업로드" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');
CREATE POLICY "커버이미지 수정" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "커버이미지 삭제" ON storage.objects FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
