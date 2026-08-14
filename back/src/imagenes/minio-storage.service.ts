import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady = false;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || "http://minio:9000";
    const region = process.env.MINIO_REGION || "us-east-1";
    const accessKeyId = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretAccessKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    this.bucket = process.env.MINIO_BUCKET || "product-images";

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  async ensureBucketExists() {
    if (this.bucketReady) {
      return;
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketReady = true;
      return;
    } catch {
      // ignore
    }
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    this.bucketReady = true;
  }

  async putObject(params: {
    key: string;
    body: Uint8Array;
    contentType?: string | null;
  }) {
    await this.ensureBucketExists();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType || undefined,
      })
    );
  }

  async getObject(key: string) {
    return await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async deleteObject(key: string) {
    await this.ensureBucketExists();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

