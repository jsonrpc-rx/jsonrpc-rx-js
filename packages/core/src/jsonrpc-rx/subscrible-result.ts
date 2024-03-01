import { toType } from 'src/util/to-type';

export type SubscribleResultDataItem = {
  subscribeId: string | number;
  subscribeValue: any;
};

export type SubscribleResultErrorItem = {
  subscribeId: string | number;
  subscribeError: any;
};

export enum SubscribleResultSatate {
  Next = 'next',
  Error = 'error',
  Complete = 'complete',
}

export type SubscribleResult = {
  isSubscribleResult: true | undefined;
  state: SubscribleResultSatate;
  subjectName: string;
  data?: SubscribleResultDataItem[];
  error?: SubscribleResultErrorItem[];
};

export function isSubscribleResult(result: SubscribleResult): boolean {
  const { isSubscribleResult, state, subjectName, data, error } = result ?? {};
  return (
    toType(result) === 'object' &&
    !!isSubscribleResult &&
    [SubscribleResultSatate.Next, SubscribleResultSatate.Error, SubscribleResultSatate.Complete].includes(state) &&
    toType(subjectName) === 'string' &&
    (toType(data) === 'array' || data == null) &&
    (toType(error) === 'array' || error == null)
  );
}
