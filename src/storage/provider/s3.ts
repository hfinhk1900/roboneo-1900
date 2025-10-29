import { randomUUID } from 'crypto';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3mini } from 's3mini';
import { storageConfig } from '../config/storage-config';
import {
  ConfigurationError,
  type StorageConfig,
  StorageError,
  type StorageProvider,
  type SignedUrlOptions,
  UploadError,
  type UploadFileParams,
  type UploadFileResult,
} from '../types';

/**
 * Amazon S3 storage provider implementation using s3mini
 *
 * docs:
 * https://mksaas.com/docs/storage
 *
 * This provider works with Amazon S3 and compatible services like Cloudflare R2
 * using s3mini for better Cloudflare Workers compatibility
 * https://github.com/good-lly/s3mini
 * https://developers.cloudflare.com/r2/
 */
export class S3Provider implements StorageProvider {
  private config: StorageConfig;
  private s3Client: s3mini | null = null;
  private s3SignedClient: S3Client | null = null;

  constructor(config: StorageConfig = storageConfig) {
    this.config = config;
  }

  /**
   * Get the provider name
   */
  public getProviderName(): string {
    return 'S3';
  }

  /**
   * Get the S3 client instance
   */
  private getS3Client(): s3mini {
    if (this.s3Client) {
      return this.s3Client;
    }

    const { region, endpoint, accessKeyId, secretAccessKey, bucketName } =
      this.config;

    if (!region) {
      throw new ConfigurationError('Storage region is not configured');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new ConfigurationError('Storage credentials are not configured');
    }

    if (!endpoint) {
      throw new ConfigurationError('Storage endpoint is required for s3mini');
    }

    if (!bucketName) {
      throw new ConfigurationError('Storage bucket name is not configured');
    }

    // s3mini client configuration
    // The bucket name needs to be included in the endpoint URL for s3mini
    const endpointWithBucket = `${endpoint.replace(/\/$/, '')}/${bucketName}`;

    this.s3Client = new s3mini({
      accessKeyId,
      secretAccessKey,
      endpoint: endpointWithBucket,
      region,
    });

    return this.s3Client;
  }

  /**
   * Get AWS SDK client for signed URL generation
   */
  private getS3SignedClient(): S3Client {
    if (this.s3SignedClient) {
      return this.s3SignedClient;
    }

    const { region, endpoint, accessKeyId, secretAccessKey, bucketName, forcePathStyle } =
      this.config;

    if (!region) {
      throw new ConfigurationError('Storage region is not configured');
    }
    if (!accessKeyId || !secretAccessKey) {
      throw new ConfigurationError('Storage credentials are not configured');
    }
    if (!endpoint) {
      throw new ConfigurationError('Storage endpoint is required for signing');
    }
    if (!bucketName) {
      throw new ConfigurationError('Storage bucket name is not configured');
    }

    this.s3SignedClient = new S3Client({
      region,
      endpoint: endpoint.replace(/\/$/, ''),
      forcePathStyle: forcePathStyle !== false,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.s3SignedClient;
  }

  /**
   * Generate a unique filename with the original extension
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || '';
    const uuid = randomUUID();
    return `${uuid}${extension ? `.${extension}` : ''}`;
  }

  /**
   * Upload a file to S3
   */
  public async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const { file, filename, contentType, folder } = params;
      const s3 = this.getS3Client();
      const { bucketName } = this.config;

      const uniqueFilename = this.generateUniqueFilename(filename);
      const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

      // Convert Blob to Buffer if needed
      let fileContent: Buffer | string;
      if (file instanceof Blob) {
        fileContent = Buffer.from(await file.arrayBuffer());
      } else {
        fileContent = file;
      }

      // Upload the file using s3mini
      const response = await s3.putObject(key, fileContent, contentType);

      if (!response.ok) {
        throw new UploadError(`Failed to upload file: ${response.statusText}`);
      }

      // Generate the URL
      const { publicUrl } = this.config;
      let url: string;

      if (publicUrl) {
        // Use custom domain if provided
        url = `${publicUrl.replace(/\/$/, '')}/${key}`;
        console.log('uploadFile, public url', url);
      } else {
        // For s3mini, we construct the URL manually
        // Since bucket is included in endpoint, we just append the key
        const baseUrl = this.config.endpoint?.replace(/\/$/, '') || '';
        url = `${baseUrl}/${key}`;
        console.log('uploadFile, constructed url', url);
      }

      return { url, key };
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('uploadFile, configuration error', error);
        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during file upload';
      console.error('uploadFile, error', message);
      throw new UploadError(message);
    }
  }

  /**
   * Delete a file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      const s3 = this.getS3Client();

      const wasDeleted = await s3.deleteObject(key);

      if (!wasDeleted) {
        console.warn(
          `File with key ${key} was not found or could not be deleted`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during file deletion';
      console.error('deleteFile, error', message);
      throw new StorageError(message);
    }
  }

  /**
   * Read a file from S3 and return its content as Buffer
   */
  public async getFile(key: string): Promise<Buffer> {
    try {
      const s3 = this.getS3Client();
      const arrayBuffer = await s3.getObjectArrayBuffer(key);
      if (!arrayBuffer) {
        throw new Error('Empty response when fetching object from storage');
      }
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during file read';
      console.error('getFile, error', message);
      throw new StorageError(message);
    }
  }

  /**
   * Generate a signed URL for a stored object
   */
  public async getSignedUrl(
    key: string,
    options: SignedUrlOptions = {}
  ): Promise<string> {
    try {
      const client = this.getS3SignedClient();
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        ResponseContentDisposition: options.responseDisposition,
        ResponseContentType: options.responseContentType,
      });

      const expiresIn = Math.max(
        1,
        Math.min(options.expiresIn ?? 3600, 60 * 60 * 24)
      );

      return await awsGetSignedUrl(client, command, { expiresIn });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during signed URL generation';
      console.error('getSignedUrl, error', message);
      throw new StorageError(message);
    }
  }
}
