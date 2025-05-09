import fetch from 'node-fetch';

// Cloudflare R2 API base URL
const getR2Url = (accountId: string, bucketName: string) => 
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}`;

// Cloudflare API credentials
const getCredentials = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const email = process.env.CLOUDFLARE_EMAIL;

  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is not set");
  }

  if (!accessKey) {
    throw new Error("CLOUDFLARE_R2_ACCESS_KEY environment variable is not set");
  }

  if (!secretKey) {
    throw new Error("CLOUDFLARE_R2_SECRET_KEY environment variable is not set");
  }

  return { accountId, accessKey, secretKey, apiToken, email };
};

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
    
    // Attempt to list buckets to verify connection
    try {
      const buckets = await listBuckets();
      console.log(`Cloudflare R2 connection established. Found ${buckets.length} buckets.`);
      return { connected: true };
    } catch (bucketError) {
      console.error("Cloudflare R2 bucket listing error:", bucketError);
      return { 
        connected: false, 
        error: `API token may be invalid or missing permissions: ${(bucketError as Error).message}` 
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
    const { accountId, accessKey, secretKey } = getCredentials();
    
    if (!accessKey || !secretKey) {
      throw new Error("CLOUDFLARE_R2_ACCESS_KEY and CLOUDFLARE_R2_SECRET_KEY are required but not set");
    }
    
    // Create Authorization header from access key and secret key
    const date = new Date().toUTCString();
    const headers = {
      'Content-Type': 'application/json',
      'X-Amz-Date': date,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/20230321/auto/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=${secretKey}`,
    };
    
    // Try Cloudflare R2 API authentication
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list buckets: ${response.status} ${errorText}`);
    }
    
    const data = await response.json() as any;
    return data.result || [];
  } catch (error) {
    console.error("Error listing buckets:", error);
    throw error;
  }
}

// Upload an object to a bucket
export async function uploadObject(bucketName: string, objectKey: string, fileBuffer: Buffer, contentType: string) {
  try {
    const { accountId, accessKey, secretKey } = getCredentials();
    
    // Create Authorization header from access key and secret key
    const date = new Date().toUTCString();
    const headers = {
      'Content-Type': contentType,
      'X-Amz-Date': date,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/20230321/auto/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=${secretKey}`,
    };
    
    const response = await fetch(
      `${getR2Url(accountId, bucketName)}/objects/${objectKey}`,
      {
        method: 'PUT',
        headers,
        body: fileBuffer,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload object: ${response.status} ${errorText}`);
    }
    
    return {
      success: true,
      key: objectKey,
      bucket: bucketName,
    };
  } catch (error) {
    console.error("Error uploading object:", error);
    throw error;
  }
}

// Get object from a bucket
export async function getObject(bucketName: string, objectKey: string) {
  try {
    const { accountId, accessKey, secretKey } = getCredentials();
    
    // Create Authorization header from access key and secret key
    const date = new Date().toUTCString();
    const headers = {
      'X-Amz-Date': date,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/20230321/auto/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=${secretKey}`,
    };
    
    const response = await fetch(
      `${getR2Url(accountId, bucketName)}/objects/${objectKey}`,
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get object: ${response.status} ${errorText}`);
    }
    
    return {
      success: true,
      data: await response.buffer(),
      contentType: response.headers.get('content-type'),
    };
  } catch (error) {
    console.error("Error getting object:", error);
    throw error;
  }
}

// Delete object from a bucket
export async function deleteObject(bucketName: string, objectKey: string) {
  try {
    const { accountId, apiToken, email } = getCredentials();
    
    const response = await fetch(
      `${getR2Url(accountId, bucketName)}/objects/${objectKey}`,
      {
        method: 'DELETE',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiToken,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete object: ${response.status} ${errorText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting object:", error);
    throw error;
  }
}

// List objects in a bucket
export async function listObjects(bucketName: string, prefix?: string) {
  try {
    const { accountId, apiToken, email } = getCredentials();
    
    let url = `${getR2Url(accountId, bucketName)}/objects`;
    if (prefix) {
      url += `?prefix=${encodeURIComponent(prefix)}`;
    }
    
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'X-Auth-Email': email,
          'X-Auth-Key': apiToken,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list objects: ${response.status} ${errorText}`);
    }
    
    const data = await response.json() as any;
    return data.result || [];
  } catch (error) {
    console.error("Error listing objects:", error);
    throw error;
  }
}