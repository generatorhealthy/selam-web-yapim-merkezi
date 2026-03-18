-- Doki chat conversations
CREATE TABLE public.doki_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'Yeni Sohbet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Doki chat messages
CREATE TABLE public.doki_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.doki_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.doki_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doki_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users manage own conversations" ON public.doki_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only see messages in their own conversations
CREATE POLICY "Users manage own messages" ON public.doki_messages
  FOR ALL TO authenticated
  USING (conversation_id IN (SELECT id FROM public.doki_conversations WHERE user_id = auth.uid()))
  WITH CHECK (conversation_id IN (SELECT id FROM public.doki_conversations WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_doki_conversations_user ON public.doki_conversations(user_id, updated_at DESC);
CREATE INDEX idx_doki_messages_conversation ON public.doki_messages(conversation_id, created_at ASC);