import { toType } from '../util/to-type';

export type SubscribleResultDataItem = {
  subscribeId: string | number;
  subscribeValue?: any;
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

  const isData = toType(data) === 'array' && (data as any).every(isSubscribleResultDataItem) && error == null;
  const isError = toType(error) === 'array' && (error as any).every(isSubscribleResultErrorItem) && data == null;

  return (
    toType(result) === 'object' &&
    !!isSubscribleResult &&
    [SubscribleResultSatate.Next, SubscribleResultSatate.Error, SubscribleResultSatate.Complete].includes(state) &&
    toType(subjectName) === 'string' &&
    (isData || isError)
  );
}

function isSubscribleResultDataItem(item: SubscribleResultDataItem): boolean {
  const { subscribeId } = item ?? {};
  return toType(item) === 'object' && (toType(subscribeId) === 'string' || toType(subscribeId) === 'number');
}

function isSubscribleResultErrorItem(item: SubscribleResultErrorItem): boolean {
  const { subscribeId, subscribeError } = item ?? {};
  return toType(item) === 'object' && (toType(subscribeId) === 'string' || toType(subscribeId) === 'number') && subscribeError != null;
}
