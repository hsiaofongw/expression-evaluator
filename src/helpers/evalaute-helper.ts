import { IContext } from 'src/translate/interfaces';

export class EvaluateHelper {
  public static makeEmptyContext(): IContext {
    return {
      definitions: {
        arguments: [],
        builtin: [],
        delayedAssign: [],
        fixedAssign: [],
      },

      parent: undefined,
    };
  }
}
