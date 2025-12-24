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
  const fnNotFound = lastErr && /not found/i.test(String(lastErr.message || ''));

  if (fnNotFound && isGet && (route === '/progress' || route.startsWith('/progress/'))) {
    try {
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
    } catch (err) {
      console.error('DB fallback error:', err);
      throw lastErr || err;
    }
  }

  throw lastErr || new Error('Failed to reach server function');
};