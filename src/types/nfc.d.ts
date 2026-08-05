interface NDEFRecord {
  readonly recordType: string;
  readonly mediaType?: string;
  readonly id?: string;
  readonly data?: DataView;
  readonly encoding?: string;
  readonly lang?: string;
}

interface NDEFMessage {
  readonly records: ReadonlyArray<NDEFRecord>;
}

interface NDEFReadingEvent extends Event {
  readonly serialNumber: string;
  readonly message: NDEFMessage;
}

interface NDEFRecordInit {
  recordType: string;
  data?: string | BufferSource | Record<string, unknown>;
  mediaType?: string;
  id?: string;
  encoding?: string;
  lang?: string;
}

interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

interface NDEFScanOptions {
  signal?: AbortSignal;
}

interface NDEFWriteOptions {
  signal?: AbortSignal;
  overwrite?: boolean;
}

interface NDEFReader extends EventTarget {
  scan(options?: NDEFScanOptions): Promise<void>;
  write(
    message: string | NDEFMessageInit,
    options?: NDEFWriteOptions
  ): Promise<void>;
  addEventListener(
    type: 'reading',
    listener: (event: NDEFReadingEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: 'readingerror',
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: 'reading',
    listener: (event: NDEFReadingEvent) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

declare const NDEFReader: {
  prototype: NDEFReader;
  new (): NDEFReader;
};
