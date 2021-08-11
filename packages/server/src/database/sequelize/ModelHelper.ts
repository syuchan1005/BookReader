// according to https://github.com/sequelize/sequelize/issues/10579#issuecomment-574604414
// and https://github.com/RobinBuschmann/sequelize-typescript/issues/612#issuecomment-583728166
import { Model } from 'sequelize';

export function restoreSequelizeAttributesOnClass(newTarget, self: Model): void {
  [...Object.keys(newTarget.rawAttributes), ...Object.keys(newTarget.associations)].forEach(
    (propertyKey: keyof Model) => {
      Object.defineProperty(self, propertyKey, {
        get() {
          return self.getDataValue(propertyKey);
        },
        set(value) {
          self.setDataValue(propertyKey, value);
        },
        enumerable: true,
      });
    },
  );
}
