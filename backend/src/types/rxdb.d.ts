import 'rxdb';

declare module 'rxdb' {
  interface RxDatabaseCreator<Collections, DatabaseMethods> {
    adapter?: string;
    ignoreDuplicate?: boolean;
    queryChangeDetection?: boolean;
  }
}
