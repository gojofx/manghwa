import express from "express";

const request = require('request');

export const router = express.Router();

export const root = async function (
    req: express.Request,
    res: express.Response
  ): Promise<any> {
    try {
      const responseMessage = 
        "Read the API Documentation at https://github.com/gojofx/manghwa";
      res.json({
        responseMessage,
      })
  
    } catch (error) {
      res.json({
        responseCode: 500,
        responseMessage: error,
        responseData: req.query
      })
    }
  }