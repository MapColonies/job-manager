import { randUuid } from '@ngneat/falso';

export const createUuid = (): string => {
  return randUuid();
};
