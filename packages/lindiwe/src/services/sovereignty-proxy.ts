export interface SanitizedProfile {
  id: string;
  name: string;
  intentTags?: string[];
  profileType?: string;
}

export const sovereigntyProxy = {
  async getProfile(id: string): Promise<SanitizedProfile> {
    return { id, name: 'Unknown' };
  },
  async getSanitizedProfile(id: string): Promise<SanitizedProfile> {
    return { id, name: 'Unknown' };
  }
};