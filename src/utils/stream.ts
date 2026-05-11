/**
 * debuga-llm-gateway — Stream Utilities
 *
 * Helpers for SSE (Server-Sent Events) streaming of chat completions.
 */

import type { Response } from "express";

/**
 * Set up SSE headers on the response.
 */
export function setupSSEHeaders(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

/**
 * Pipe a provider's stream response to the Express response as SSE.
 *
 * The provider stream is expected to already be in SSE format
 * (data: {...}\n\n), as both vLLM and OpenAI-compatible APIs
 * return SSE natively when stream=true.
 */
export async function pipeStream(
  providerStream: ReadableStream<Uint8Array> | NodeJS.ReadableStream,
  res: Response
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Handle Web ReadableStream (from fetch)
    if ("getReader" in providerStream) {
      const reader = (providerStream as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();

      function pump(): void {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              res.end();
              resolve();
              return;
            }
            const text = decoder.decode(value, { stream: true });
            res.write(text);
            pump();
          })
          .catch((err) => {
            res.end();
            reject(err);
          });
      }

      pump();
    }
    // Handle Node.js ReadableStream
    else {
      const nodeStream = providerStream as NodeJS.ReadableStream;
      nodeStream.on("data", (chunk: Buffer | string) => {
        res.write(chunk);
      });
      nodeStream.on("end", () => {
        res.end();
        resolve();
      });
      nodeStream.on("error", (err: Error) => {
        res.end();
        reject(err);
      });
    }

    // Handle client disconnect
    res.on("close", () => {
      if ("getReader" in providerStream) {
        (providerStream as ReadableStream).cancel().catch(() => {});
      } else {
        (providerStream as NodeJS.ReadableStream).destroy?.();
      }
      resolve();
    });
  });
}
