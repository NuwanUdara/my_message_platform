import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  //GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "nuwan_messageDB";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  
  try {
    switch (event.routeKey) {
      case "GET /NAME/{uName}": // send DATA from user name
        body = await dynamo.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression:"username = :username",
            ExpressionAttributeValues:{
              ":username" : event.pathParameters.uName,
            },
            ProjectionExpression: "message, sent_time",
          })
        );
        body =body.Items;
        break;
        
      case "DELETE /NAME/{uName}": //delete all items from user
        body = await dynamo.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression:"username = :username",
            //FilterExpression: "contains (message)", //use this if you want to search for a message too
            ExpressionAttributeValues:{
              ":username" : event.pathParameters.uName,
            },
            ProjectionExpression: "usernamem, message, sent_time",
          })
        );
        let body1 =body.Items;// get all items
        //body1 = JSON.stringify(body1)
        
        for (const key in body1) {          
          let temUser= event.pathParameters.uName;
          let temTime= body1[key]['sent_time'];
          
          await dynamo.send(
            new DeleteCommand({
              TableName: tableName,
              Key:{
                username: temUser,
                sent_time:temTime
              }
            })
            );
          
        }
        
            body = `Deleted items for this user ${event.pathParameters.uName}` //${typeof(body1)} \n ${body1},${Object.keys(body1).length},${Object.keys(body1)}`;
            break

      
      case "GET /NAME": // Get ALL data from db
        body = await dynamo.send(
          new  ScanCommand({ TableName: tableName })
        );
        body = body.Items;
        break;
      case "PUT /NAME":
          
        let requestJSON = JSON.parse(event.body);
        let tim = new Date()
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              username: requestJSON.user,
              message:requestJSON.msg,
              sent_time: tim.toLocaleString()
            },
          })
        );
        body = `Put item to user ${requestJSON.user}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body); // final step
  }

  return {
    statusCode,
    body,
    headers,
  };
};
