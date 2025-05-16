'use server'

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Create a new Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createUser(email: string, password: string, username: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
    }])
    .select()
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return newUser;
}

export async function verifyUser(email: string, password: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  const isValid = await bcrypt.compare(password, user.password || '');

  if (!isValid) {
    throw new Error('Invalid password');
  }

  return user;
} 