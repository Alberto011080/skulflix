import { supabase } from './supabaseClient';

export async function registerUser({ username, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { username: username.trim() } },
  });
  if (error) throw new Error(error.message);

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, username: username.trim() });
  if (profileError) throw new Error(profileError.message);

  return { id: data.user.id, username: username.trim(), email: data.user.email };
}

export async function loginUser({ username, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error('Usuario o contraseña incorrectos.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user.id)
    .single();

  return { id: data.user.id, username: profile?.username || data.user.email, email: data.user.email };
}

export async function logoutUser() {
  await supabase.auth.signOut();
}
