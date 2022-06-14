const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const client = new S3Client(clientParams);
const command = new GetObjectCommand(getObjectParams);
const url = await getSignedUrl(client, command, { expiresIn: 3600 });