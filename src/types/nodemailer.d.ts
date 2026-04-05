declare module "nodemailer" {
  export type SendMailOptions = {
    from?: string;
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
  };

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  export function createTransport(options: unknown): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
