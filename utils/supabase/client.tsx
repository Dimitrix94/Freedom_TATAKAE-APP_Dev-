import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

let supabaseClient: ReturnType<
  typeof createSupabaseClient
> | null = null;

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
    );
  }
  return supabaseClient;
};

export const getServerUrl = (route: string) => {
  return `https://${projectId}.supabase.co/functions/v1/make-server-d59960c4${route}`;
};

const getServerUrls = (route: string) => {
  const base = `https://${projectId}.supabase.co/functions/v1`;
  return [
    `${base}/make-server-d59960c4${route}`,
  ];
};

export const getAnonKey = () => {
  return publicAnonKey;
};

export const serverFetch = async (
  route: string,
  init: RequestInit = {},
) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const authToken = session?.access_token || getAnonKey();
  const headers = {
    ...((init.headers as Record<string, string> | undefined) ||
      {}),
    Authorization: `Bearer ${authToken}`,
  };

  const urls = getServerUrls(route);
  let lastErr: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, { ...init, headers });
      if (res.ok) return res;

      let body: any = null;
      try {
        body = await res.clone().json();
      } catch {}

      const notFound = res.status === 404 || (body && (body.code === 'NOT_FOUND' || /not found/i.test(body.message || '')));
      if (notFound) {
        lastErr = new Error(body?.message || `Function not found at ${url}`);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  // Database fallback for progress routes ONLY
  const method = (init.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const isPost = method === 'POST';
  const isDelete = method === 'DELETE';
  const fnNotFound = lastErr && /not found/i.test(String(lastErr.message || ''));

  if (fnNotFound) {
    try {
      // Progress routes
      if (isGet && (route === '/progress' || route.startsWith('/progress/'))) {
        if (route === '/progress') {
          const { data, error } = await supabase
            .from('progress')
            .select('*')
            .order('recorded_at', { ascending: false });
          if (error) throw error;
          const progress = (data || []).map((record: any) => ({
            id: record.id,
            studentId: record.student_id,
            topic: record.topic,
            assessmentType: record.assessment_type,
            score: record.score,
            notes: record.notes,
            recordedBy: record.recorded_by,
            recordedAt: record.recorded_at,
          }));
          return {
            ok: true,
            status: 200,
            json: async () => ({ progress }),
          } as unknown as Response;
        }

        if (route.startsWith('/progress/')) {
          const studentId = route.slice('/progress/'.length);
          const { data, error } = await supabase
            .from('progress')
            .select('*')
            .eq('student_id', studentId)
            .order('recorded_at', { ascending: false });
          if (error) throw error;
          const progress = (data || []).map((record: any) => ({
            id: record.id,
            studentId: record.student_id,
            topic: record.topic,
            assessmentType: record.assessment_type,
            score: record.score,
            notes: record.notes,
            recordedBy: record.recorded_by,
            recordedAt: record.recorded_at,
          }));
          return {
            ok: true,
            status: 200,
            json: async () => ({ progress }),
          } as unknown as Response;
        }
      }

      // Materials routes
      if (isGet && route === '/materials') {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return {
          ok: true,
          status: 200,
          json: async () => ({ materials: data || [] }),
        } as unknown as Response;
      }

      // Topics routes
      if (isGet && route === '/topics') {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return {
          ok: true,
          status: 200,
          json: async () => ({ topics: data || [] }),
        } as unknown as Response;
      }

      // Announcements routes
      if (isGet && route === '/content/announcements') {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return {
          ok: true,
          status: 200,
          json: async () => ({ announcements: data || [] }),
        } as unknown as Response;
      }

      // Assessments routes
      if (isGet && route === '/assessments') {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return {
          ok: true,
          status: 200,
          json: async () => ({ assessments: data || [] }),
        } as unknown as Response;
      }

      // Submissions routes
      if (isGet && route === '/submissions') {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });
        if (error) throw error;
        return {
          ok: true,
          status: 200,
          json: async () => ({ submissions: data || [] }),
        } as unknown as Response;
      }

      // Delete account route
      if (isDelete && route === '/profile') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('Not authenticated');
        }
        
        // Delete user profile and related data
        await supabase.from('profiles').delete().eq('id', session.user.id);
        
        // Delete the auth user
        const { error } = await supabase.rpc('delete_user');
        if (error) throw error;
        
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        } as unknown as Response;
      }
    } catch (err) {
      console.error('DB fallback error:', err);
      throw lastErr || err;
    }
  }

  throw lastErr || new Error('Failed to reach server function');
};