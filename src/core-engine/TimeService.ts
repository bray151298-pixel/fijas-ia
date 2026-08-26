/**
 * TimeService.ts
 * Centralized Date & Time Utility for FIJAS IA
 * Internal Canonical Representation: UTC (ISO 8601)
 * User Presentation: America/Lima (UTC-5)
 */

export class TimeService {
  public static readonly TIMEZONE_LIMA = "America/Lima";

  public static nowUtc(): string {
    return new Date().toISOString();
  }

  public static nowLima(): Date {
    return new Date(new Date().toLocaleString("en-US", { timeZone: this.TIMEZONE_LIMA }));
  }

  public static getLimaDateString(dateInput: string | Date = new Date()): string {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString("es-PE", { timeZone: this.TIMEZONE_LIMA });
  }

  public static getLimaTimeString(dateInput: string | Date = new Date()): string {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleTimeString("es-PE", {
      timeZone: this.TIMEZONE_LIMA,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  public static getLimaDateIsoFormat(dateInput: string | Date = new Date()): string {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.TIMEZONE_LIMA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);
    
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '08';
    const day = parts.find(p => p.type === 'day')?.value || '26';
    return `${year}${month}${day}`;
  }

  public static formatForTelegram(dateInput: string | Date): { dateStr: string; timeStr: string } {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const dateStr = d.toLocaleDateString("es-PE", {
      timeZone: this.TIMEZONE_LIMA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString("es-PE", {
      timeZone: this.TIMEZONE_LIMA,
      hour: '2-digit',
      minute: '2-digit'
    });
    return { dateStr, timeStr };
  }

  public static isFuture(eventUtc: string, minBufferSeconds: number = 0): boolean {
    const eventTime = new Date(eventUtc).getTime();
    const currentTime = Date.now();
    return (eventTime - currentTime) >= (minBufferSeconds * 1000);
  }

  public static getAgeSeconds(lastUpdatedUtc: string): number {
    const lastTime = new Date(lastUpdatedUtc).getTime();
    const currentTime = Date.now();
    return Math.max(0, Math.floor((currentTime - lastTime) / 1000));
  }

  public static isSameDayLima(dateUtc1: string, dateUtc2: string): boolean {
    const d1 = this.getLimaDateIsoFormat(dateUtc1);
    const d2 = this.getLimaDateIsoFormat(dateUtc2);
    return d1 === d2;
  }
}
