import * as pdfjsLib from 'pdfjs-dist';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  PDFDocumentLoadingTask,
} from 'pdfjs-dist';

export class PdfDocumentManager {
  private document: PDFDocumentProxy | null = null;
  private loadingTask: PDFDocumentLoadingTask | null = null;

  async load(
    source: File | string
  ): Promise<PDFDocumentProxy> {
    await this.destroy();

    if (source instanceof File) {
      const data = await source.arrayBuffer();

      this.loadingTask = pdfjsLib.getDocument({
        data,
      });
    } else {
      this.loadingTask = pdfjsLib.getDocument(source);
    }

    const document = await this.loadingTask.promise;

    this.document = document;

    this.loadingTask = null;

    return document;
  }

  getDocument(): PDFDocumentProxy | null {
    return this.document;
  }

  async getPage(
    pageNumber: number
  ): Promise<PDFPageProxy> {
    if (!this.document) {
      throw new Error('No PDF document is loaded.');
    }

    if (
      pageNumber < 1 ||
      pageNumber > this.document.numPages
    ) {
      throw new Error(
        `Invalid page number: ${pageNumber}`
      );
    }

    return this.document.getPage(pageNumber);
  }

  getPageCount(): number {
    return this.document?.numPages ?? 0;
  }

  async destroy(): Promise<void> {
    try {
      if (this.loadingTask) {
        await this.loadingTask.destroy();
      }
    } catch (error) {
      console.warn(
        'Failed to destroy PDF loading task:',
        error
      );
    } finally {
      this.loadingTask = null;
    }

    if (this.document) {
      try {
        await this.document.destroy();
      } catch (error) {
        console.warn(
          'Failed to destroy PDF document:',
          error
        );
      } finally {
        this.document = null;
      }
    }
  }
}