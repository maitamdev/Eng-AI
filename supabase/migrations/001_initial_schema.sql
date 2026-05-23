-- ============================================
-- ENG.AI Database Schema v1.0
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- BẢNG USERS (mở rộng từ auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,                    -- Cấp độ tổng: 1-10
  xp INTEGER DEFAULT 0,                       -- Điểm kinh nghiệm
  streak_days INTEGER DEFAULT 0,              -- Streak học liên tiếp
  last_active_date DATE,                      -- Ngày học gần nhất
  current_goal TEXT DEFAULT 'general',        -- general | ielts | toefl | business | travel
  english_level TEXT DEFAULT 'beginner',      -- beginner | elementary | intermediate | upper | advanced
  learning_style TEXT DEFAULT 'balanced',     -- visual | auditory | reading | kinesthetic | balanced
  daily_goal_minutes INTEGER DEFAULT 15,      -- Mục tiêu học mỗi ngày (phút)
  total_study_minutes INTEGER DEFAULT 0,      -- Tổng thời gian học
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG SKILL STATS (tiến độ từng kỹ năng)
-- ============================================
CREATE TABLE IF NOT EXISTS public.skill_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,                        -- conversation | vocabulary | writing | pronunciation | listening | reading
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0,      -- % đúng trung bình
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill)
);

-- ============================================
-- BẢNG CONVERSATIONS (lịch sử hội thoại AI)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  scenario TEXT,                              -- job_interview | restaurant | travel | shopping | medical | business
  messages JSONB DEFAULT '[]',               -- [{role, content, timestamp, corrections}]
  ai_feedback TEXT,                           -- Nhận xét tổng thể sau session
  xp_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG VOCABULARY (từ vựng cá nhân)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  pronunciation TEXT,                         -- IPA
  part_of_speech TEXT,                        -- noun | verb | adj | adv | phrase
  difficulty TEXT DEFAULT 'medium',           -- easy | medium | hard
  topic TEXT,                                 -- business | travel | academic | daily | tech
  -- Spaced Repetition System (SRS)
  ease_factor DECIMAL(4,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  is_mastered BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual',               -- manual | conversation | lesson | camera
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG WRITING SUBMISSIONS (bài viết)
-- ============================================
CREATE TABLE IF NOT EXISTS public.writing_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT,                                -- Đề bài
  content TEXT NOT NULL,                      -- Nội dung bài viết
  writing_type TEXT DEFAULT 'essay',          -- essay | email | story | report | ielts_task1 | ielts_task2
  -- AI Scoring
  overall_score DECIMAL(4,2),                -- Điểm tổng (IELTS scale 0-9 hoặc 0-100)
  grammar_score DECIMAL(4,2),
  vocabulary_score DECIMAL(4,2),
  coherence_score DECIMAL(4,2),
  task_achievement_score DECIMAL(4,2),
  ai_feedback TEXT,                           -- Nhận xét chi tiết từ AI
  corrections JSONB,                          -- [{original, corrected, explanation}]
  word_count INTEGER,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG LESSONS (bài học được AI tạo)
-- ============================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  skill TEXT,                                 -- skill liên quan
  content JSONB,                              -- Nội dung bài học (linh hoạt theo skill)
  source_url TEXT,                            -- YouTube URL nếu học từ video
  source_type TEXT DEFAULT 'ai_generated',    -- ai_generated | youtube | news | podcast
  difficulty TEXT DEFAULT 'intermediate',
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,                              -- Điểm hoàn thành (0-100)
  xp_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG DAILY CHALLENGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_date DATE DEFAULT CURRENT_DATE,
  skill TEXT,
  content JSONB,                              -- Nội dung thử thách
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 50,
  UNIQUE(user_id, challenge_date)
);

-- ============================================
-- BẢNG ACHIEVEMENTS (huy hiệu)
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,              -- first_conversation | streak_7 | vocab_100 | etc.
  achievement_name TEXT,
  description TEXT,
  icon TEXT,                                  -- emoji hoặc icon name
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- ============================================
-- BẢNG MISTAKE PATTERNS (AI phân tích lỗi)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mistake_patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  error_type TEXT,                            -- grammar | vocabulary | pronunciation | spelling
  error_category TEXT,                        -- tense | preposition | article | word_choice | etc.
  example TEXT,                               -- Câu bị sai
  correction TEXT,                            -- Câu đúng
  frequency INTEGER DEFAULT 1,               -- Số lần mắc lỗi này
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  skill_source TEXT,                          -- Lỗi xảy ra ở kỹ năng nào
  UNIQUE(user_id, error_type, error_category)
);

-- ============================================
-- BẢNG BATTLE SESSIONS (thi đấu 1v1)
-- ============================================
CREATE TABLE IF NOT EXISTS public.battle_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player1_id UUID REFERENCES public.profiles(id),
  player2_id UUID REFERENCES public.profiles(id),
  winner_id UUID REFERENCES public.profiles(id),
  battle_type TEXT DEFAULT 'vocabulary',      -- vocabulary | grammar | listening
  questions JSONB,                            -- Câu hỏi của trận đấu
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting',             -- waiting | active | completed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BẢNG STUDY SESSIONS (tracking thời gian)
-- ============================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill TEXT,
  duration_seconds INTEGER,
  xp_earned INTEGER DEFAULT 0,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: user chỉ thấy data của mình
-- Note: Use DROP POLICY IF EXISTS or CREATE POLICY to make it safe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own skills') THEN
    CREATE POLICY "Users can manage own skills" ON public.skill_stats FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own conversations') THEN
    CREATE POLICY "Users can manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own vocabulary') THEN
    CREATE POLICY "Users can manage own vocabulary" ON public.vocabulary FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own writing') THEN
    CREATE POLICY "Users can manage own writing" ON public.writing_submissions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own lessons') THEN
    CREATE POLICY "Users can manage own lessons" ON public.lessons FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own challenges') THEN
    CREATE POLICY "Users can manage own challenges" ON public.daily_challenges FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own achievements') THEN
    CREATE POLICY "Users can view own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own mistakes') THEN
    CREATE POLICY "Users can manage own mistakes" ON public.mistake_patterns FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own sessions') THEN
    CREATE POLICY "Users can manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Battle players can view') THEN
    CREATE POLICY "Battle players can view" ON public.battle_sessions FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Battle players can update') THEN
    CREATE POLICY "Battle players can update" ON public.battle_sessions FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);
  END IF;
END
$$;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Tự tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Tạo skill stats mặc định cho 6 kỹ năng
  INSERT INTO public.skill_stats (user_id, skill)
  VALUES
    (NEW.id, 'conversation'),
    (NEW.id, 'vocabulary'),
    (NEW.id, 'writing'),
    (NEW.id, 'pronunciation'),
    (NEW.id, 'listening'),
    (NEW.id, 'reading');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cập nhật streak tự động
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_active_date INTO v_last_date FROM public.profiles WHERE id = p_user_id;
  IF v_last_date = v_today - 1 THEN
    UPDATE public.profiles SET streak_days = streak_days + 1, last_active_date = v_today WHERE id = p_user_id;
  ELSIF v_last_date != v_today THEN
    UPDATE public.profiles SET streak_days = 1, last_active_date = v_today WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cộng XP và update level
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id UUID, p_xp INTEGER, p_skill TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE public.profiles SET xp = xp + p_xp WHERE id = p_user_id RETURNING xp INTO v_new_xp;
  v_new_level := LEAST(10, FLOOR(v_new_xp / 500) + 1);
  UPDATE public.profiles SET level = v_new_level WHERE id = p_user_id;
  IF p_skill IS NOT NULL THEN
    UPDATE public.skill_stats SET xp = xp + p_xp, last_practiced_at = NOW() WHERE user_id = p_user_id AND skill = p_skill;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
