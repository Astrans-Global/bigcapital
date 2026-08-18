import * as FormData from 'form-data';
import { Chromiumly } from './Chromiumly';
import { GotenbergUtils } from './GotenbergUtils';

/**
 * Converts an Office document (xlsx/docx/...) to PDF via Gotenberg's
 * LibreOffice route. Used for statutory invoice PDFs so the PDF matches
 * the filled Excel template rather than a separate HTML layout.
 */
export class LibreOfficeConverter {
  private readonly endpoint: string;

  constructor() {
    this.endpoint = `${Chromiumly.GOTENBERG_ENDPOINT}/${Chromiumly.LIBRE_OFFICE_PATH}/${Chromiumly.LIBRE_OFFICE_ROUTES.convert}`;
  }

  public async convertXlsx(buffer: Buffer, filename = 'invoice.xlsx'): Promise<Buffer> {
    const data = new FormData();
    data.append('files', buffer, {
      filename,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const pdf = await GotenbergUtils.fetch(this.endpoint, data);
    if (!pdf) {
      throw new Error('Gotenberg LibreOffice conversion returned an empty PDF');
    }
    return Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf as ArrayBuffer);
  }
}
