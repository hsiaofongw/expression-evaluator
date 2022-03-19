export class ArrayHelper {
  public static toArray<T>(obj: Record<string, T>): T[] {
    const result: T[] = [];
    if (typeof obj === 'object') {
      for (const k in obj) {
        result.push(obj[k]);
      }
    }

    return result;
  }
}
