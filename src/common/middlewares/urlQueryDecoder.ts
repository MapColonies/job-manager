import { Request, Response, NextFunction, Handler } from 'express';
import { injectable } from 'tsyringe';

@injectable()
export class UrlQueryDecoder {
  public getUrlParamDecoderMiddleware(): Handler {
    return (req: Request, res: Response, next: NextFunction): void => {
      for (const entry of Object.entries(req.query)) {
        req.query[entry[0]] = decodeURIComponent(entry[1] as string);
      }
      return next();
    };
  }
}
