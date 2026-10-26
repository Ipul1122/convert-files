declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface Options {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function convertToHtml(input: { arrayBuffer: ArrayBuffer } | Options, options?: any): Promise<ConversionResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer } | Options): Promise<ConversionResult>;
}
