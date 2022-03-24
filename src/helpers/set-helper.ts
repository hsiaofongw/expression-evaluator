export class SetHelper {
  public static union<T>(a: Set<T>, b: Set<T>): Set<T> {
    const s = new Set<T>();
    for (const item of a) {
      s.add(item);
    }

    for (const item of b) {
      s.add(item);
    }

    return s;
  }
}
