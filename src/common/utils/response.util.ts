export class ResponseUtil {
  static success<T>(data: T, message?: string) {
    return { success: true, data, message: message ?? null };
  }
  static created<T>(data: T, message?: string) {
    return { success: true, data, message: message ?? 'Created' };
  }
  static deleted(message?: string) {
    return { success: true, message: message ?? 'Deleted' };
  }
}
