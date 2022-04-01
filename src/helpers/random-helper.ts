export class RandomHelper {
  /**
   * 在闭区间内找一个随机整数返回，如果输入的 lb > ub, 则 lb 和 ub 的角色互换。
   *
   * @param lbInt 下确界
   * @param ubInt 上确界
   * @returns 随机整数
   */
  public static getRandomIntegerInclusively(
    lbInt: number,
    ubInt: number,
  ): number {
    const lowerBound = Math.min(lbInt, ubInt);
    const upperBound = Math.max(ubInt, lbInt);
    const lowerBoundInt = Math.floor(lowerBound);
    const upperBoundInt = Math.floor(upperBound) + 1;
    const delta = upperBoundInt - lowerBoundInt;
    const increase = delta * Math.random();
    const floatRandom = lowerBoundInt + increase;
    const randInt = Math.floor(floatRandom);

    return randInt;
  }
}
