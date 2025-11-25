import { Request, Response } from "express";
import paymentService from "../services/payment.service";
import HttpStatusCode from "../core/utils/httpResponse";

export const initiatePayment = async (req: Request, res: Response) => {
  const {
    email,
    channels,
    currency,
    agentId,
    apartmentId,
    startDates,
    endDates ,
    phoneNumber,
    nextofKinName,
    nextofKinNumber,
    fullName,
  } = req.body;

  try {
    const result = await paymentService.initiatePayment(
      email,
      channels,
      currency,
      agentId,  
      apartmentId,
      startDates,
      endDates, 
      phoneNumber,
      nextofKinName,
      nextofKinNumber,
      fullName,
      req
    );

    res.status(HttpStatusCode.HTTP_OK).json({
      message: "Payment initialized successfully",
      data: result,
    });

    return;
  } catch (error) {
    if (error instanceof Error) {
      res.status(HttpStatusCode.HTTP_BAD_REQUEST).json({
        message: error.message,
      });

      return;
    } else {
      res.status(HttpStatusCode.HTTP_INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
      });

      return;
    }
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    const result = await paymentService.verifyPayment(reference);

    res.status(HttpStatusCode.HTTP_OK).json({
      message: "Payment verified successfully",
      data: result,
    });

    return;
  } catch (error) {
    if (error instanceof Error) {
      res.status(HttpStatusCode.HTTP_BAD_REQUEST).json({
        message: error.message,
      });

      return;
    } else {
      res.status(HttpStatusCode.HTTP_INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
      });

      return;
    }
  }
};
