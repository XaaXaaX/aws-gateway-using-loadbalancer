import { ALBEvent, ALBResult } from "aws-lambda";

export const handler = async (event: ALBEvent): Promise<ALBResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
    }),
  };
}