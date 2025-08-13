import { Request } from "express";
import { FileFiltercallback } from "multer";

export interface ValidatorFunctionType {
  (req:Request, file:Express.Multer.File, callback:FileFiltercallback):void;
}

export interface uploadHandlerType {
  fields?:unknown;
  validationFunction:unknown;
  limit:number | null;
}

export type resourceTypes = "image" | "raw" | "auto" | "video";