import { api } from './api';

export interface OfficerPublic {
  id: string;
  name: string;
  officerPosition: string;
  collegeOrDept: string;
  photoUrl?: string; // optional — backend may return a Cloudinary/Supabase URL
}

export const officerService = {
  getPublicRoster: async (): Promise<OfficerPublic[]> => {
    const response = await api.get<{ success: boolean; data: OfficerPublic[] }>('/officers/public');
    return response.data.data;
  },
};
