
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        email: string;
      };
      agent?: {
        id: number;
        email: string;
      };
    }
  }
}
