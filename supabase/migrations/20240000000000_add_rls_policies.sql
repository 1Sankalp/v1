-- Enable RLS on all tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Portfolios policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.portfolios FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.portfolios FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
ON public.portfolios FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.portfolios FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Accounts policies
CREATE POLICY "Users can manage their own accounts" 
ON public.accounts 
TO authenticated 
USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can manage their own sessions" 
ON public.sessions 
TO authenticated 
USING (auth.uid() = user_id);

-- Verification tokens policies
CREATE POLICY "Verification tokens are only accessible during auth" 
ON public.verification_tokens 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Default deny
ALTER TABLE public.portfolios FORCE ROW LEVEL SECURITY;
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens FORCE ROW LEVEL SECURITY; 