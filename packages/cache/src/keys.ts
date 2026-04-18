export const cacheKeys = {
  villageSummary(villageId: string): string {
    return `village:${villageId}:summary`;
  }
};
