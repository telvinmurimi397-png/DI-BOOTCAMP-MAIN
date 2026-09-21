export type Status = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';

export interface Resident {
  id: number;
  name: string;
  phone: string;
}

export interface Report {
  id: number;
  resident_id: number;
  title: string;
  description: string;
  area: string;
  category: string;
  status: Status;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  resident_name?: string;
  resident_phone?: string;
  avg_rating?: number;
  rating_count?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  resident?: Resident;
  ruler?: { id: number; username: string };
  reports?: Report[];
}
