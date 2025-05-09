import fetch from 'node-fetch';

import { 
  S3Client, 
  ListBucketsCommand, 
  ListObjectsV2Command, 
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

// Define constants at the top of the file
const DEFAULT_BUCKET = "whispershard-assets";

// Initialize S3 client for Cloudflare R2
let s3Client: S3Client | null = null;

// S3 client configuration for Cloudflare R2
function getS3Client() {
  if (s3Client) return s3Client;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;

  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is not set");
  }

  if (!accessKey) {
    throw new Error("CLOUDFLARE_R2_ACCESS_KEY environment variable is not set");
  }

  if (!secretKey) {
    throw new Error("CLOUDFLARE_R2_SECRET_KEY environment variable is not set");
  }

  // Create and return a new S3 client
  s3Client = new S3Client({
    region: "auto", // R2 requires "auto" as the region
    endpoint: `https://7942b93dd6963bf3f88f8d7acdd3d909.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  return s3Client;
}

// Initialize Cloudflare R2 connection
export async function initCloudflareR2() {
  try {
    console.log("Initializing Cloudflare R2 connection...");
    
    // Check if required env variables are set
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
      console.warn("Warning: CLOUDFLARE_ACCOUNT_ID is not set");
      return { connected: false, error: "CLOUDFLARE_ACCOUNT_ID environment variable is not set" };
    }
    
    if (!process.env.CLOUDFLARE_R2_ACCESS_KEY) {
      console.warn("Warning: CLOUDFLARE_R2_ACCESS_KEY is not set");
      return { connected: false, error: "CLOUDFLARE_R2_ACCESS_KEY environment variable is not set" };
    }
    
    if (!process.env.CLOUDFLARE_R2_SECRET_KEY) {
      console.warn("Warning: CLOUDFLARE_R2_SECRET_KEY is not set");
      return { connected: false, error: "CLOUDFLARE_R2_SECRET_KEY environment variable is not set" };
    }
    
    // Attempt to list objects in our known bucket to verify connection
    try {
      const objects = await listObjects(DEFAULT_BUCKET);
      console.log(`Cloudflare R2 connection established. Found ${objects.length} objects in bucket ${DEFAULT_BUCKET}.`);
      return { connected: true };
    } catch (error) {
      console.error("Cloudflare R2 connection error:", error);
      return { 
        connected: false, 
        error: `R2 credentials may be invalid or missing permissions: ${(error as Error).message}` 
      };
    }
  } catch (error) {
    console.error("Cloudflare R2 initialization error:", error);
    return { connected: false, error: (error as Error).message };
  }
}

// List all buckets
export async function listBuckets() {
  try {
    const client = getS3Client();
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    
    return response.Buckets || [];
  } catch (error) {
    console.error("Error listing buckets:", error);
    throw error;
  }
}

// Upload an object to a bucket
export async function uploadObject(bucketName: string = DEFAULT_BUCKET, objectKey: string, fileBuffer: Buffer, contentType: string) {
  try {
    const client = getS3Client();
    
    const upload = new Upload({
      client,
      params: {
        Bucket: bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
      },
    });
    
    const result = await upload.done();
    
    return {
      success: true,
      key: objectKey,
      bucket: bucketName,
      etag: result.ETag,
    };
  } catch (error) {
    console.error("Error uploading object:", error);
    throw error;
  }
}

// Get object from a bucket
export async function getObject(bucketName: string = DEFAULT_BUCKET, objectKey: string) {
  try {
    const client = getS3Client();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    const response = await client.send(command);
    
    // Convert the readable stream to a buffer
    const bodyContents = await streamToBuffer(response.Body as Readable);
    
    return {
      success: true,
      data: bodyContents,
      contentType: response.ContentType,
    };
  } catch (error) {
    console.error("Error getting object:", error);
    throw error;
  }
}

// Helper function to convert a readable stream to a buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Delete object from a bucket
export async function deleteObject(bucketName: string = DEFAULT_BUCKET, objectKey: string) {
  try {
    const client = getS3Client();
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    
    await client.send(command);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting object:", error);
    throw error;
  }
}

// List objects in a bucket
export async function listObjects(bucketName: string = DEFAULT_BUCKET, prefix?: string) {
  try {
    const client = getS3Client();
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    
    const response = await client.send(command);
    
    return response.Contents || [];
  } catch (error) {
    console.error("Error listing objects:", error);
    throw error;
  }
}